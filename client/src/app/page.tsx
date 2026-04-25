"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/NavBar";
import { LandingPage } from "@/components/layout/LandingPage";
import { VaultDashboard } from "@/components/vault/VaultDashboard";

export default function Home() {
  const { isConnected, isReconnecting, isConnecting } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Wait for hydration
  if (!mounted) return <main className="min-h-screen bg-bg" />;

  // 2. Handle the "Flash" prevention:
  // If Wagmi is still checking the connection (Reconnecting),
  // show a loader instead of the Landing Page.
  const isLoading = isReconnecting || isConnecting;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6">
        {/* The Pulsing Vault Icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer Glow Pulse */}
          <div className="absolute w-16 h-16 bg-accent-glow rounded-full animate-pulse blur-xl" />

          {/* Vault Icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-accent relative z-10 animate-float"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="11"
              r="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 14v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Loading Text using your Syne font */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-display text-text-1 text-sm font-semibold tracking-widest uppercase opacity-80">
            Decrypting Vault
          </p>
          <span className="font-mono text-[10px] text-accent-2 opacity-50 uppercase tracking-[0.2em]">
            Securing Connection...
          </span>
        </div>
      </main>
    );
  }

  // 3. Final Render
  return (
    <main className="min-h-screen bg-bg text-text-1">
      <div className="noise" />
      {isConnected && <Navbar />}
      <div className="relative z-10">
        {isConnected ? <VaultDashboard /> : <LandingPage />}
      </div>
    </main>
  );
}
