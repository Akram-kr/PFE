"use client";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";
import {
  ADMIN_ROLE,
  DEAN_ROLE,
  RECTOR_ROLE,
  COUNCIL_ROLE,
} from "@/lib/contract";

export type UserRole =
  | "admin"
  | "dean"
  | "rector"
  | "council"
  | "student"
  | "none";

export function useRole() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const { data: role = "none", isLoading } = useQuery({
    queryKey: ["role", address],
    enabled: Boolean(isConnected && address && publicClient),
    queryFn: async (): Promise<UserRole> => {
      if (!address || !publicClient) {
        return "none";
      }

      try {
        const [isAdmin, isDean, isRector, isCouncil] = (await Promise.all([
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: DIPLOMA_ABI,
            functionName: "hasRole",
            args: [ADMIN_ROLE, address],
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
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: DIPLOMA_ABI,
            functionName: "hasRole",
            args: [COUNCIL_ROLE, address],
          }),
        ])) as [boolean, boolean, boolean, boolean];

        if (isRector) return "rector";
        if (isDean) return "dean";
        if (isAdmin) return "admin";
        if (isCouncil) return "council";
        return "student";
      } catch (error) {
        return "none";
      }
    },
  });

  return { role, isLoading, address };
}
