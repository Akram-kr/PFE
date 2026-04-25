"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const features = [
  {
    icon: "🔐",
    title: "Zero-Knowledge Encryption",
    desc: "AES-256 key derived from your wallet signature — never stored anywhere, ever.",
  },
  {
    icon: "🧩",
    title: "3-Shard Distribution",
    desc: "Every file is split into 3 encrypted shards across IPFS. No single node holds your data.",
  },
  {
    icon: "⛓",
    title: "On-Chain Ledger",
    desc: "File metadata and CIDs live on Ethereum. Tamper-proof, permanent, and yours forever.",
  },
  {
    icon: "✅",
    title: "Integrity Verification",
    desc: "SHA-256 hash stored on-chain. Every download is verified before your browser sees it.",
  },
];

const flowSteps = ["Encrypt", "Shard", "IPFS", "Chain"];

export function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-20 noise overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="fixed -top-52 -left-36 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-teal-vault/8 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl gap-6 animate-fade-up">
        {/* Network badge */}
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-vault animate-pulse" />
          <span className="font-mono text-[11px] text-accent-2 tracking-widest uppercase">
            Sepolia Testnet
          </span>
        </div>

        <h1 className="text-[clamp(48px,8vw,88px)] font-extrabold tracking-[-0.03em] leading-[1.05] text-text-1">
          Your files,
          <br />
          <span className="text-gradient">truly private.</span>
        </h1>

        <p className="text-lg leading-relaxed text-text-2 max-w-lg font-normal">
          End-to-end encrypted storage powered by IPFS and Ethereum. No
          passwords. No servers. No compromise.
        </p>

        <div className="mt-2">
          <ConnectButton label="Connect Wallet to Enter" />
        </div>

        <p className="font-mono text-[11px] text-text-3 tracking-wider">
          MetaMask · WalletConnect · Coinbase Wallet
        </p>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="flex flex-col gap-3 p-7 bg-white/[0.03] border border-border rounded-lg
                       hover:border-border-2 hover:bg-white/[0.05] transition-all duration-200 animate-fade-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="text-3xl">{f.icon}</span>
            <h3 className="text-[15px] font-semibold text-text-1">{f.title}</h3>
            <p className="text-[13px] leading-relaxed text-text-2 font-normal">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Flow diagram */}
      <div
        className="relative z-10 flex items-center gap-2 flex-wrap justify-center animate-fade-up"
        style={{ animationDelay: "0.4s" }}
      >
        {flowSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-sm px-4 py-2.5">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center font-display">
                {i + 1}
              </span>
              <span className="font-mono text-[13px] text-text-2">{step}</span>
            </div>
            {i < flowSteps.length - 1 && (
              <span className="text-text-3 text-lg">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
