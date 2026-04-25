"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  type: "success" | "error" | "info";
  onDismiss: () => void;
}

const styles = {
  success: "bg-emerald-500/12 border-emerald-500/30 text-emerald-400",
  error: "bg-red-500/10 border-red-500/30 text-red-400",
  info: "bg-accent/10 border-accent/30 text-accent-2",
};

const icons = { success: "✓", error: "✕", info: "ℹ" };

export function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-md border shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    max-w-sm animate-fade-up font-display ${styles[type]}`}
    >
      <span className="text-sm font-bold flex-shrink-0">{icons[type]}</span>
      <span className="flex-1 text-[13px]">{message}</span>
      <button
        onClick={onDismiss}
        className="opacity-60 hover:opacity-100 text-xs flex-shrink-0 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}
