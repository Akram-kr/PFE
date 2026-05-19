"use client";

import { use, useEffect, useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import {
  publicClient,
  diplomaContract,
  ipfsUrl,
  ADMIN_ROLE,
} from "@/lib/contract";
import {
  DiplomaCard,
  type DiplomaMetadata,
} from "@/components/verify/DiplomaCard";
import { DiplomaQR } from "@/components/verify/DiplomaQR";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";
import { Loader2, AlertCircle, ArrowLeft, ShieldAlert, X } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ tokenId: string }>;
}

export default function VerifyTokenPage({ params }: Props) {
  const { tokenId: rawId } = use(params);
  const tokenId = BigInt(rawId);

  const { address } = useAccount();
  const [metadata, setMetadata] = useState<DiplomaMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [owner, setOwner] = useState<string>("—");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const {
    data: record,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    ...diplomaContract,
    functionName: "getDiplomaRecord",
    args: [tokenId],
  });

  const { data: verificationCount, refetch: refetchCount } = useReadContract({
    ...diplomaContract,
    functionName: "verificationCount",
    args: [tokenId],
  });

  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address!],
    query: { enabled: !!address },
  });

  const {
    writeContract,
    data: revokeTxHash,
    isPending: isRevoking,
  } = useWriteContract();
  const { isLoading: isRevokeConfirming, isSuccess: isRevokeSuccess } =
    useWaitForTransactionReceipt({ hash: revokeTxHash });

  useEffect(() => {
    if (isRevokeSuccess) {
      refetch();
      refetchCount();

      // Pushes the UI update to the next tick to avoid cascading renders
      setTimeout(() => {
        setShowRevokeModal(false);
        setRevokeReason("");
      }, 0);
    }
  }, [isRevokeSuccess, refetch, refetchCount]);

  useEffect(() => {
    if (!record) return;

    const fetchOwner = async () => {
      try {
        const o = await publicClient.readContract({
          ...diplomaContract,
          functionName: "ownerOf",
          args: [tokenId],
        });
        setOwner(o as string);
      } catch {
        setOwner("—");
      }
    };

    const fetchMeta = async () => {
      setMetaLoading(true);
      try {
        const url = ipfsUrl(record.metadataCID);
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as DiplomaMetadata;
          setMetadata(json);
        }
      } catch {
        setMetadata(null);
      } finally {
        setMetaLoading(false);
      }
    };

    fetchOwner();
    fetchMeta();
  }, [record, tokenId]);

  const revokeLoading = isRevoking || isRevokeConfirming;

  const handleRevokeConfirm = () => {
    if (!revokeReason.trim()) return;
    writeContract({
      ...diplomaContract,
      functionName: "revokeDiploma",
      args: [tokenId, revokeReason.trim()],
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la recherche
        </Link>

        {record && isAdmin && record.valid && (
          <button
            onClick={() => setShowRevokeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Révoquer ce diplôme
          </button>
        )}
      </div>

      {isLoading && (
        <div className="card flex flex-col items-center gap-4 py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Lecture du contrat intelligent…</p>
        </div>
      )}

      {error && (
        <div className="card flex flex-col items-center gap-4 py-16 text-red-500">
          <AlertCircle className="h-8 w-8" />
          <div className="text-center">
            <p className="font-semibold">Token #{rawId} introuvable</p>
            <p className="text-sm text-red-400 mt-1">
              Ce token n existe pas ou le contrat nest pas déployé.
            </p>
          </div>
          <Link href="/verify" className="btn-secondary text-sm">
            Nouvelle recherche
          </Link>
        </div>
      )}

      {record && !isLoading && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {metaLoading ? (
              <div className="card flex items-center gap-3 py-10 justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">
                  Chargement des métadonnées IPFS…
                </span>
              </div>
            ) : (
              <DiplomaCard
                tokenId={tokenId}
                owner={owner}
                record={{
                  studentName: record.studentName,
                  matricule: record.matricule,
                  dateOfBirth: record.dateOfBirth,
                  placeOfBirth: record.placeOfBirth,
                  metadataCID: record.metadataCID,
                  sha256Hash: record.sha256Hash,
                  specialty: record.specialty,
                  cycle: record.cycle,
                  mention: record.mention,
                  graduationYear: record.graduationYear,
                  department: record.department,
                  batchId: record.batchId,
                  mintedAt: record.mintedAt,
                  valid: record.valid,
                  revocationReason: record.revocationReason,
                }}
                verificationCount={verificationCount}
                metadata={metadata}
              />
            )}
          </div>
          <div>
            <DiplomaQR tokenId={tokenId} />
          </div>
        </div>
      )}

      {/* Revocation modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Révoquer le diplôme
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Token #{rawId}</p>
              </div>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <ShieldAlert className="inline h-3.5 w-3.5 mr-1" />
              Cette action est <strong>irréversible</strong>. Le diplôme sera
              marqué révoqué sur la blockchain.
            </div>

            <div>
              <label className="label">
                Motif de révocation <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="ex: Fraude académique détectée lors d'un audit…"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="btn-secondary text-sm"
                disabled={revokeLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={revokeLoading || !revokeReason.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {revokeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldAlert className="h-4 w-4" />
                )}
                {isRevokeConfirming
                  ? "Confirmation…"
                  : "Confirmer la révocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
