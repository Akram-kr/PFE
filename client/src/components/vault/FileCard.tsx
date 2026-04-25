"use client";

import { useState, useRef, useEffect } from "react";
import type { VaultFile, DownloadStage } from "@/app/hooks/useVault";
import { formatBytes, getFileIcon } from "@/app/lib/crypto";

interface Props {
  file: VaultFile;
  onDownload: (file: VaultFile) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onRename: (index: number, newName: string) => Promise<void>;
  onShare: (index: number, recipient: `0x${string}`) => Promise<void>;
  downloadStage: DownloadStage;
  isDownloading: boolean;
}

const DOWNLOAD_LABELS: Partial<Record<DownloadStage, string>> = {
  fetching: "Fetching shards…",
  reassembling: "Reassembling…",
  decrypting: "Decrypting…",
  verifying: "Verifying integrity…",
};

export function FileCard({
  file,
  onDownload,
  onDelete,
  onRename,
  onShare,
  downloadStage,
  isDownloading,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // 2. Create the ref

  // 3. Handle clicks outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If menu is open and the click target is NOT inside our menuRef
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);
  const [renaming, setRenaming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [newName, setNewName] = useState(file.fileName);
  const [recipient, setRecipient] = useState("");
  const [deleting, setDeleting] = useState(false);

  const date = new Date(Number(file.timestamp) * 1000).toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(file.index);
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === file.fileName) {
      setRenaming(false);
      return;
    }
    await onRename(file.index, newName.trim());
    setRenaming(false);
  };

  const handleShare = async () => {
    if (!recipient.startsWith("0x") || recipient.length !== 42) return;
    await onShare(file.index, recipient as `0x${string}`);
    setSharing(false);
    setRecipient("");
  };

  return (
    <div
      className={[
        "relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-all duration-200  animate-fade-up",
        deleting ? "opacity-40 scale-[0.98] pointer-events-none" : "",
        "bg-surface border-border hover:border-border-2 hover:bg-surface-2 hover:-translate-y-px",
      ].join(" ")}
    >
      {/* ── Left: icon + info ─────────────────────────── */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-[10px] bg-bg-3 flex items-center justify-center text-[22px]">
            {getFileIcon(file.fileExtension)}
          </div>
          <span
            className="absolute -bottom-1 -right-1.5 bg-accent text-white font-mono text-[8px] font-semibold
                           px-1 py-px rounded border-2 border-surface uppercase tracking-wide"
          >
            {file.fileExtension || "?"}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {/* Name or rename input */}
          {renaming ? (
            <div className="flex items-center gap-1.5">
              <input
                className="flex-1 bg-bg-3 border border-accent rounded-[8px] px-2.5 py-1
                           text-sm text-text-1 font-display outline-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                autoFocus
              />
              <button
                onClick={handleRename}
                className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => setRenaming(false)}
                className="w-7 h-7 rounded-md bg-red-500/10 text-red-400 text-sm flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-text-1 truncate">
              {file.fileName}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              formatBytes(Number(file.fileSize)),
              date,
              `v${Number(file.version)}`,
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-text-3">
                  {item}
                </span>
                {i < 2 && (
                  <span className="w-1 h-1 rounded-full bg-text-3/50" />
                )}
              </span>
            ))}
            <span className="w-1 h-1 rounded-full bg-text-3/50" />
            <span className="font-mono text-[11px] text-accent-2">🔐 E2E</span>
          </div>

          {/* Shard badges */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                title={`Shard ${i}: ${file.ipfsHashes[i]}`}
                className="flex items-center gap-1 bg-bg-3 border border-border rounded-md px-2 py-0.5 font-mono text-[10px] text-text-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-vault" />
                IPFS
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: action buttons ──────────────────────── */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {/* Download */}
        <button
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          title="Download & decrypt"
          className="w-9 h-9 rounded-[8px] border border-border bg-bg-3 text-text-2 flex items-center justify-center
                     hover:border-teal-vault hover:text-teal-vault hover:bg-teal-dim transition-all duration-150 disabled:opacity-40"
        >
          {isDownloading ? (
            <span className="w-4 h-4 rounded-full border-2 border-border-2 border-t-teal-vault animate-spin" />
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
        </button>

        {/* Menu */}
        <div className="relative z-50" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-[8px] border border-border bg-bg-3 text-text-2 flex items-center justify-center
                       hover:border-border-2 hover:text-text-1 transition-all duration-150"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div
                className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[140px] bg-bg-2 border border-border-2
                              rounded-md p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)] animate-fade-in"
              >
                <button
                  onClick={() => {
                    setRenaming(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-[13px] text-text-2 font-display
                             hover:bg-surface hover:text-text-1 transition-colors text-left"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => {
                    setSharing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-[13px] text-text-2 font-display
                             hover:bg-surface hover:text-text-1 transition-colors text-left"
                >
                  🔗 Share
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-[13px] text-text-2 font-display
                             hover:bg-red-500/10 hover:text-red-400 transition-colors text-left"
                >
                  🗑 Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Share panel ────────────────────────────────── */}
      {sharing && (
        <div
          className="absolute inset-x-0 bottom-0 bg-bg-2 border-t border-border p-3 rounded-b-lg
                        flex flex-col gap-2.5 animate-fade-in z-10"
        >
          <p className="text-[13px] font-semibold text-text-1">
            Share with wallet
          </p>
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 bg-bg-3 border border-border-2 rounded-[8px] px-3 py-2 font-mono text-[12px]
                         text-text-1 outline-none focus:border-accent transition-colors placeholder:text-text-3"
              placeholder="0x... recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleShare();
                if (e.key === "Escape") setSharing(false);
              }}
            />
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-accent hover:bg-accent-2 text-white font-display text-[13px] font-semibold
                         rounded-[8px] transition-colors whitespace-nowrap"
            >
              Share
            </button>
            <button
              onClick={() => setSharing(false)}
              className="w-8 h-8 rounded-[8px] bg-red-500/10 text-red-400 text-sm flex items-center justify-center hover:bg-red-500/20"
            >
              ✕
            </button>
          </div>
          <p className="font-mono text-[10px] text-text-3 leading-relaxed">
            The AES key will be encrypted with the recipients public key before
            sharing.
          </p>
        </div>
      )}

      {/* ── Download overlay ───────────────────────────── */}
      {isDownloading && (
        <div className="absolute inset-0 bg-bg/75 backdrop-blur-sm rounded-lg flex items-center justify-center animate-fade-in">
          <span className="font-mono text-[12px] text-accent-2 animate-pulse">
            {DOWNLOAD_LABELS[downloadStage] ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
