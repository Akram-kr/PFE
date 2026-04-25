"use client";

import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants/index";
import { getAddress } from "viem";

export function VaultDebug() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();

  // Raw direct call — no abstraction, no hook wrapping
  const { data, error, isLoading, isFetched } = useQuery({
    queryKey: ["debug-files", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      console.log("=== DEBUG: calling getUserFiles ===");
      console.log("contract address:", CONTRACT_ADDRESS);
      console.log("wallet address:", address);
      console.log("chain:", publicClient?.chain?.name, publicClient?.chain?.id);

      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getUserFiles",
        account: address,
      });

      console.log("raw result:", result);
      console.log("result length:", (result as unknown[]).length);
      return result;
    },
  });

  // Also check totalStorageUsed — if > 0 files ARE on chain
  const { data: storageUsed } = useQuery({
    queryKey: ["debug-storage", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalStorageUsed",
        args: [address!],
      });
      console.log("totalStorageUsed:", result);
      return result;
    },
  });

  // Also check file count
  const { data: fileCount } = useQuery({
    queryKey: ["debug-count", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getFileCount",
        account: address,
      });
      console.log("getFileCount:", result);
      return result;
    },
  });

  if (!isConnected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-black border border-yellow-500 rounded-lg p-4 max-w-sm text-xs font-mono">
      <p className="text-yellow-400 font-bold mb-2">🔍 Vault Debug</p>

      <div className="space-y-1 text-gray-300">
        <p>
          Connected:{" "}
          <span className="text-green-400">{isConnected ? "yes" : "no"}</span>
        </p>
        <p>
          Chain:{" "}
          <span className="text-green-400">
            {chain?.name} (id: {chain?.id})
          </span>
        </p>
        <p>
          Wallet:{" "}
          <span className="text-green-400">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        </p>
        <p>
          Contract:{" "}
          <span className="text-green-400">
            {CONTRACT_ADDRESS?.slice(0, 6)}…{CONTRACT_ADDRESS?.slice(-4)}
          </span>
        </p>

        <div className="border-t border-gray-700 my-2" />

        <p>
          publicClient:{" "}
          <span className={publicClient ? "text-green-400" : "text-red-400"}>
            {publicClient ? "ok" : "MISSING"}
          </span>
        </p>
        <p>
          isLoading:{" "}
          <span className="text-white">{isLoading ? "yes" : "no"}</span>
        </p>
        <p>
          isFetched:{" "}
          <span className="text-white">{isFetched ? "yes" : "no"}</span>
        </p>

        <div className="border-t border-gray-700 my-2" />

        <p>
          fileCount:{" "}
          <span className="text-yellow-300">
            {fileCount?.toString() ?? "null"}
          </span>
        </p>
        <p>
          storageUsed:{" "}
          <span className="text-yellow-300">
            {storageUsed?.toString() ?? "null"}
          </span>
        </p>
        <p>
          getUserFiles length:{" "}
          <span className="text-yellow-300">
            {Array.isArray(data) ? data.length : "null"}
          </span>
        </p>

        {error && (
          <div className="border-t border-red-700 mt-2 pt-2">
            <p className="text-red-400">Error:</p>
            <p className="text-red-300 break-all">{(error as Error).message}</p>
          </div>
        )}

        {Array.isArray(data) && data.length > 0 && (
          <div className="border-t border-gray-700 mt-2 pt-2">
            <p className="text-green-400">Files found: {data.length}</p>
            {(data as any[]).map((f, i) => (
              <p key={i} className="text-gray-400 truncate">
                [{i}] {f.fileName} — exists: {f.exists?.toString()}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
