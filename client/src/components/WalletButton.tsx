"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { useState, useEffect } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {shortenAddress(address)}
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-400">
              {shortenAddress(address, 6)}
            </p>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnecter
            </button>
          </div>
        )}
      </div>
    );
  }
  if (!mounted) return null;
  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="btn-primary text-xs"
    >
      <Wallet className="h-4 w-4" />
      Connecter wallet
    </button>
  );
}
