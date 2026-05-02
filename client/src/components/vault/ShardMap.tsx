"use client";

interface Props {
  fileCount: number;
  usedFormatted: string;
  remainingFormatted: string;
  storagePercent: number;
  latestFile?: { ipfsHashes: [string, string, string] } | null;
}

export function ShardMap({
  fileCount,
  usedFormatted,
  remainingFormatted,
  storagePercent,
  latestFile,
}: Props) {
  const shards = latestFile?.ipfsHashes ?? ["Qm···", "Qm···", "Qm···"];

  return (
    <div className="flex flex-col gap-4">
      {/* Node visualization panel */}
      <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <span className="font-proto text-[11px] text-t2 tracking-widest">
            SHARD MAP
          </span>
          <span className="font-proto text-[10px] text-proto-green">
            ● {fileCount * 3}/{fileCount * 3} ACTIVE
          </span>
        </div>

        {/* Orbital node map */}
        <div className="relative h-44 flex items-center justify-center overflow-hidden">
          {/* Grid bg */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Rings */}
          {[80, 120, 160].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border border-line-2 animate-ring"
              style={{
                width: size,
                height: size,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}

          {/* Orbiting nodes */}
          <div className="absolute w-2 h-2 rounded-full bg-proto-green border border-proto-green/30 animate-orbit-a" />
          <div className="absolute w-2 h-2 rounded-full bg-cyan border border-cyan/30 animate-orbit-b" />

          {/* Center node */}
          <div
            className="relative z-10 w-12 h-12 rounded-full bg-cyan-dim border-2 border-cyan
                          flex items-center justify-center text-cyan text-lg animate-center"
          >
            ⬡
          </div>
        </div>

        {/* Shard rows */}
        <div className="p-4 flex flex-col gap-2 border-t border-line">
          {shards.map((cid, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-ink-3 border border-line rounded-proto px-3 py-2.5"
            >
              <span className="font-proto text-[10px] text-cyan w-[52px] flex-shrink-0">
                SHARD_{i}
              </span>
              <div className="flex-1 h-1 bg-ink-4 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-2 to-proto-green
                                shadow-[0_0_6px_rgba(0,212,255,0.3)]"
                  style={{ width: "100%" }}
                />
              </div>
              <span className="font-proto text-[9px] text-t3 w-20 text-right truncate flex-shrink-0">
                {typeof cid === "string" && cid.length > 8
                  ? `${cid.slice(0, 6)}…${cid.slice(-4)}`
                  : cid}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Storage quota panel */}
      <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <span className="font-proto text-[11px] text-t2 tracking-widest">
            STORAGE QUOTA
          </span>
          <span className="font-proto text-[10px] text-t2">
            {usedFormatted} / 1 GB
          </span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="h-1.5 bg-ink-4 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan to-proto-green transition-all duration-1000"
              style={{ width: `${storagePercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 blur-[1px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "USED", value: usedFormatted },
              { label: "FREE", value: remainingFormatted },
              { label: "FILES", value: fileCount.toString() },
              { label: "SHARDS", value: (fileCount * 3).toString() },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-ink-3 border border-line rounded-proto p-2.5"
              >
                <p className="font-proto text-[9px] text-t3 tracking-widest mb-1">
                  {s.label}
                </p>
                <p className="font-proto text-[13px] font-medium text-t1">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security status panel */}
      <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line">
          <span className="font-proto text-[11px] text-t2 tracking-widest">
            SECURITY STATUS
          </span>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {[
            {
              label: "ENCRYPTION",
              value: "AES-256-GCM",
              color: "text-proto-green",
            },
            {
              label: "KEY STORAGE",
              value: "ZERO-KNOWLEDGE",
              color: "text-proto-green",
            },
            { label: "KDF", value: "PBKDF2 · 100K", color: "text-cyan" },
            {
              label: "INTEGRITY",
              value: "SHA-256 ON-CHAIN",
              color: "text-cyan",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between px-3 py-2.5 bg-ink-3 border border-line rounded-proto"
            >
              <span className="font-proto text-[10px] text-t2 tracking-wider">
                {s.label}
              </span>
              <span
                className={`font-proto text-[10px] ${s.color} tracking-wider`}
              >
                {s.color === "text-proto-green" ? "● " : ""}
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
