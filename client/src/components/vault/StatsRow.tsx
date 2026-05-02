"use client";

interface Props {
  fileCount: number;
  usedFormatted: string;
  remainingFormatted: string;
  shardCount: number;
}

const CARD =
  "flex flex-col gap-1.5 p-4 bg-surf border border-wire rounded-card hover:border-wire-2 hover:-translate-y-0.5 transition-all duration-200 anim-fade-up";
const ICON =
  "w-8 h-8 rounded-[8px] flex items-center justify-center mb-1 shrink-0";

export function StatsRow({
  fileCount,
  usedFormatted,
  remainingFormatted,
  shardCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className={CARD} style={{ animationDelay: "0.05s" }}>
        <div className={`${ICON} bg-blue-d text-blue-2`}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </div>
        <span className="font-proto text-[9px] text-t-3 uppercase tracking-widest">
          Total Files
        </span>
        <span className="text-2xl font-bold tracking-tight text-t-1">
          {fileCount}
        </span>
        <span className="font-proto text-[9px] text-t-3">
          encrypted on-chain
        </span>
      </div>

      <div className={CARD} style={{ animationDelay: "0.1s" }}>
        <div className={`${ICON} bg-cyan-d text-cyan-vault`}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <span className="font-proto text-[9px] text-t-3 uppercase tracking-widest">
          Storage Used
        </span>
        <span className="text-2xl font-bold tracking-tight text-t-1">
          {usedFormatted}
        </span>
        <span className="font-proto text-[9px] text-t-3">
          {remainingFormatted} remaining
        </span>
      </div>

      <div className={CARD} style={{ animationDelay: "0.15s" }}>
        <div className={`${ICON} bg-gn-d text-gn`}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className="font-proto text-[9px] text-t-3 uppercase tracking-widest">
          IPFS Shards
        </span>
        <span className="text-2xl font-bold tracking-tight text-t-1">
          {shardCount}
        </span>
        <span className="font-proto text-[9px] text-t-3">
          all pinned · live
        </span>
      </div>

      <div className={CARD} style={{ animationDelay: "0.2s" }}>
        <div className={`${ICON} bg-amber-d text-amber-vault`}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span className="font-proto text-[9px] text-t-3 uppercase tracking-widest">
          On-Chain Txns
        </span>
        <span className="text-2xl font-bold tracking-tight text-t-1">
          {fileCount}
        </span>
        <span className="font-proto text-[9px] text-t-3">confirmed blocks</span>
      </div>
    </div>
  );
}
