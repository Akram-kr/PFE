// ─── Key Derivation ────────────────────────────────────────────────────────

const SIGN_MESSAGE =
  "Sign this message to unlock your DecentraVault. This does not cost gas.";
const KDF_SALT = new TextEncoder().encode("DecentraVault-v1-salt");

/**
 * Ask MetaMask to sign a deterministic message, then derive a 256-bit AES key
 * from that signature using PBKDF2 (100k iterations).
 * The raw key never leaves the browser's RAM.
 */
export async function deriveKeyFromWallet(
  address: string,
  signMessage: (msg: string) => Promise<string>,
): Promise<CryptoKey> {
  const signature = await signMessage(SIGN_MESSAGE);
  const sigBytes = new TextEncoder().encode(signature);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    sigBytes,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: KDF_SALT, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ─── Encryption ────────────────────────────────────────────────────────────

export interface EncryptedFile {
  ciphertext: ArrayBuffer;
  iv: string; // 24-char hex string
}

/**
 * Encrypt a file's ArrayBuffer using AES-GCM with a fresh random IV.
 * Returns the ciphertext and the IV hex string to store on-chain.
 */
export async function encryptFile(
  buffer: ArrayBuffer,
  key: CryptoKey,
): Promise<EncryptedFile> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer,
  );
  return { ciphertext, iv: bufferToHex(iv) };
}

/**
 * Decrypt a file ciphertext using AES-GCM.
 * @param ciphertext - The raw encrypted bytes
 * @param ivHex      - The 24-char hex IV stored on-chain
 * @param key        - The derived AES key
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  ivHex: string,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = hexToBuffer(ivHex);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}

// ─── Integrity ─────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 of an ArrayBuffer and return as a 0x-prefixed hex string.
 * Call this on the ORIGINAL file BEFORE encryption.
 * Store the result as bytes32 on-chain.
 */
export async function sha256Hex(buffer: ArrayBuffer): Promise<`0x${string}`> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return `0x${bufferToHex(new Uint8Array(hashBuffer))}`;
}

/**
 * Verify a downloaded+decrypted file against the on-chain hash.
 */
export async function verifyIntegrity(
  buffer: ArrayBuffer,
  onChainHash: string,
): Promise<boolean> {
  const computed = await sha256Hex(buffer);
  return computed.toLowerCase() === onChainHash.toLowerCase();
}

// ─── Sharding ──────────────────────────────────────────────────────────────

/**
 * Split an ArrayBuffer into exactly 3 equal-ish shards.
 * The last shard absorbs any remainder bytes.
 */
export function shardBuffer(buffer: ArrayBuffer): [Blob, Blob, Blob] {
  const bytes = new Uint8Array(buffer);
  const shardSize = Math.ceil(bytes.length / 3);
  return [
    new Blob([bytes.slice(0, shardSize)]),
    new Blob([bytes.slice(shardSize, shardSize * 2)]),
    new Blob([bytes.slice(shardSize * 2)]),
  ];
}

/**
 * Reassemble 3 shard ArrayBuffers back into a single ArrayBuffer.
 * Order matters — pass them as [shard0, shard1, shard2].
 */
export function reassembleShards(shards: ArrayBuffer[]): ArrayBuffer {
  const totalLength = shards.reduce((acc, s) => acc + s.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const shard of shards) {
    result.set(new Uint8Array(shard), offset);
    offset += shard.byteLength;
  }
  return result.buffer;
}

// ─── IPFS via Pinata ───────────────────────────────────────────────────────

/**
 * Upload a single shard Blob to IPFS via Pinata.
 * Returns the CID string.
 */
export async function uploadShardToPinata(
  shard: Blob,
  fileName: string,
  shardIndex: number,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", shard, `${fileName}.shard${shardIndex}`);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `${fileName}-shard-${shardIndex}` }),
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok)
    throw new Error(
      `Pinata upload failed for shard ${shardIndex}: ${res.statusText}`,
    );
  const data = await res.json();
  return data.IpfsHash as string;
}

/**
 * Upload all 3 shards in parallel and return their CIDs.
 */
export async function uploadAllShards(
  shards: [Blob, Blob, Blob],
  fileName: string,
): Promise<[string, string, string]> {
  const [cid0, cid1, cid2] = await Promise.all([
    uploadShardToPinata(shards[0], fileName, 0),
    uploadShardToPinata(shards[1], fileName, 1),
    uploadShardToPinata(shards[2], fileName, 2),
  ]);
  return [cid0, cid1, cid2];
}

/**
 * Fetch a single shard from IPFS via Pinata gateway.
 */
export async function fetchShard(cid: string): Promise<ArrayBuffer> {
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
  const res = await fetch(`${gateway}/ipfs/${cid}`);
  if (!res.ok)
    throw new Error(`Failed to fetch shard ${cid}: ${res.statusText}`);
  return res.arrayBuffer();
}

/**
 * Fetch all 3 shards in parallel.
 */
export async function fetchAllShards(
  cids: [string, string, string],
): Promise<ArrayBuffer[]> {
  return Promise.all(cids.map(fetchShard));
}

// ─── Utils ─────────────────────────────────────────────────────────────────

export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(ext: string): string {
  const icons: Record<string, string> = {
    pdf: "📄",
    png: "🖼",
    jpg: "🖼",
    jpeg: "🖼",
    gif: "🖼",
    webp: "🖼",
    mp4: "🎬",
    mov: "🎬",
    avi: "🎬",
    mkv: "🎬",
    mp3: "🎵",
    wav: "🎵",
    flac: "🎵",
    doc: "📝",
    docx: "📝",
    txt: "📝",
    md: "📝",
    xls: "📊",
    xlsx: "📊",
    csv: "📊",
    zip: "📦",
    rar: "📦",
    tar: "📦",
    gz: "📦",
    js: "💻",
    ts: "💻",
    py: "💻",
    sol: "💻",
  };
  return icons[ext.toLowerCase()] || "📁";
}
