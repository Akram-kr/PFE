"use client";

import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  GraduationCap,
  Calendar,
  ExternalLink,
  IdCard,
  Building2,
  Award,
  FileText,
} from "lucide-react";
import { ipfsUrl, formatTimestamp, formatMoyenne } from "@/lib/contract";
import { cn } from "@/lib/utils";

interface DiplomaCardProps {
  tokenId: bigint;
  owner: string;
  record: {
    studentName: string;
    matricule: string;
    department: string;
    graduationYear: number;
    pfeNote: number;
    ipfsCID: string;
    batchId: bigint;
    mintedAt: bigint;
    valid: boolean;
    revocationReason: string;
  };
}

export function DiplomaCard({ tokenId, owner, record }: DiplomaCardProps) {
  const isValid = record.valid;
  const university = "Université de Blida 1";
  const pfeLabel = formatMoyenne(record.pfeNote);

  return (
    <div className="card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-uni-blue to-blue-600 text-white shadow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">
              Token #{tokenId.toString()}
            </p>
            <p className="text-lg font-bold text-slate-900">
              {record.studentName}
            </p>
            <p className="text-sm text-slate-500">
              {university} — {record.department}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
              isValid
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {isValid ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <ShieldX className="h-5 w-5" />
            )}
            {isValid ? "Authentique" : "Révoqué"}
          </div>
        </div>
      </div>

      {!isValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Ce diplôme a été révoqué par l&apos;administration universitaire.
          </div>
          {record.revocationReason && (
            <p className="text-xs text-red-600 pl-6">
              Motif : {record.revocationReason}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 grid gap-3 sm:grid-cols-2">
        <InfoRow icon={IdCard} label="Matricule" value={record.matricule} />
        <InfoRow
          icon={Building2}
          label="Département"
          value={record.department}
        />
        <InfoRow
          icon={GraduationCap}
          label="Promotion"
          value={String(record.graduationYear)}
        />
        <InfoRow icon={Award} label="PFE" value={pfeLabel} />
        <InfoRow
          icon={Calendar}
          label="Date d'émission"
          value={formatTimestamp(record.mintedAt)}
        />
        <InfoRow
          icon={FileText}
          label="Lot"
          value={`#${record.batchId.toString()}`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Données blockchain immuables
        </p>
        <DataRow label="Propriétaire" value={owner} mono />
        <DataRow label="CID IPFS du PDF" value={record.ipfsCID} mono />
        <DataRow label="Lot" value={`#${record.batchId.toString()}`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={ipfsUrl(record.ipfsCID)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir le PDF
        </a>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-32 shrink-0 text-xs text-slate-400">{label}</span>
      <span
        className={cn("break-all text-xs text-slate-700", mono && "font-mono")}
      >
        {value}
      </span>
    </div>
  );
}
