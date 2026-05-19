"use client";

import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  GraduationCap,
  Calendar,
  MapPin,
  Hash,
  ExternalLink,
  IdCard,
  Building2,
  Award,
  Eye,
} from "lucide-react";
import {
  ipfsUrl,
  SPECIALTY_SHORT,
  CYCLE_SHORT,
  MENTION_LABELS,
  MENTION_COLORS,
  formatTimestamp,
} from "@/lib/contract";
import { cn } from "@/lib/utils";

export interface DiplomaMetadata {
  studentName?: string;
  matricule?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  cycle?: string;
  specialty?: string;
  mention?: string;
  department?: string;
  university?: string;
  graduationYear?: number;
  academicYear?: string;
  issueDate?: string;
  diplomaPdfCID?: string;
}

interface DiplomaCardProps {
  tokenId: bigint;
  owner: string;
  record: {
    studentName: string;
    matricule: string;
    dateOfBirth: string;
    placeOfBirth: string;
    metadataCID: string;
    sha256Hash: string;
    specialty: number;
    cycle: number;
    mention: number;
    graduationYear: number;
    department: string;
    batchId: bigint;
    mintedAt: bigint;
    valid: boolean;
    revocationReason: string;
  };
  verificationCount?: bigint;
  metadata?: DiplomaMetadata | null;
}

export function DiplomaCard({
  tokenId,
  owner,
  record,
  metadata,
  verificationCount,
}: DiplomaCardProps) {
  const isValid = record.valid;
  const name =
    record.studentName || metadata?.studentName || "Étudiant inconnu";
  const matricule = record.matricule || metadata?.matricule || "—";
  const department =
    record.department || metadata?.department || "Informatique";
  const university = metadata?.university ?? "Université de Blida 1";

  const dob = record.dateOfBirth || metadata?.dateOfBirth || "";
  const pob = record.placeOfBirth || metadata?.placeOfBirth || "";

  const specialtyLabel = SPECIALTY_SHORT[record.specialty] ?? "—";
  const cycleLabel = CYCLE_SHORT[record.cycle] ?? "—";
  const mentionLabel = MENTION_LABELS[record.mention] ?? "—";
  const mentionColor = MENTION_COLORS[record.mention] ?? "";

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-uni-blue to-blue-600 text-white shadow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">
              Token #{tokenId.toString()}
            </p>
            <p className="text-lg font-bold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">
              {university} — {department}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
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
          {verificationCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Eye className="h-3.5 w-3.5" />
              {verificationCount.toString()} vérification
              {Number(verificationCount) !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Revocation alert */}
      {!isValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Ce diplôme a été révoqué par l administration universitaire.
          </div>
          {record.revocationReason && (
            <p className="text-xs text-red-600 pl-6">
              Motif : {record.revocationReason}
            </p>
          )}
        </div>
      )}

      {/* Identity block */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 grid gap-3 sm:grid-cols-2">
        <InfoRow icon={IdCard} label="Matricule" value={matricule} />
        <InfoRow icon={Building2} label="Département" value={department} />
        <InfoRow
          icon={GraduationCap}
          label="Cycle & Spécialité"
          value={`${cycleLabel} — ${specialtyLabel}`}
        />
        <InfoRow
          icon={Award}
          label="Mention"
          value={
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                mentionColor,
              )}
            >
              {mentionLabel}
            </span>
          }
        />
        <InfoRow
          icon={Calendar}
          label="Promotion"
          value={String(
            record.graduationYear || metadata?.graduationYear || "—",
          )}
        />
        <InfoRow
          icon={Calendar}
          label="Date d'émission (blockchain)"
          value={formatTimestamp(record.mintedAt)}
        />
        {dob && (
          <InfoRow icon={Calendar} label="Date de naissance" value={dob} />
        )}
        {pob && <InfoRow icon={MapPin} label="Lieu de naissance" value={pob} />}
      </div>

      {/* Chain data */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Données blockchain immuables
        </p>
        <DataRow label="Propriétaire" value={owner} mono />
        <DataRow label="IPFS CID" value={record.metadataCID} mono />
        <DataRow label="SHA-256 PDF" value={record.sha256Hash} mono />
        <DataRow label="Lot" value={`#${record.batchId.toString()}`} />
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <a
          href={ipfsUrl(record.metadataCID)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Métadonnées IPFS
        </a>
        {metadata?.diplomaPdfCID && (
          <a
            href={ipfsUrl(metadata.diplomaPdfCID)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Diplôme PDF
          </a>
        )}
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
