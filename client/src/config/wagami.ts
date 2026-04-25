"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia } from "wagmi/chains"; // 1. Import hardhat

export const config = getDefaultConfig({
  appName: "DecentraVault",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "YOUR_PROJECT_ID",
  // 2. Put hardhat FIRST in the array to make it the default
  chains: [
    hardhat,
    ...(process.env.NODE_ENV === "development" ? [sepolia] : []),
  ],
  ssr: true,
});
