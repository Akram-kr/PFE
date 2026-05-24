"use client";

import QRCode from "react-qr-code";
import { QrCode, Copy, Check } from "lucide-react";
import { useState } from "react";

interface DiplomaQRProps {
  tokenId: bigint;
}

export function DiplomaQR({ tokenId }: DiplomaQRProps) {
  const [copied, setCopied] = useState(false);

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${tokenId.toString()}`
      : `/verify/${tokenId.toString()}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <QrCode className="h-4 w-4 text-uni-blue" />
        Code QR de vérification
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <QRCode
          value={verifyUrl}
          size={160}
          fgColor="#1e3a8a"
          bgColor="#ffffff"
          level="M"
        />
      </div>

      <p className="max-w-[200px] break-all text-center font-mono text-[10px] text-slate-400">
        {verifyUrl}
      </p>

      <button onClick={handleCopy} className="btn-secondary text-xs">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copié !" : "Copier le lien"}
      </button>
    </div>
  );
}
