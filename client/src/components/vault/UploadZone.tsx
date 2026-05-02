"use client";
import { useState, useRef, useCallback } from "react";
import type { UploadStage } from "@/app/hooks/useVault";

interface Props {
  onUpload: (file: File) => Promise<void>;
  uploadStage: UploadStage;
  uploadProgress: number;
}

const STAGE_MSG: Record<UploadStage, string> = {
  idle: "Drop files here or click to upload",
  hashing: "Computing SHA-256 integrity hash…",
  encrypting: "Encrypting with AES-256-GCM…",
  sharding: "Splitting into 3 equal shards…",
  uploading: "Uploading shards to IPFS via Pinata…",
  confirming: "Writing CIDs to blockchain…",
  done: "File secured on-chain ✓",
  error: "Upload failed — click to retry",
};

const STEPS: UploadStage[] = [
  "hashing",
  "encrypting",
  "sharding",
  "uploading",
  "confirming",
];

export function UploadZone({ onUpload, uploadStage, uploadProgress }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = !["idle", "done", "error"].includes(uploadStage);
  const activeStep = STEPS.indexOf(uploadStage);

  const handle = useCallback(
    async (file: File) => {
      setFileName(file.name);
      await onUpload(file);
    },
    [onUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handle(f);
    },
    [handle],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        handle(f);
        e.target.value = "";
      }
    },
    [handle],
  );

  const zoneClass = [
    "relative flex flex-col items-center justify-center min-h-[156px] rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
    busy
      ? "border-blue bg-blue-d anim-border-glow cursor-default"
      : uploadStage === "done"
        ? "border-gn bg-gn-d cursor-default"
        : uploadStage === "error"
          ? "border-danger bg-danger-d"
          : dragging
            ? "border-blue bg-blue/[0.06] scale-[1.01]"
            : "border-wire-2 border-dashed bg-surf/50 hover:border-blue hover:bg-blue-d",
  ].join(" ");

  return (
    <div className="flex flex-col gap-3">
      {/* Zone */}
      <div
        className={zoneClass}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(79,127,255,0.08),transparent_60%)] pointer-events-none" />

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onChange}
          disabled={busy}
        />

        {/* Idle */}
        {uploadStage === "idle" && (
          <div className="flex flex-col items-center gap-3 anim-fade-in z-10">
            <div className="w-13 h-13 w-[52px] h-[52px] rounded-[14px] bg-blue-d border border-wire-2 flex items-center justify-center text-blue-2 group-hover:-translate-y-1 transition-transform">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[14px] font-semibold text-t1">
                Drop files here or click to upload
              </p>
              <p className="font-proto text-[11px] text-t3">
                Max 100 MB · All file types
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {["AES-256-GCM", "3-shard split", "IPFS pinned", "on-chain"].map(
                (t) => (
                  <span
                    key={t}
                    className="font-proto text-[10px] bg-ink-3 border border-wire rounded px-2 py-1 text-t3"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {/* Busy */}
        {busy && (
          <div className="flex flex-col items-center gap-3 anim-fade-in z-10">
            <div className="w-9 h-9 rounded-full border-2 border-wire-2 border-t-blue animate-spin" />
            <p className="text-[13px] font-semibold text-t1">
              {STAGE_MSG[uploadStage]}
            </p>
            {fileName && (
              <p className="font-proto text-[10px] text-t3 max-w-[260px] truncate">
                {fileName}
              </p>
            )}
          </div>
        )}

        {/* Done */}
        {uploadStage === "done" && (
          <div className="flex flex-col items-center gap-3 anim-fade-in z-10">
            <div className="w-11 h-11 rounded-full bg-gn-d border border-gn/20 text-gn text-lg font-bold flex items-center justify-center">
              ✓
            </div>
            <p className="text-[13px] font-semibold text-t1">
              Secured on-chain
            </p>
          </div>
        )}

        {/* Error */}
        {uploadStage === "error" && (
          <div className="flex flex-col items-center gap-3 anim-fade-in z-10">
            <div className="w-11 h-11 rounded-full bg-danger-d border border-danger/20 text-danger text-lg font-bold flex items-center justify-center">
              ✕
            </div>
            <p className="text-[13px] font-semibold text-danger">
              Upload failed — click to retry
            </p>
          </div>
        )}
      </div>

      {/* Pipeline steps */}
      {busy && (
        <div className="flex items-center px-1 anim-fade-in">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 flex-1">
              <div
                className={[
                  "w-2 h-2 rounded-full shrink-0 transition-all duration-300",
                  i < activeStep
                    ? "bg-blue"
                    : i === activeStep
                      ? "bg-transparent border-2 border-blue shadow-[0_0_0_3px_rgba(79,127,255,0.2)] animate-pulse"
                      : "bg-ink-3 border border-wire-2",
                ].join(" ")}
              />
              <span
                className={[
                  "font-proto text-[10px] whitespace-nowrap transition-colors duration-300",
                  i === activeStep
                    ? "text-blue-2"
                    : i < activeStep
                      ? "text-t2"
                      : "text-t3",
                ].join(" ")}
              >
                {step}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-px transition-colors duration-500",
                    i < activeStep ? "bg-blue" : "bg-wire",
                  ].join(" ")}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {busy && (
        <div className="h-[3px] bg-ink-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue to-cyan-vault rounded-full transition-all duration-500 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
