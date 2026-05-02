"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export function Navbar() {
  const { isConnected, chain } = useAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink-1/95 backdrop-blur-lg">
      {/* Status strip */}
      <div className="border-b border-line px-6 py-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-proto text-[10px] text-t3 tracking-widest uppercase">
            DecentraVault Protocol v1.0
          </span>
          <span className="w-px h-3 bg-line-2" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-proto-green animate-live" />
            <span className="font-proto text-[10px] text-proto-green tracking-widest">
              NODE ACTIVE
            </span>
          </div>
        </div>
        <span className="font-proto text-[10px] text-t3 tracking-wider">
          {isConnected
            ? `${chain?.name?.toUpperCase() ?? "UNKNOWN"} · ${chain?.id}`
            : "NOT CONNECTED"}
        </span>
      </div>

      {/* Main nav */}
      <div className="px-6 h-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg
            className="w-8 h-8 animate-hex-spin"
            viewBox="0 0 32 32"
            fill="none"
          >
            <polygon
              points="16,2 29,9 29,23 16,30 3,23 3,9"
              stroke="#00d4ff"
              strokeWidth="1.5"
              fill="rgba(0,212,255,0.06)"
            />
            <polygon
              points="16,8 23,12 23,20 16,24 9,20 9,12"
              stroke="#00d4ff"
              strokeWidth="1"
              fill="rgba(0,212,255,0.10)"
            />
            <circle cx="16" cy="16" r="3" fill="#00d4ff" />
          </svg>
          <span className="text-[17px] font-bold tracking-wider text-t1">
            Decen<span className="text-cyan">tra</span>Vault
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            ["VAULT", true],
            ["ACTIVITY", false],
            ["NETWORK", false],
          ].map(([label, active]) => (
            <button
              key={label as string}
              className={`px-3 py-1.5 rounded-proto font-proto text-[11px] tracking-wider border transition-all ${
                active
                  ? "border-line-2 bg-cyan-dim text-cyan"
                  : "border-transparent text-t3 hover:text-t2 hover:bg-ink-3"
              }`}
            >
              {label as string}
            </button>
          ))}
        </nav>

        <ConnectButton
          accountStatus="avatar"
          chainStatus="none"
          showBalance={false}
        />
      </div>
    </header>
  );
}
