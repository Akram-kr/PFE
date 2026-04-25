"use client";

import { useState, useMemo } from "react";
import type { VaultFile, DownloadStage } from "@/app/hooks/useVault";
import { FileCard } from "./FileCard";

interface Props {
  files: VaultFile[];
  loading: boolean;
  onDownload: (file: VaultFile) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onRename: (index: number, newName: string) => Promise<void>;
  onShare: (index: number, recipient: `0x${string}`) => Promise<void>;
  downloadStage: DownloadStage;
  activeDownloadIndex: number | null;
}

type SortKey = "newest" | "oldest" | "name" | "size";

export function FileGrid({
  files,
  loading,
  onDownload,
  onDelete,
  onRename,
  onShare,
  downloadStage,
  activeDownloadIndex,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filterExt, setFilterExt] = useState("all");

  const allExtensions = useMemo(() => {
    const exts = [
      ...new Set(files.map((f) => f.fileExtension).filter(Boolean)),
    ];
    return ["all", ...exts];
  }, [files]);

  const filtered = useMemo(() => {
    let result = [...files];
    if (search.trim())
      result = result.filter((f) =>
        f.fileName.toLowerCase().includes(search.toLowerCase()),
      );
    if (filterExt !== "all")
      result = result.filter((f) => f.fileExtension === filterExt);
    switch (sort) {
      case "newest":
        result.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        break;
      case "oldest":
        result.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        break;
      case "name":
        result.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "size":
        result.sort((a, b) => Number(b.fileSize) - Number(a.fileSize));
        break;
    }
    return result;
  }, [files, search, sort, filterExt]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-lg skeleton"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2.5
                       text-[13px] text-text-1 font-display outline-none focus:border-accent
                       transition-colors placeholder:text-text-3"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Extension filters */}
        <div className="flex gap-1.5 flex-wrap">
          {allExtensions.map((ext) => (
            <button
              key={ext}
              onClick={() => setFilterExt(ext)}
              className={[
                "px-3 py-1.5 rounded-full border font-mono text-[11px] transition-all duration-150",
                filterExt === ext
                  ? "border-accent bg-accent/12 text-accent-2"
                  : "border-border bg-surface text-text-3 hover:border-border-2 hover:text-text-2",
              ].join(" ")}
            >
              {ext === "all" ? "All" : `.${ext}`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="bg-surface border border-border rounded-md px-3 py-2.5 text-[13px] text-text-2
                     font-display outline-none cursor-pointer appearance-none"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="size">Largest first</option>
        </select>
      </div>

      {/* Count */}
      {files.length > 0 && (
        <p className="font-mono text-[11px] text-text-3">
          {filtered.length} of {files.length} file
          {files.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* List or empty */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-16 text-center animate-fade-in">
          <span className="text-5xl opacity-40">
            {files.length === 0 ? "🗄️" : "🔍"}
          </span>
          <p className="text-base font-semibold text-text-2">
            {files.length === 0 ? "Your vault is empty" : "No files match"}
          </p>
          <p className="text-sm text-text-3">
            {files.length === 0
              ? "Upload your first file above to get started."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((file) => (
            <FileCard
              key={`${file.index}-${file.fileName}`}
              file={file}
              onDownload={onDownload}
              onDelete={onDelete}
              onRename={onRename}
              onShare={onShare}
              downloadStage={downloadStage}
              isDownloading={activeDownloadIndex === file.index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
