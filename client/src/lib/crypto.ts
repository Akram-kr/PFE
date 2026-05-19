/**
 * Client-side AES-GCM encryption utilities for DiploChain FileStorage.
 *
 * Security model:
 *  - The encryption KEY is derived from the user's MetaMask signature and
 *    NEVER touches the blockchain or any server.
 *  - Only the IV (initialisation vector) is stored on-chain.
 *  - Files are encrypted before upload and split into 3 shards.
 */

const SIGN_MESSAGE = "DiploChain FileStorage Key — authorise file encryption";

// ── Key derivation ────────────────────────────────────────────────────────────

/**
 * Derives a 256-bit AES-GCM key from a MetaMask signature.
 * Since the signature is deterministic for a given wallet + message,
 * the same key can be re-derived at any time without storing it.
 */
export async function deriveEncryptionKey(signature: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/** The canonical message to sign when requesting the encryption key. */
export { SIGN_MESSAGE };

// ── Encryption ────────────────────────────────────────────────────────────────

export interface EncryptResult {
  encryptedData : ArrayBuffer;
  /** 24 hex-character AES-GCM IV (12 bytes). Stored on-chain. */
  iv            : string;
}

/**
 * Encrypts a File using AES-GCM.
 * A fresh random IV is generated for every call.
 */
export async function encryptFile(
  file : File,
  key  : CryptoKey,
): Promise<EncryptResult> {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, fileBuffer);
  return {
    encryptedData : ciphertext,
    iv            : Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

/**
 * Encrypts a raw ArrayBuffer using AES-GCM.
 * Use this when you already have the buffer (e.g. from file.arrayBuffer()).
 */
export async function encryptBuffer(
  buffer : ArrayBuffer,
  key    : CryptoKey,
): Promise<EncryptResult> {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buffer);
  return {
    encryptedData : ciphertext,
    iv            : Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

// ── Decryption ────────────────────────────────────────────────────────────────

/**
 * Decrypts an AES-GCM encrypted buffer.
 * @param encryptedBuffer  The ciphertext returned by encryptFile / encryptBuffer
 * @param key              The same CryptoKey used for encryption
 * @param ivHex            The 24-character hex IV string stored on-chain
 */
export async function decryptBuffer(
  encryptedBuffer : ArrayBuffer,
  key             : CryptoKey,
  ivHex           : string,
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(
    ivHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  );
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedBuffer);
}

// ── Sharding ──────────────────────────────────────────────────────────────────

/**
 * Splits an ArrayBuffer into exactly `shardCount` shards.
 * The last shard may be smaller than the others.
 */
export function shardBuffer(
  buffer     : ArrayBuffer,
  shardCount = 3,
): ArrayBuffer[] {
  const shards    : ArrayBuffer[] = [];
  const totalSize  = buffer.byteLength;
  const shardSize  = Math.ceil(totalSize / shardCount);

  for (let i = 0; i < shardCount; i++) {
    const start = i * shardSize;
    const end   = Math.min(start + shardSize, totalSize);
    shards.push(buffer.slice(start, end));
  }

  return shards;
}

/**
 * Reassembles shards back into a single ArrayBuffer.
 * Use after downloading all 3 shard CIDs from IPFS.
 */
export function reassembleShards(shards: ArrayBuffer[]): ArrayBuffer {
  const totalSize = shards.reduce((acc, s) => acc + s.byteLength, 0);
  const result    = new Uint8Array(totalSize);
  let offset = 0;
  for (const shard of shards) {
    result.set(new Uint8Array(shard), offset);
    offset += shard.byteLength;
  }
  return result.buffer;
}

// ── SHA-256 helpers ───────────────────────────────────────────────────────────

/** Computes the SHA-256 of a File (before encryption). Returns "0x…" bytes32. */
export async function sha256File(file: File): Promise<`0x${string}`> {
  return sha256Buffer(await file.arrayBuffer());
}

/** Computes the SHA-256 of an ArrayBuffer. Returns "0x…" bytes32. */
export async function sha256Buffer(buffer: ArrayBuffer): Promise<`0x${string}`> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const hex  = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as `0x${string}`;
}
