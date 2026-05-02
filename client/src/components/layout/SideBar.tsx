"use client";

interface Props {
  storagePercent: number;
  usedFormatted: string;
  fileCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV = [
  {
    id: "vault",
    label: "My Vault",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    id: "shared",
    label: "Shared With Me",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export function Sidebar({
  storagePercent,
  usedFormatted,
  fileCount,
  activeTab,
  onTabChange,
}: Props) {
  const barColor =
    storagePercent > 85
      ? "from-danger to-danger"
      : storagePercent > 60
        ? "from-amber-vault to-amber-vault"
        : "from-blue to-cyan-vault";

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-wire bg-ink-1 p-3 gap-1">
      {/* Nav section */}
      <p className="font-proto text-[9px] text-t3 tracking-[0.14em] uppercase px-2.5 pt-2 pb-1.5">
        Navigation
      </p>

      {NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={[
            "flex items-center gap-2.5 px-2.5 py-2 rounded-proto text-[13px] font-medium transition-all border",
            activeTab === item.id
              ? "bg-blue-d text-blue-2 border-wire-2"
              : "text-t2 border-transparent hover:bg-surf hover:text-t1 hover:border-wire",
          ].join(" ")}
        >
          <span
            className={
              activeTab === item.id ? "text-blue-2" : "text-t3 opacity-70"
            }
          >
            {item.icon}
          </span>
          {item.label}
          {item.id === "vault" && fileCount > 0 && (
            <span className="ml-auto font-proto text-[10px] bg-blue-d text-blue-2 rounded px-1.5 py-0.5">
              {fileCount}
            </span>
          )}
        </button>
      ))}

      {/* Settings section */}
      <p className="font-proto text-[9px] text-t3 tracking-[0.14em] uppercase px-2.5 pt-4 pb-1.5">
        Settings
      </p>
      <button className="flex items-center gap-2.5 px-2.5 py-2 rounded-proto text-[13px] font-medium text-t2 border border-transparent hover:bg-surf hover:text-t1 hover:border-wire transition-all">
        <span className="text-t3 opacity-70">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
          </svg>
        </span>
        Preferences
      </button>

      {/* Storage widget */}
      <div className="mt-auto p-3.5 bg-surf border border-wire rounded-card">
        <div className="flex items-center justify-between mb-2">
          <span className="font-proto text-[10px] text-t2 tracking-wider uppercase">
            Storage
          </span>
          <span className="font-proto text-[10px] text-blue-2">
            {Math.round(storagePercent)}%
          </span>
        </div>
        <div className="h-1 bg-ink-3 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-proto text-[9px] text-t3">
            {usedFormatted} used
          </span>
          <span className="font-proto text-[9px] text-t3">1 GB total</span>
        </div>
      </div>
    </aside>
  );
}
