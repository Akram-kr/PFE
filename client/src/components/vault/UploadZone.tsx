"use client";

import { useState, useRef, useCallback } from "react";
import type { UploadStage } from "@/app/hooks/useVault";

interface Props {
  onUpload: (file: File) => Promise<void>;
  uploadStage: UploadStage;
  uploadProgress: number;
}

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "Drop files here or click to browse",
  hashing: "Computing integrity hash…",
  encrypting: "Encrypting with AES-256-GCM…",
  sharding: "Splitting into 3 shards…",
  uploading: "Uploading shards to IPFS…",
  confirming: "Writing metadata to blockchain…",
  done: "File secured ✓",
  error: "Upload failed — try again",
};

const PIPELINE_STEPS: UploadStage[] = [
  "hashing",
  "encrypting",
  "sharding",
  "uploading",
  "confirming",
];

export function UploadZone({ onUpload, uploadStage, uploadProgress }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = !["idle", "done", "error"].includes(uploadStage);
  const activeStep = PIPELINE_STEPS.indexOf(uploadStage);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      setSelectedFile(file);
      await onUpload(file);
    },
    [onUpload],
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      await onUpload(file);
      e.target.value = "";
    },
    [onUpload],
  );

  // Zone border/bg based on state
  const zoneClass = [
    "relative flex items-center justify-center min-h-[160px] rounded-lg border-[1.5px] transition-all duration-200 cursor-pointer",
    isDragging
      ? "border-accent bg-accent/8 scale-[1.01]"
      : uploadStage === "done"
        ? "border-emerald-500 bg-emerald-500/5 cursor-default"
        : uploadStage === "error"
          ? "border-red-500 bg-red-500/5"
          : isActive
            ? "border-accent bg-accent/4 animate-border-pulse cursor-default"
            : "border-border-2 border-dashed bg-white/[0.02] hover:border-accent hover:bg-accent/4",
  ].join(" ");

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        className={zoneClass}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isActive && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={isActive}
        />

        {/* Idle */}
        {uploadStage === "idle" && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div
              className="w-14 h-14 rounded-[14px] bg-accent/10 flex items-center justify-center text-accent
                            group-hover:translate-y-[-3px] transition-transform"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-text-1">
              Drop files here or click to browse
            </p>
            <p className="font-mono text-[11px] text-text-3">
              Max 100 MB · All file types · AES-256 encrypted
            </p>
          </div>
        )}

        {/* Uploading */}
        {isActive && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full border-2 border-border-2 border-t-accent animate-spin" />
            <p className="text-sm font-semibold text-text-1">
              {STAGE_LABELS[uploadStage]}
            </p>
            {selectedFile && (
              <p className="font-mono text-[11px] text-text-3 max-w-[280px] truncate">
                {selectedFile.name}
              </p>
            )}
          </div>
        )}

        {/* Done */}
        {uploadStage === "done" && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-400 text-xl font-bold flex items-center justify-center">
              ✓
            </div>
            <p className="text-sm font-semibold text-text-1">
              File secured on-chain
            </p>
          </div>
        )}

        {/* Error */}
        {uploadStage === "error" && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-400 text-xl font-bold flex items-center justify-center">
              ✕
            </div>
            <p className="text-sm font-semibold text-red-400">
              Upload failed — click to try again
            </p>
          </div>
        )}
      </div>

      {/* Pipeline steps */}
      {isActive && (
        <div className="flex items-center px-2 animate-fade-in">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 flex-1">
              {/* Dot */}
              <div
                className={[
                  "w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300",
                  i < activeStep
                    ? "bg-accent"
                    : i === activeStep
                      ? "bg-transparent border-2 border-accent shadow-[0_0_0_3px_rgba(124,109,240,0.25)] animate-pulse"
                      : "bg-bg-3 border border-border-2",
                ].join(" ")}
              />
              {/* Label */}
              <span
                className={[
                  "font-mono text-[10px] whitespace-nowrap transition-colors duration-300",
                  i === activeStep ? "text-accent-2" : "text-text-3",
                ].join(" ")}
              >
                {step}
              </span>
              {/* Connector line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-px transition-colors duration-300",
                    i < activeStep ? "bg-accent" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {isActive && (
        <div className="h-[3px] bg-bg-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-teal-vault rounded-full transition-all duration-500 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
