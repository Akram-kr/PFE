"use client";

interface Props {
  usedFormatted: string;
  remainingFormatted: string;
  storagePercent: number;
  fileCount: number;
}

export function StorageBar({
  usedFormatted,
  remainingFormatted,
  storagePercent,
  fileCount,
}: Props) {
  const barColor =
    storagePercent > 85
      ? "from-red-500/60 to-red-500"
      : storagePercent > 60
        ? "from-amber-500/60 to-amber-500"
        : "from-accent/60 to-accent";

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface border border-border rounded-lg">
      {/* Stats row */}
      <div className="flex gap-8">
        {[
          { label: "Used", value: usedFormatted },
          { label: "Files", value: fileCount },
          { label: "Free", value: remainingFormatted },
          { label: "Quota", value: "1 GB" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-widest">
              {label}
            </span>
            <span className="font-mono text-sm font-medium text-text-1">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${storagePercent}%` }}
        />
      </div>
    </div>
  );
}
