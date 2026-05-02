"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const FEATURES = [
  {
    num: "01",
    title: "Zero-Knowledge Keys",
    desc: "AES-256 key derived from your MetaMask signature via PBKDF2. Never stored anywhere, ever.",
  },
  {
    num: "02",
    title: "3-Shard Distribution",
    desc: "Encrypted ciphertext split into 3 equal shards. No single IPFS node holds your complete file.",
  },
  {
    num: "03",
    title: "IPFS + Pinata",
    desc: "Each shard independently pinned. CIDs recorded immutably on your smart contract.",
  },
  {
    num: "04",
    title: "SHA-256 Integrity",
    desc: "Original file hash stored on-chain. Every download verified before your browser sees it.",
  },
];

const FLOW = ["Encrypt", "Shard", "IPFS", "Chain"];

export function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-16 z-10">
      {/* Ambient orbs */}
      <div className="fixed -top-40 -left-24 w-[520px] h-[520px] rounded-full bg-blue/[0.06] blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-20 -right-16 w-[420px] h-[420px] rounded-full bg-cyan-vault/[0.04] blur-[100px] pointer-events-none" />

      {/* Hero */}
      <div className="flex flex-col items-center text-center max-w-[620px] gap-6 anim-fade-up">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 font-proto text-[10px] text-blue-2 tracking-widest bg-blue-d border border-wire-2 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-vault animate-pulse" />
          SEPOLIA TESTNET · E2E ENCRYPTED · ZERO KNOWLEDGE
        </div>

        {/* Title */}
        <h1 className="text-[clamp(40px,7vw,76px)] font-extrabold tracking-[-0.04em] leading-[1.04] font-display">
          <span className="text-t1">Own your data.</span>
          <br />
          <span className="text-grad">Truly.</span>
        </h1>

        <p className="text-[16px] leading-[1.75] text-t2 max-w-[460px] font-light">
          Decentralized encrypted storage on IPFS and Ethereum. Your files split
          into 3 shards, AES-256 encrypted, permanently indexed on-chain.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
          <ConnectButton label="Connect Wallet to Enter" />
          <button className="flex items-center gap-2 font-proto text-[11px] text-t2 border border-wire-2 rounded-proto px-4 py-2.5 hover:border-wire-3 hover:text-t1 transition-all tracking-wider">
            VIEW DOCS
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </button>
        </div>

        <p className="font-proto text-[10px] text-t3 tracking-widest">
          METAMASK · WALLETCONNECT · COINBASE WALLET
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl w-full">
        {FEATURES.map((f, i) => (
          <div
            key={f.num}
            className="flex flex-col gap-2.5 p-5 bg-surf border border-wire rounded-card hover:border-wire-2 hover:-translate-y-1 transition-all duration-200 anim-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="font-proto text-[10px] text-blue-2 tracking-[0.1em]">
              {f.num} /
            </span>
            <h3 className="text-[13px] font-semibold text-t1">{f.title}</h3>
            <p className="text-[12px] leading-relaxed text-t2 font-light">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Flow diagram */}
      <div
        className="flex items-center gap-2 flex-wrap justify-center anim-fade-up"
        style={{ animationDelay: "0.35s" }}
      >
        {FLOW.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surf border border-wire rounded-proto px-4 py-2">
              <span className="w-5 h-5 rounded-full bg-blue text-white font-display text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="font-proto text-[11px] text-t-2">{step}</span>
            </div>
            {i < FLOW.length - 1 && (
              <span className="text-t-3 text-base">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div
        className="flex items-center gap-8 flex-wrap justify-center anim-fade-up"
        style={{ animationDelay: "0.45s" }}
      >
        {[
          { v: "AES-256-GCM", l: "Encryption" },
          { v: "3 Shards", l: "Per File" },
          { v: "IPFS", l: "Storage Layer" },
          { v: "On-Chain", l: "Ownership" },
        ].map(({ v, l }) => (
          <div key={l} className="flex flex-col items-center gap-0.5">
            <span className="font-proto text-[13px] font-medium text-blue-2">
              {v}
            </span>
            <span className="font-proto text-[10px] text-t-3 tracking-widest uppercase">
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
