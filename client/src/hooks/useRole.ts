"use client";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";
import { keccak256, toHex, stringToBytes } from "viem";
import { DEAN_ROLE, ADMIN_ROLE, RECTOR_ROLE } from "@/lib/contract";
export type UserRole = "admin" | "dean" | "rector" | "student" | "none";

export function useRole() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: role = "none", isLoading } = useQuery({
    queryKey: ["role", address],
    enabled: !!address && !!publicClient,
    queryFn: async (): Promise<UserRole> => {
      if (!address || !publicClient) return "none";

      const [isAdmin, isDean, isRector] = (await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DIPLOMA_ABI,
          functionName: "hasRole",
          args: [ADMIN_ROLE, address!],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DIPLOMA_ABI,
          functionName: "hasRole",
          args: [DEAN_ROLE, address],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DIPLOMA_ABI,
          functionName: "hasRole",
          args: [RECTOR_ROLE, address],
        }),
      ])) as [boolean, boolean, boolean];

      if (isRector) return "rector";
      if (isDean) return "dean";
      if (isAdmin) return "admin";
      return "student";
    },
  });

  return { role, isLoading, address };
}
