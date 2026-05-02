"use client";

import { useState, useEffect, useRef } from "react";
import { usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";

// ── Types ──────────────────────────────────────────────────────────────────

interface CredentialData {
  tokenId: bigint;
  credType: string;
  fullName: string;
  matricule: string;
  faculty: string;
  mention: string;
  academicYear: string;
  documentHash: string;
  issuedAt: bigint;
  isValid: boolean;
}

// ── QR Code Generator (uses qrcode.react or canvas API) ────────────────────

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 200, label }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw placeholder QR pattern (in production use qrcode.react library)
    // Install: npm install qrcode.react
    // Then replace this with: <QRCodeSVG value={value} size={size} />
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = "#0c1319";
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Corner markers (QR-style)
    const markerSize = size * 0.22;
    const positions = [
      [6, 6],
      [size - markerSize - 6, 6],
      [6, size - markerSize - 6],
    ];

    positions.forEach(([x, y]) => {
      // Outer square
      ctx.fillStyle = "#00d4ff";
      ctx.fillRect(x, y, markerSize, markerSize);
      // Inner white
      ctx.fillStyle = "#0c1319";
      ctx.fillRect(x + 3, y + 3, markerSize - 6, markerSize - 6);
      // Center dot
      ctx.fillStyle = "#00d4ff";
      ctx.fillRect(x + 6, y + 6, markerSize - 12, markerSize - 12);
    });

    // Data modules (visual representation)
    ctx.fillStyle = "rgba(0,212,255,0.4)";
    const moduleSize = 6;
    const cols = Math.floor((size - 20) / moduleSize);
    const rows = Math.floor((size - 20) / moduleSize);

    // Use value string to seed pattern deterministically
    let seed = 0;
    for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 10 + c * moduleSize;
        const y = 10 + r * moduleSize;
        // Skip corner areas
        if (
          (x < 60 && y < 60) ||
          (x > size - 70 && y < 60) ||
          (x < 60 && y > size - 70)
        )
          continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 3 === 0) {
          ctx.fillRect(x + 1, y + 1, moduleSize - 2, moduleSize - 2);
        }
      }
    }

    // Center text
    ctx.fillStyle = "#00d4ff";
    ctx.font = `bold ${size * 0.06}px "Share Tech Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("SCAN TO VERIFY", size / 2, size - 10);
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-line-2"
        style={{ imageRendering: "pixelated" }}
      />
      {label && (
        <p className="font-proto text-[10px] text-t3 tracking-widest text-center max-w-[200px]">
          {label}
        </p>
      )}
    </div>
  );
}

// ── Credential QR Card ──────────────────────────────────────────────────────

interface CredentialQRCardProps {
  tokenId: bigint;
  credential: CredentialData;
  studentWallet: string;
}

export function CredentialQRCard({
  tokenId,
  credential,
  studentWallet,
}: CredentialQRCardProps) {
  const [showQR, setShowQR] = useState(false);

  // The QR encodes a URL to your verification portal
  const verificationURL = `${typeof window !== "undefined" ? window.location.origin : ""}/verify?wallet=${studentWallet}&token=${tokenId.toString()}`;

  const isValid = credential.isValid;
  const statusColor = isValid
    ? "text-proto-green border-proto-green/30 bg-proto-gd"
    : "text-proto-red border-proto-red/30 bg-proto-rd";
  const statusLabel = isValid ? "● VALID" : "✕ REVOKED";

  return (
    <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
        <span className="font-proto text-[11px] text-t2 tracking-widest">
          // CREDENTIAL #{tokenId.toString().padStart(4, "0")}
        </span>
        <span
          className={`font-proto text-[10px] px-2.5 py-1 rounded-proto border ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Credential info */}
        <div className="flex flex-col gap-2.5">
          {[
            { label: "TYPE", value: credential.credType },
            { label: "NAME", value: credential.fullName },
            { label: "MATRICULE", value: credential.matricule },
            { label: "FACULTY", value: credential.faculty },
            { label: "MENTION", value: credential.mention },
            { label: "YEAR", value: credential.academicYear },
            {
              label: "ISSUED",
              value: new Date(
                Number(credential.issuedAt) * 1000,
              ).toLocaleDateString("fr-DZ"),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-1.5 border-b border-line"
            >
              <span className="font-proto text-[10px] text-t3 tracking-widest flex-shrink-0">
                {label}
              </span>
              <span className="font-proto text-[11px] text-t1 text-right truncate">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Document hash */}
        <div className="bg-ink-3 border border-line rounded-proto p-3">
          <p className="font-proto text-[9px] text-t3 mb-1.5 tracking-widest">
            SHA-256 DOCUMENT HASH
          </p>
          <p className="font-proto text-[9px] text-cyan break-all leading-relaxed">
            {credential.documentHash}
          </p>
        </div>

        {/* QR Code toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full py-2.5 border border-cyan/30 bg-cyan-dim rounded-proto
                     font-proto text-[11px] text-cyan tracking-widest hover:border-cyan
                     hover:bg-cyan/15 transition-all"
        >
          {showQR ? "HIDE QR CODE" : "▣ SHOW VERIFICATION QR"}
        </button>

        {showQR && (
          <div className="flex flex-col items-center gap-4 py-2 animate-fade-in">
            <QRCode
              value={verificationURL}
              size={180}
              label={`${credential.credType} — ${credential.academicYear}`}
            />
            <div className="w-full bg-ink-3 border border-line rounded-proto p-3">
              <p className="font-proto text-[9px] text-t3 mb-1 tracking-widest">
                VERIFICATION URL
              </p>
              <p className="font-proto text-[9px] text-cyan break-all">
                {verificationURL}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(verificationURL)}
              className="font-proto text-[10px] text-t3 hover:text-cyan transition-colors tracking-wider"
            >
              ⎘ Copy verification link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Employer Verification Portal ────────────────────────────────────────────

export function VerificationPortal() {
  const publicClient = usePublicClient();
  const [walletInput, setWalletInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CredentialData | null>(null);
  const [error, setError] = useState("");
  const [verifyMode, setVerifyMode] = useState<"wallet" | "token">("wallet");

  // Auto-populate from URL params (QR code scan)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wallet = params.get("wallet");
    const token = params.get("token");
    if (wallet) setWalletInput(wallet);
    if (token) {
      setTokenInput(token);
      setVerifyMode("token");
    }
    if (wallet && token) handleVerifyToken(token);
  }, []);

  const handleVerifyToken = async (tokenId?: string) => {
    const id = tokenId ?? tokenInput;
    if (!id || !publicClient) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = (await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_CREDENTIAL_CONTRACT as `0x${string}`,
        abi: CREDENTIAL_ABI,
        functionName: "verifyCredential",
        args: [BigInt(id)],
      })) as [
        boolean,
        string,
        string,
        string,
        string,
        string,
        string,
        `0x${string}`,
        bigint,
      ];

      setResult({
        tokenId: BigInt(id),
        isValid: data[0],
        credType: data[1],
        fullName: data[2],
        matricule: data[3],
        faculty: data[4],
        mention: data[5],
        academicYear: data[6],
        documentHash: data[7],
        issuedAt: data[8],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink proto-bg scanlines flex flex-col">
      {/* Header */}
      <div className="border-b border-line bg-ink-1/95 backdrop-blur-lg">
        <div className="border-b border-line px-6 py-1 flex items-center justify-between">
          <span className="font-proto text-[10px] text-t3 tracking-widest">
            UNICHAIN DZ — PUBLIC VERIFICATION PORTAL
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-proto-green animate-live" />
            <span className="font-proto text-[10px] text-proto-green tracking-widest">
              READ-ONLY · NO WALLET REQUIRED
            </span>
          </div>
        </div>
        <div className="px-6 h-12 flex items-center gap-3">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <polygon
              points="16,2 29,9 29,23 16,30 3,23 3,9"
              stroke="#00d4ff"
              strokeWidth="1.5"
              fill="rgba(0,212,255,0.06)"
            />
            <circle cx="16" cy="16" r="3" fill="#00d4ff" />
          </svg>
          <span className="text-[16px] font-bold tracking-wider">
            Decen<span className="text-cyan">tra</span>Vault{" "}
            <span className="text-t3">·</span> Credential Verifier
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {(["wallet", "token"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVerifyMode(mode)}
              className={`px-4 py-2 rounded-proto font-proto text-[11px] tracking-widest border transition-all ${
                verifyMode === mode
                  ? "border-cyan bg-cyan-dim text-cyan"
                  : "border-line-2 bg-ink-3 text-t3 hover:text-t2"
              }`}
            >
              {mode === "wallet" ? "🔍 BY WALLET ADDRESS" : "# BY TOKEN ID"}
            </button>
          ))}
        </div>

        {/* Search panel */}
        <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-line">
            <span className="font-proto text-[11px] text-t2 tracking-widest">
              // VERIFY CREDENTIAL
            </span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="font-proto text-[10px] text-t3 tracking-widest block mb-2">
                {verifyMode === "wallet"
                  ? "STUDENT WALLET ADDRESS"
                  : "NFT TOKEN ID"}
              </label>
              <input
                className="w-full bg-ink-3 border border-line-3 rounded-proto px-4 py-3
                           font-proto text-[12px] text-t1 placeholder:text-t3 outline-none
                           focus:border-cyan transition-colors"
                placeholder={
                  verifyMode === "wallet"
                    ? "0x... student wallet address"
                    : "Enter token ID (e.g. 42)"
                }
                value={verifyMode === "wallet" ? walletInput : tokenInput}
                onChange={(e) =>
                  verifyMode === "wallet"
                    ? setWalletInput(e.target.value)
                    : setTokenInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerifyToken();
                }}
              />
            </div>

            <button
              onClick={() => handleVerifyToken()}
              disabled={loading}
              className="w-full py-3 bg-cyan text-ink font-proto text-[12px] font-semibold
                         tracking-widest rounded-proto hover:bg-cyan/90 disabled:opacity-50
                         hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-ink border-t-ink/0 animate-spin" />
                  VERIFYING ON-CHAIN…
                </span>
              ) : (
                "▶ VERIFY CREDENTIAL"
              )}
            </button>

            <p className="font-proto text-[10px] text-t3 text-center leading-relaxed">
              Verification reads directly from the Ethereum blockchain.
              <br />
              No university contact required. Results are cryptographically
              guaranteed.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-proto-red/30 bg-proto-rd rounded-proto px-4 py-3 mb-6 animate-fade-in">
            <p className="font-proto text-[11px] text-proto-red">✕ {error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`panel-corner rounded-panel border overflow-hidden animate-fade-in ${
              result.isValid
                ? "border-proto-green/40 bg-proto-gd/30"
                : "border-proto-red/40 bg-proto-rd/30"
            }`}
          >
            {/* Status banner */}
            <div
              className={`px-5 py-4 flex items-center gap-3 border-b ${
                result.isValid ? "border-proto-green/20" : "border-proto-red/20"
              }`}
            >
              <span className={`text-2xl`}>{result.isValid ? "✅" : "❌"}</span>
              <div>
                <p
                  className={`font-bold text-base tracking-wide ${
                    result.isValid ? "text-proto-green" : "text-proto-red"
                  }`}
                >
                  {result.isValid
                    ? "CREDENTIAL VERIFIED"
                    : "CREDENTIAL INVALID OR REVOKED"}
                </p>
                <p className="font-proto text-[10px] text-t3 mt-0.5">
                  {result.isValid
                    ? "This credential is authentic and was issued by a verified institution"
                    : "This credential has been revoked or does not exist"}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "CREDENTIAL TYPE", value: result.credType },
                { label: "FULL NAME", value: result.fullName },
                { label: "MATRICULE", value: result.matricule },
                { label: "MENTION", value: result.mention },
                { label: "ACADEMIC YEAR", value: result.academicYear },
                {
                  label: "ISSUED ON",
                  value: new Date(
                    Number(result.issuedAt) * 1000,
                  ).toLocaleDateString("fr-DZ"),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-ink-3/60 border border-line rounded-proto p-3"
                >
                  <p className="font-proto text-[9px] text-t3 tracking-widest mb-1">
                    {label}
                  </p>
                  <p className="font-proto text-[12px] text-t1 font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Hash verification */}
            <div className="px-5 pb-5">
              <div className="bg-ink-3 border border-line rounded-proto p-3">
                <p className="font-proto text-[9px] text-t3 tracking-widest mb-1.5">
                  DOCUMENT INTEGRITY HASH (SHA-256)
                </p>
                <p className="font-proto text-[9px] text-cyan break-all leading-relaxed">
                  {result.documentHash}
                </p>
                <p className="font-proto text-[9px] text-t3 mt-2">
                  Match this hash against the physical document to confirm
                  authenticity.
                </p>
              </div>
            </div>

            {/* Verification receipt */}
            <div className="px-5 pb-5">
              <button
                onClick={() => {
                  const receipt = `UNICHAIN DZ VERIFICATION RECEIPT\n${"─".repeat(40)}\nVerified At  : ${new Date().toLocaleString("fr-DZ")}\nToken ID     : ${result.tokenId}\nCredential   : ${result.credType}\nHolder       : ${result.fullName}\nMatricule    : ${result.matricule}\nMention      : ${result.mention}\nYear         : ${result.academicYear}\nStatus       : ${result.isValid ? "VALID" : "REVOKED"}\nHash         : ${result.documentHash}\n${"─".repeat(40)}\nVerified on Ethereum blockchain. Cryptographically guaranteed.`;
                  const blob = new Blob([receipt], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `verification_${result.matricule}_${Date.now()}.txt`;
                  a.click();
                }}
                className="w-full py-2.5 border border-line-2 bg-ink-3 rounded-proto
                           font-proto text-[11px] text-t2 tracking-widest hover:border-cyan
                           hover:text-cyan transition-all"
              >
                ⬇ DOWNLOAD VERIFICATION RECEIPT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal ABI for verification
const CREDENTIAL_ABI = [
  {
    name: "verifyCredential",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "credTypeName", type: "string" },
      { name: "fullName", type: "string" },
      { name: "matricule", type: "string" },
      { name: "faculty", type: "string" },
      { name: "mention", type: "string" },
      { name: "academicYear", type: "string" },
      { name: "documentHash", type: "bytes32" },
      { name: "issuedAt", type: "uint256" },
    ],
  },
] as const;
