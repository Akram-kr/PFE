"use server";

/**
 * Pinata IPFS upload helpers.
 *
 * pinMetadataToIPFS  – pins any JSON object to IPFS
 * pinFileToIPFS      – pins a raw file buffer to IPFS (used for PDF shards)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiplomaMetadata {
  studentName       : string;
  matricule?        : string;
  dateOfBirth?      : string;
  placeOfBirth?     : string;
  cycle?            : string;
  specialty?        : string;
  mention?          : string;
  department?       : string;
  university?       : string;
  graduationYear?   : number;
  academicYear?     : string;
  issueDate?        : string;
  contractAddress?  : string;
  tokenId?          : number;
  // Plain PDF (no encryption)
  diplomaPdfCID?    : string;
  // Encrypted + sharded PDF (FileStorage mode)
  shardCIDs?        : [string, string, string];
  encryptionIv?     : string;
  fileStorageOwner? : string;
}

// ── JSON metadata ─────────────────────────────────────────────────────────────

/**
 * Pins a JSON metadata object to IPFS via Pinata.
 * Requires PINATA_JWT env var (server-side only).
 */
export async function pinMetadataToIPFS(
  metadata : Record<string, unknown>,
  name     : string,
): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.warn("[Pinata] PINATA_JWT not set — returning deterministic test CID");
    return generateTestCID(name);
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method  : "POST",
    headers : {
      "Content-Type" : "application/json",
      Authorization  : `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent  : metadata,
      pinataMetadata : { name },
    }),
  });

  if (!res.ok) throw new Error(`Pinata JSON pin failed: ${await res.text()}`);
  return ((await res.json()) as { IpfsHash: string }).IpfsHash;
}

// ── File / shard upload ───────────────────────────────────────────────────────

/**
 * Pins a file buffer to IPFS via Pinata.
 * Used for individual PDF shards (each shard is uploaded separately).
 */
export async function pinFileToIPFS(
  fileBuffer : ArrayBuffer,
  filename   : string,
  mimeType   = "application/octet-stream",
): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.warn("[Pinata] PINATA_JWT not set — returning deterministic test CID");
    return generateTestCID(filename);
  }

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: mimeType }), filename);
  form.append("pinataMetadata", JSON.stringify({ name: filename }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method  : "POST",
    headers : { Authorization: `Bearer ${jwt}` },
    body    : form,
  });

  if (!res.ok) throw new Error(`Pinata file pin failed: ${await res.text()}`);
  return ((await res.json()) as { IpfsHash: string }).IpfsHash;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function generateTestCID(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `QmTest${hex}LocalHardhatDevelopmentCID000000000000000000`;
}
