"use client";

import { useState, useCallback } from "react";
import { useVault, type VaultFile } from "@/app/hooks/useVault";
import { StorageBar } from "@/components/vault/StorageBar";
import { UploadZone } from "@/components/vault/UploadZone";
import { FileGrid } from "@/components/vault/FileGrid";
import { Toast } from "@/components/Ui/Toast";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export function VaultDashboard() {
  const {
    files,
    filesLoading,
    storagePercent,
    usedFormatted,
    remainingFormatted,
    uploadFile,
    uploadStage,
    uploadProgress,
    downloadFile,
    downloadStage,
    deleteFile,
    renameFile,
    shareFile,
    error,
  } = useVault();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeDownloadIndex, setActiveDownload] = useState<number | null>(
    null,
  );

  const addToast = useCallback((message: string, type: ToastItem["type"]) => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
      addToast(`${file.name} encrypted and stored on-chain ✓`, "success");
    } catch {
      addToast(error || "Upload failed", "error");
    }
  };

  const handleDownload = async (file: VaultFile) => {
    setActiveDownload(file.index);
    try {
      await downloadFile(file);
      addToast(`${file.fileName} downloaded and verified ✓`, "success");
    } catch {
      addToast(error || "Download failed", "error");
    } finally {
      setActiveDownload(null);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      await deleteFile(index);
      addToast("File removed from your vault", "info");
    } catch {
      addToast("Failed to delete file", "error");
    }
  };

  const handleRename = async (index: number, newName: string) => {
    try {
      await renameFile(index, newName);
      addToast("File renamed successfully", "success");
    } catch {
      addToast("Failed to rename file", "error");
    }
  };

  const handleShare = async (index: number, recipient: `0x${string}`) => {
    try {
      await shareFile(index, recipient);
      addToast(
        `File shared with ${recipient.slice(0, 6)}…${recipient.slice(-4)}`,
        "success",
      );
    } catch {
      addToast("Failed to share file", "error");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] px-6 py-10 pb-20 noise">
      {/* Ambient blobs */}
      <div className="fixed -top-52 -left-36 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-teal-vault/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="   text-[32px] font-extrabold tracking-[-0.03em] text-text-1">
              Your Vault
            </h1>
            <p className="font-mono text-[11px] text-text-3 mt-1 tracking-wider">
              End-to-end encrypted · 3-shard IPFS · On-chain ledger
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 bg-teal-dim border border-teal-vault/20 rounded-full px-3.5 py-1.5 shrink-0 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-vault animate-pulse" />
            <span className="font-mono text-[11px] text-teal-vault">
              AES-256-GCM
            </span>
          </div>
        </div>

        {/* Storage bar */}
        <StorageBar
          usedFormatted={usedFormatted}
          remainingFormatted={remainingFormatted}
          storagePercent={storagePercent}
          fileCount={files.length}
        />

        {/* Upload zone */}
        <UploadZone
          onUpload={handleUpload}
          uploadStage={uploadStage}
          uploadProgress={uploadProgress}
        />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-widest whitespace-nowrap">
            Stored Files
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* File grid */}
        <FileGrid
          files={files}
          loading={filesLoading}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRename={handleRename}
          onShare={handleShare}
          downloadStage={downloadStage}
          activeDownloadIndex={activeDownloadIndex}
        />
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-[1000] pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              message={t.message}
              type={t.type}
              onDismiss={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
