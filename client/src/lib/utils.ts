import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) * 1000 : ts * 1000;
  return new Date(ms).toLocaleDateString("fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
