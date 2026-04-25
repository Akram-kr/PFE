"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useSignMessage } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants/index";
import {
  deriveKeyFromWallet,
  encryptFile,
  decryptFile,
  shardBuffer,
  reassembleShards,
  uploadAllShards,
  fetchAllShards,
  sha256Hex,
  verifyIntegrity,
  formatBytes,
} from "@/app/lib/crypto";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface VaultFile {
  ipfsHashes: [string, string, string];
  fileName: string;
  fileExtension: string;
  fileSize: bigint;
  timestamp: bigint;
  encryptionIv: string;
  fileHash: `0x${string}`;
  version: bigint;
  exists: boolean;
  index: number;
}

export type UploadStage =
  | "idle"
  | "hashing"
  | "encrypting"
  | "sharding"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

export type DownloadStage =
  | "idle"
  | "fetching"
  | "reassembling"
  | "decrypting"
  | "verifying"
  | "done"
  | "error";

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useVault() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [downloadStage, setDownloadStage] = useState<DownloadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // AES key cached in RAM — user signs MetaMask once per session
  const cachedKey = useRef<CryptoKey | null>(null);

  // ── Read files using useQuery (refetch is always defined) ─────────────

  const {
    data: rawFiles,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["vaultFiles", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!publicClient || !address) return [];
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getUserFiles",
        account: address,
      });
      return result as VaultFile[];
    },
  });

  const { data: remainingStorage } = useQuery({
    queryKey: ["remainingStorage", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!publicClient || !address) return BigInt(0);
      return publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getRemainingStorage",
        account: address,
      }) as Promise<bigint>;
    },
  });

  const { data: totalUsed } = useQuery({
    queryKey: ["totalUsed", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!publicClient || !address) return BigInt(0);
      return publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalStorageUsed",
        args: [address],
      }) as Promise<bigint>;
    },
  });

  // ── Invalidate all queries after any write ────────────────────────────
  // This is the correct pattern — invalidate cache, React Query refetches automatically

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["vaultFiles", address] });
    await queryClient.invalidateQueries({
      queryKey: ["remainingStorage", address],
    });
    await queryClient.invalidateQueries({ queryKey: ["totalUsed", address] });
  }, [queryClient, address]);

  // ── Files with index injected ─────────────────────────────────────────

  const files: VaultFile[] = (rawFiles ?? []).map((f, i) => ({
    ...f,
    index: i,
  }));

  // ── AES key derivation ────────────────────────────────────────────────

  const getKey = useCallback(async (): Promise<CryptoKey> => {
    if (cachedKey.current) return cachedKey.current;
    if (!address) throw new Error("Wallet not connected");
    const key = await deriveKeyFromWallet(address, (msg) =>
      signMessageAsync({ message: msg }),
    );
    cachedKey.current = key;
    return key;
  }, [address, signMessageAsync]);

  const clearCachedKey = useCallback(() => {
    cachedKey.current = null;
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      setError(null);
      setUploadProgress(0);

      try {
        const buffer = await file.arrayBuffer();
        const ext = file.name.split(".").pop() ?? "";

        // 1. SHA-256 hash of original file (before encryption)
        setUploadStage("hashing");
        const fileHash = await sha256Hex(buffer);
        setUploadProgress(15);

        // 2. Derive AES-256 key from MetaMask signature (cached)
        const key = await getKey();
        setUploadProgress(25);

        // 3. AES-GCM encrypt
        setUploadStage("encrypting");
        const { ciphertext, iv } = await encryptFile(buffer, key);
        setUploadProgress(40);

        // 4. Split encrypted ciphertext into 3 equal shards
        setUploadStage("sharding");
        const shards = shardBuffer(ciphertext);
        setUploadProgress(50);

        // 5. Upload all 3 shards to IPFS via Pinata in parallel
        setUploadStage("uploading");
        const cids = await uploadAllShards(shards, file.name);
        setUploadProgress(80);

        // 6. Write CIDs + metadata to blockchain
        setUploadStage("confirming");
        const txHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "uploadFile",
          args: [
            cids,
            file.name,
            ext,
            BigInt(file.size),
            iv,
            fileHash as `0x${string}`,
          ],
        });

        // 7. Wait for tx to be mined — CRITICAL, do not skip
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }

        setUploadProgress(100);
        setUploadStage("done");

        // 8. Invalidate React Query cache → triggers fresh read from chain
        await invalidateAll();

        setTimeout(() => setUploadStage("idle"), 2000);
      } catch (err: unknown) {
        setUploadStage("error");
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      }
    },
    [getKey, writeContractAsync, publicClient, invalidateAll],
  );

  // ── Download ──────────────────────────────────────────────────────────

  const downloadFile = useCallback(
    async (vaultFile: VaultFile): Promise<void> => {
      setError(null);
      setDownloadStage("fetching");

      try {
        // 1. Fetch 3 shards from IPFS simultaneously
        const shardBuffers = await fetchAllShards(vaultFile.ipfsHashes);
        setDownloadStage("reassembling");

        // 2. Stitch shards back into ciphertext
        const ciphertext = reassembleShards(shardBuffers);
        setDownloadStage("decrypting");

        // 3. Re-derive key and decrypt
        const key = await getKey();
        const decrypted = await decryptFile(
          ciphertext,
          vaultFile.encryptionIv,
          key,
        );
        setDownloadStage("verifying");

        // 4. Verify SHA-256 matches on-chain hash
        const valid = await verifyIntegrity(decrypted, vaultFile.fileHash);
        if (!valid)
          throw new Error(
            "Integrity check failed — file may have been tampered with",
          );

        setDownloadStage("done");

        // 5. Trigger browser download
        const blob = new Blob([decrypted]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = vaultFile.fileName;
        a.click();
        URL.revokeObjectURL(url);

        setTimeout(() => setDownloadStage("idle"), 1500);
      } catch (err: unknown) {
        setDownloadStage("error");
        setError(err instanceof Error ? err.message : "Download failed");
        throw err;
      }
    },
    [getKey],
  );

  // ── Delete ────────────────────────────────────────────────────────────

  const deleteFile = useCallback(
    async (index: number): Promise<void> => {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "deleteFile",
        args: [BigInt(index)],
      });
      if (publicClient)
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      await invalidateAll();
    },
    [writeContractAsync, publicClient, invalidateAll],
  );

  // ── Rename ────────────────────────────────────────────────────────────

  const renameFile = useCallback(
    async (index: number, newName: string): Promise<void> => {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "renameFile",
        args: [BigInt(index), newName],
      });
      if (publicClient)
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      await invalidateAll();
    },
    [writeContractAsync, publicClient, invalidateAll],
  );

  // ── Share ─────────────────────────────────────────────────────────────

  const shareFile = useCallback(
    async (index: number, recipientAddress: `0x${string}`): Promise<void> => {
      const placeholder = new TextEncoder().encode("SHARE_KEY_PLACEHOLDER");
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "shareFile",
        args: [BigInt(index), recipientAddress, placeholder],
      });
      if (publicClient)
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      await invalidateAll();
    },
    [writeContractAsync, publicClient, invalidateAll],
  );

  // ── Storage stats ─────────────────────────────────────────────────────

  const MAX_STORAGE = 1024 * 1024 * 1024;
  const used = totalUsed ? Number(totalUsed) : 0;
  const storagePercent = Math.min((used / MAX_STORAGE) * 100, 100);
  const usedFormatted = formatBytes(used);
  const remainingFormatted = formatBytes(
    remainingStorage ? Number(remainingStorage) : MAX_STORAGE,
  );

  return {
    files,
    filesLoading,
    refetchFiles,
    storagePercent,
    usedFormatted,
    remainingFormatted,
    uploadFile,
    uploadStage,
    uploadProgress,
    downloadFile,
    downloadStage,
    deleteFile,
    renameFile,
    shareFile,
    clearCachedKey,
    error,
    setError,
  };
}
