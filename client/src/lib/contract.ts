import { createPublicClient, http, keccak256, stringToBytes } from "viem";
import { hardhat } from "wagmi/chains";
import { DIPLOMA_ABI } from "./abi";
import { CONTRACT_ADDRESS } from "./wagmi";

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
export const COUNCIL_ROLE = keccak256(
  stringToBytes("COUNCIL_ROLE"),
) as `0x${string}`;
export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

// ── Batch status labels ───────────────────────────────────────────────────────
// 0 Proposed | 1 Deliberated | 2 SignedByDean | 3 SignedByRector | 4 Finalized | 5 Cancelled
export const BATCH_STATUS_LABELS: Record<number, string> = {
  0: "Proposé",
  1: "Délibéré",
  2: "Signé par le Doyen",
  3: "Signé par le Recteur",
  4: "Finalisé",
  5: "Annulé",
};

export const BATCH_STATUS = {
  Proposed: 0,
  Deliberated: 1,
  SignedByDean: 2,
  SignedByRector: 3,
  Finalized: 4,
  Cancelled: 5,
} as const;

// ── Progression status (LMD) ─────────────────────────────────────────────────
export const PROGRESSION_STATUS = {
  Ajourne: 0,
  AdmisAvecDettes: 1,
  Admis: 2,
} as const;

export const PROGRESSION_LABELS: Record<number, string> = {
  0: "Ajourné",
  1: "Admis avec dettes",
  2: "Admis",
};

export const PROGRESSION_COLORS: Record<number, string> = {
  0: "bg-red-100 text-red-800 border-red-200",
  1: "bg-amber-100 text-amber-800 border-amber-200",
  2: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/** Cycles that, when Admis, are entitled to mint a diploma NFT. */
export function isFinalCycle(cycle: number): boolean {
  return cycle === 2 /* L3 */ || cycle === 4 /* M2 */;
}

/** Default Contrôle Continu weight (%) — matches the contract default. */
export const DEFAULT_CC_WEIGHT = 40;
/** Min credits (out of 60) to be "Admis avec dettes" in an intermediate year. */
export const CREDITS_THRESHOLD_DEBTS = 30;

export const BATCH_STATUS_COLORS: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 border-yellow-200",
  1: "bg-indigo-100 text-indigo-800 border-indigo-200",
  2: "bg-blue-100 text-blue-800 border-blue-200",
  3: "bg-purple-100 text-purple-800 border-purple-200",
  4: "bg-green-100 text-green-800 border-green-200",
  5: "bg-red-100 text-red-800 border-red-200",
};

// ── Grading scale ────────────────────────────────────────────────────────────
/** Passing grade in centi-points (10.00 / 20). */
export const PASS_GRADE = 1000;
/** Maximum representable grade (20.00 / 20). */
export const MAX_GRADE = 2000;

/** Convert a uint16 0..2000 moyenne to a display string "12.50". */
export function formatMoyenne(m: number | bigint): string {
  const n = typeof m === "bigint" ? Number(m) : m;
  return (n / 100).toFixed(2);
}

/** Parse a UI string like "12,5" or "12.50" into a uint16 (0..2000). Returns NaN if invalid. */
export function parseMoyenne(input: string): number {
  const cleaned = input.trim().replace(",", ".");
  if (cleaned === "") return NaN;
  const f = Number(cleaned);
  if (!Number.isFinite(f) || f < 0 || f > 20) return NaN;
  return Math.round(f * 100);
}

/** Derive a mention (0..3) from a moyenne in centi-points. Matches the on-chain rule. */
export function mentionFromMoyenne(m: number): number {
  if (m < 1200) return 0; // Passable
  if (m < 1400) return 1; // Assez Bien
  if (m < 1600) return 2; // Bien
  return 3; // Très Bien
}

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
  { value: 0, label: "L1 — Licence 1" },
  { value: 1, label: "L2 — Licence 2" },
  { value: 2, label: "L3 — Licence 3" },
  { value: 3, label: "M1 — Master 1" },
  { value: 4, label: "M2 — Master 2" },
];

export const CYCLE_SHORT: Record<number, string> = {
  0: "L1",
  1: "L2",
  2: "L3",
  3: "M1",
  4: "M2",
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
