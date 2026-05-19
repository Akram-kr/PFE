import { createPublicClient, http, keccak256, stringToBytes } from "viem";
import { hardhat } from "wagmi/chains";
import { DIPLOMA_ABI } from "./abi";
import { CONTRACT_ADDRESS } from "./wagmi";

export type DiplomaRecord = {
  studentName: string;
  matricule: string;
  dateOfBirth: string;
  placeOfBirth: string;
  metadataCID: string;
  sha256Hash: `0x${string}`;
  university: string;
  specialty: number;
  cycle: number;
  department: string;
  graduationYear: number;
  mention: number;
  issuedAt: bigint;
  ipfsHash: `0x${string}`;
  valid: boolean;
  revocationReason: string;
  batchId: bigint;
  mintedAt: bigint;
};
export type StudentEntry = {
  wallet: `0x${string}`;
  studentName: string;
  matricule: string;
  dateOfBirth: string;
  placeOfBirth: string;
  metadataCID: string;
  sha256Hash: `0x${string}`;
  specialty: number;
  cycle: number;
  department: string;
  graduationYear: number;
  mention: number;
};

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"),
});

export const diplomaContract = {
  address: CONTRACT_ADDRESS,
  abi: DIPLOMA_ABI,
} as const;

// ── Role hashes (keccak256 of the role name string) ──────────────────────────
export const ADMIN_ROLE = keccak256(
  stringToBytes("ADMIN_ROLE"),
) as `0x${string}`;
export const DEAN_ROLE = keccak256(stringToBytes("DEAN_ROLE")) as `0x${string}`;
export const RECTOR_ROLE = keccak256(
  stringToBytes("RECTOR_ROLE"),
) as `0x${string}`;
export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

// ── Batch status labels ───────────────────────────────────────────────────────
export const BATCH_STATUS_LABELS: Record<number, string> = {
  0: "Proposé",
  1: "Signé par le Doyen",
  2: "Signé par le Recteur",
  3: "Émis",
  4: "Annulé",
};

export const BATCH_STATUS_COLORS: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 border-yellow-200",
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-purple-100 text-purple-800 border-purple-200",
  3: "bg-green-100 text-green-800 border-green-200",
  4: "bg-red-100 text-red-800 border-red-200",
};

// ── Specialty / Cycle / Mention maps ─────────────────────────────────────────
export const SPECIALTY_OPTIONS = [
  { value: 0, label: "SIQ — Sécurité Informatique et Qualité" },
  {
    value: 1,
    label: "ISIL — Ingénierie des Systèmes d'Information et Logiciel",
  },
  { value: 2, label: "AI — Intelligence Artificielle" },
  { value: 3, label: "Réseau — Réseaux Informatiques" },
];

export const SPECIALTY_SHORT: Record<number, string> = {
  0: "SIQ",
  1: "ISIL",
  2: "AI",
  3: "Réseau",
};

export const CYCLE_OPTIONS = [
  { value: 0, label: "L3 — Licence" },
  { value: 1, label: "M2 — Master" },
];

export const CYCLE_SHORT: Record<number, string> = {
  0: "L3",
  1: "M2",
};

export const MENTION_OPTIONS = [
  { value: 0, label: "Passable" },
  { value: 1, label: "Assez Bien" },
  { value: 2, label: "Bien" },
  { value: 3, label: "Très Bien" },
];

export const MENTION_LABELS: Record<number, string> = {
  0: "Passable",
  1: "Assez Bien",
  2: "Bien",
  3: "Très Bien",
};

export const MENTION_COLORS: Record<number, string> = {
  0: "bg-slate-100 text-slate-700",
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-green-100 text-green-700",
};

// ── Timestamp formatter ───────────────────────────────────────────────────────
export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) * 1000 : ts * 1000;
  return new Date(ms).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── SHA-256 helper (browser crypto API) ──────────────────────────────────────
export async function sha256File(file: File): Promise<`0x${string}`> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as `0x${string}`;
}

export async function sha256Buffer(
  buffer: ArrayBuffer,
): Promise<`0x${string}`> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as `0x${string}`;
}

// ── IPFS gateway helper ───────────────────────────────────────────────────────
export function ipfsUrl(cid: string): string {
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  return `${gateway}/${cid}`;
}
