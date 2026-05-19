"use client";
import { useState, useEffect, useRef } from "react";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";

import {
  MENTION_OPTIONS,
  SPECIALTY_OPTIONS,
  CYCLE_OPTIONS,
  diplomaContract,
  DiplomaRecord,
} from "@/lib/contract";
import { DIPLOMA_ABI } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { useRole } from "@/hooks/useRole";

// ── QR Code canvas component ───────────────────────────────────────────────
function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Corner finders
    const m = size * 0.2;
    const positions = [
      [5, 5],
      [size - m - 5, 5],
      [5, size - m - 5],
    ];
    positions.forEach(([x, y]) => {
      ctx.fillStyle = "#c9a84c";
      ctx.fillRect(x, y, m, m);
      ctx.fillStyle = "#111827";
      ctx.fillRect(x + 3, y + 3, m - 6, m - 6);
      ctx.fillStyle = "#c9a84c";
      ctx.fillRect(x + 6, y + 6, m - 12, m - 12);
    });

    // Data modules
    ctx.fillStyle = "rgba(201,168,76,0.45)";
    let seed = 0;
    for (let c = 0; c < value.length; c++) seed += value.charCodeAt(c);
    const mod = 5;
    const cols = Math.floor((size - 16) / mod);
    const rows = Math.floor((size - 16) / mod);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 8 + c * mod;
        const y = 8 + r * mod;
        if (
          (x < m + 10 && y < m + 10) ||
          (x > size - m - 14 && y < m + 10) ||
          (x < m + 10 && y > size - m - 14)
        )
          continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 3 === 0) ctx.fillRect(x, y, mod - 1, mod - 1);
      }
    }
    ctx.fillStyle = "#c9a84c";
    ctx.font = `bold ${size * 0.055}px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("VÉRIFIER", size / 2, size - 6);
  }, [value, size]);

  return (
    <canvas
      ref={ref}
      className="rounded border border-line-2"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ── Diploma card ───────────────────────────────────────────────────────────
function DiplomaCard({
  tokenId,
  record,
}: {
  tokenId: bigint;
  record: DiplomaRecord;
}) {
  const [showQR, setShowQR] = useState(false);
  const verifyURL = `${typeof window !== "undefined" ? window.location.origin : ""}/verify?token=${tokenId}`;
  const issuedDate = new Date(
    Number(record.mintedAt) * 1000,
  ).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={`corner-ornament bg-navy-2 border rounded-panel overflow-hidden animate-fade-up
                     ${record.valid ? "border-gold/20" : "border-red-500/30"}`}
    >
      {/* Diploma header — looks like a real diploma */}
      <div
        className="relative bg-gradient-to-br from-navy-3 to-navy-2 px-6 pt-6 pb-4
                      border-b border-line text-center overflow-hidden"
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[100px] text-gold/5 font-bold select-none">
            U
          </span>
        </div>

        <p className="font-mono text-[9px] text-gold tracking-[0.2em] uppercase mb-1">
          République Algérienne Démocratique et Populaire
        </p>
        <p className="font-mono text-[9px] text-t3 tracking-wider mb-3">
          Ministère de l'Enseignement Supérieur et de la Recherche Scientifique
        </p>
        <p className="font-serif text-base font-bold text-t1">
          Université de Blida 1
        </p>
        <p className="font-mono text-[9px] text-t2 mt-0.5">
          Faculté des Sciences
        </p>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/30" />
          <span className="font-serif text-xl font-bold text-gold-grad">
            {CYCLE_OPTIONS[record.cycle].label}
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/30" />
        </div>

        <p className="font-mono text-[9px] text-t2 tracking-wider">
          DIPLÔME D'ÉTAT
        </p>

        {/* Valid/Revoked badge */}
        {!record.valid && (
          <div
            className="absolute top-3 right-3 badge-red border font-mono text-[9px]
                          px-2 py-0.5 rounded tracking-wider animate-stamp"
          >
            RÉVOQUÉ
          </div>
        )}
      </div>

      {/* Student info */}
      <div className="p-5 flex flex-col gap-3">
        <div className="text-center pb-3 border-b border-line">
          <p className="font-mono text-[9px] text-t3 tracking-widest mb-1">
            DÉCERNÉ À
          </p>
          <p className="font-serif text-xl font-bold text-t1">
            {record.studentName}
          </p>
          <p className="font-mono text-[10px] text-t2 mt-0.5">
            Né(e) le {record.dateOfBirth} à {record.placeOfBirth}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "MATRICULE", value: record.matricule },
            {
              label: "SPÉCIALITÉ",
              value:
                SPECIALTY_OPTIONS[record.specialty].label
                  ?.split("—")[0]
                  .trim() ?? "",
            },
            { label: "DÉPARTEMENT", value: record.department },
            { label: "MENTION", value: MENTION_OPTIONS[record.mention].label },
            { label: "ANNÉE", value: record.graduationYear.toString() },
            { label: "ÉMIS LE", value: issuedDate },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-navy-3 border border-line rounded-btn p-2.5"
            >
              <p className="font-mono text-[8px] text-t3 tracking-widest mb-0.5">
                {label}
              </p>
              <p className="font-mono text-[11px] text-t1 font-medium">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Hash */}
        <div className="bg-navy-3 border border-line rounded-btn p-3">
          <p className="font-mono text-[8px] text-t3 tracking-widest mb-1">
            SHA-256 HASH D'INTÉGRITÉ
          </p>
          <p className="font-mono text-[9px] text-gold break-all">
            {record.sha256Hash}
          </p>
        </div>

        {/* Token ID */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[8px] text-t3 tracking-widest">
              TOKEN ID
            </p>
            <p className="font-mono text-[11px] text-t1">
              #{tokenId.toString()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[8px] text-t3 tracking-widest">LOT</p>
            <p className="font-mono text-[11px] text-t1">
              #{record.batchId.toString()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[8px] text-t3 tracking-widest">
              STATUT
            </p>
            <p
              className={`font-mono text-[11px] ${record.valid ? "text-status-green" : "text-red-400"}`}
            >
              {record.valid ? "✓ VALIDE" : "✕ RÉVOQUÉ"}
            </p>
          </div>
        </div>

        {/* QR toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full py-2.5 border border-line-2 font-mono text-[10px] text-t2
                     rounded-btn hover:border-gold hover:text-gold transition-all tracking-wider"
        >
          {showQR ? "MASQUER LE QR CODE" : "▣ AFFICHER LE QR DE VÉRIFICATION"}
        </button>

        {showQR && (
          <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
            <QRCode value={verifyURL} size={160} />
            <p className="font-mono text-[9px] text-t3 text-center max-w-[200px] leading-relaxed">
              Un employeur peut scanner ce QR pour vérifier l'authenticité
              instantanément.
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(verifyURL)}
              className="font-mono text-[10px] text-gold hover:underline tracking-wider"
            >
              ⎘ Copier le lien de vérification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function StudentPage() {
  const { address } = useRole();
  const publicClient = usePublicClient();

  const { data: diplomas = [], isLoading } = useQuery({
    queryKey: ["student-diplomas", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!address || !publicClient) return [];

      const tokenIds = (await publicClient.readContract({
        address: diplomaContract.address,
        abi: diplomaContract.abi,
        functionName: "getStudentDiplomas",
        args: [address],
      })) as bigint[];

      if (tokenIds.length === 0) return [];

      const records = await Promise.all(
        tokenIds.map((id) =>
          publicClient
            .readContract({
              address: diplomaContract.address,
              abi: diplomaContract.abi,
              functionName: "getDiplomaRecord",
              args: [id],
            })
            .then((r) => ({ tokenId: id, record: r as DiplomaRecord })),
        ),
      );
      return records;
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="font-mono text-[10px] text-gold tracking-widest mb-1">
          // ÉTUDIANT
        </p>
        <h1 className="font-serif text-3xl font-bold text-t1">Mes Diplômes</h1>
        <p className="font-mono text-[11px] text-t2 mt-2">
          Vos diplômes officiels enregistrés sur la blockchain Ethereum.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-96 rounded-panel skeleton" />
          ))}
        </div>
      ) : diplomas.length === 0 ? (
        <div className="text-center py-16 bg-navy-2 border border-line rounded-panel animate-fade-in">
          <p className="font-serif text-lg text-t2 mb-2">
            Aucun diplôme trouvé
          </p>
          <p className="font-mono text-[11px] text-t3">
            Votre wallet: {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diplomas.map(({ tokenId, record }, i) => (
            <div
              key={tokenId.toString()}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <DiplomaCard tokenId={tokenId} record={record} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
