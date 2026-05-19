import { FILE_STORAGE_ABI } from "./filestorage-abi";

export { FILE_STORAGE_ABI };

/**
 * Deployed FileStorage contract address.
 *
 * Set NEXT_PUBLIC_FILE_STORAGE_ADDRESS in your .env.local to enable
 * end-to-end encrypted, sharded diploma PDF storage.
 *
 * When this is undefined the ProposeBatchForm falls back to plain
 * (unencrypted) single-file IPFS uploads.
 */
export const FILE_STORAGE_ADDRESS =
  (process.env.NEXT_PUBLIC_FILE_STORAGE_ADDRESS as `0x${string}` | undefined) ?? undefined;

/** True when the FileStorage contract is configured and encryption is active. */
export const FILESTORAGE_ENABLED = !!FILE_STORAGE_ADDRESS;

/**
 * wagmi contract config shorthand.
 * Only valid when FILESTORAGE_ENABLED is true.
 */
export const fileStorageContract = {
  address : FILE_STORAGE_ADDRESS as `0x${string}`,
  abi     : FILE_STORAGE_ABI,
} as const;
