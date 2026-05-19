"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useMemo } from "react";
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
  | "council"
  | "dean"
  | "rector"
  | "student"
  | "none";

export function useRole() {
  const { address, isConnected } = useAccount();

  // Multi-call batching built right into Wagmi
  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: DIPLOMA_ABI,
        functionName: "hasRole",
        args: [ADMIN_ROLE, address as `0x${string}`],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: DIPLOMA_ABI,
        functionName: "hasRole",
        args: [COUNCIL_ROLE, address as `0x${string}`],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: DIPLOMA_ABI,
        functionName: "hasRole",
        args: [DEAN_ROLE, address as `0x${string}`],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: DIPLOMA_ABI,
        functionName: "hasRole",
        args: [RECTOR_ROLE, address as `0x${string}`],
      },
    ],
    query: {
      enabled: !!address && isConnected,
      staleTime: 30_000, // Keeps role state stable for 30 seconds before re-verifying
    },
  });

  // Calculate roles reactively
  const rolesState = useMemo(() => {
    if (!isConnected || !address) {
      return {
        role: "none" as UserRole,
        allRoles: [],
        isAdmin: false,
        isCouncil: false,
        isDean: false,
        isRector: false,
        isStudent: false,
      };
    }

    if (!data) {
      return {
        role: "student" as UserRole,
        allRoles: [],
        isAdmin: false,
        isCouncil: false,
        isDean: false,
        isRector: false,
        isStudent: true,
      };
    }

    const [isAdmin, isCouncil, isDean, isRector] = data.map(
      (res) => !!res.result,
    );

    // Build list of all roles assigned to this account
    const allRoles: UserRole[] = [];
    if (isAdmin) allRoles.push("admin");
    if (isCouncil) allRoles.push("council");
    if (isDean) allRoles.push("dean");
    if (isRector) allRoles.push("rector");
    if (allRoles.length === 0) allRoles.push("student");

    // Determine primary routing role (Priority hierarchy)
    let primaryRole: UserRole = "student";
    if (isRector) primaryRole = "rector";
    else if (isDean) primaryRole = "dean";
    else if (isCouncil) primaryRole = "council";
    else if (isAdmin) primaryRole = "admin";

    return {
      role: primaryRole,
      allRoles,
      isAdmin,
      isCouncil,
      isDean,
      isRector,
      isStudent: allRoles.includes("student"),
    };
  }, [data, address, isConnected]);

  return {
    ...rolesState,
    isLoading: isLoading && isConnected,
    isError,
    address,
    refreshRoles: refetch,
  };
}
