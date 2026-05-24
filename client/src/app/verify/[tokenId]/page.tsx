"use client";

import { use, useEffect, useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { publicClient, diplomaContract, ADMIN_ROLE } from "@/lib/contract";
import { DiplomaCard } from "@/components/verify/DiplomaCard";
import { DiplomaQR } from "@/components/verify/DiplomaQR";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";
import { Loader2, AlertCircle, ArrowLeft, ShieldAlert, X } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ tokenId: string }>;
}

interface DiplomaRecord {
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
}

function normalizeMatricule(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

export default function VerifyTokenPage({ params }: Props) {
  const { tokenId: rawId } = use(params);
  const [resolvedTokenId, setResolvedTokenId] = useState<bigint | null>(null);
  const [diploma, setDiploma] = useState<DiplomaRecord | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [owner, setOwner] = useState<string>("—");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const { address } = useAccount();

  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address ?? "0x0000000000000000000000000000000000000000"],
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
    if (!isRevokeSuccess || !diploma) return;

    const timer = window.setTimeout(() => {
      setDiploma((current) =>
        current
          ? {
              ...current,
              valid: false,
              revocationReason: revokeReason.trim() || current.revocationReason,
            }
          : current,
      );
      setShowRevokeModal(false);
      setRevokeReason("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [diploma, isRevokeSuccess, revokeReason]);

  useEffect(() => {
    let active = true;

    const resolveDiploma = async () => {
      const input = rawId?.trim() ?? "";

      setResolvedTokenId(null);
      setDiploma(null);
      setResolveError(null);
      setIsResolving(true);

      if (!input) {
        if (active) {
          setResolveError("Token ou matricule invalide.");
          setIsResolving(false);
        }
        return;
      }

      try {
        const normalizedMatricule = normalizeMatricule(input);

        if (/^\d+$/.test(input)) {
          const tokenId = BigInt(input);

          try {
            await publicClient.readContract({
              ...diplomaContract,
              functionName: "ownerOf",
              args: [tokenId],
            });

            const record = (await publicClient.readContract({
              ...diplomaContract,
              functionName: "getDiplomaRecord",
              args: [tokenId],
            })) as DiplomaRecord;

            if (!active) return;

            setResolvedTokenId(tokenId);
            setDiploma(record);
            setIsResolving(false);
            return;
          } catch {
            // Numeric input may actually be a matricule on this deployment.
          }
        }

        const [tokenId, exists] = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DIPLOMA_ABI,
          functionName: "getTokenByMatricule",
          args: [normalizedMatricule],
        })) as [bigint, boolean];

        if (!exists) {
          throw new Error("matricule not found");
        }

        const record = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DIPLOMA_ABI,
          functionName: "getDiplomaByMatricule",
          args: [normalizedMatricule],
        })) as DiplomaRecord;

        if (!active) return;

        setResolvedTokenId(tokenId);
        setDiploma(record);
        setIsResolving(false);
      } catch {
        if (!active) return;

        setResolveError(
          `"${input}" introuvable. Vérifiez que le matricule est valide et que le diplôme a bien été finalisé.`,
        );
        setIsResolving(false);
      }
    };

    void resolveDiploma();

    return () => {
      active = false;
    };
  }, [rawId]);

  useEffect(() => {
    if (resolvedTokenId === null) return;

    const fetchOwner = async () => {
      try {
        const ownerAddress = (await publicClient.readContract({
          ...diplomaContract,
          functionName: "ownerOf",
          args: [resolvedTokenId],
        })) as string;

        setOwner(ownerAddress);
      } catch {
        setOwner("—");
      }
    };

    void fetchOwner();
  }, [resolvedTokenId]);

  const revokeLoading = isRevoking || isRevokeConfirming;

  const handleRevokeConfirm = () => {
    if (!revokeReason.trim() || resolvedTokenId === null) return;

    writeContract({
      ...diplomaContract,
      functionName: "revokeDiploma",
      args: [resolvedTokenId, revokeReason.trim()],
    });
  };

  const displayLoading = isResolving;
  const displayError = resolveError;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la recherche
        </Link>

        {diploma && isAdmin && diploma.valid && (
          <button
            onClick={() => setShowRevokeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Révoquer ce diplôme
          </button>
        )}
      </div>

      {displayLoading && (
        <div className="card flex flex-col items-center gap-4 py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Lecture du contrat intelligent…</p>
        </div>
      )}

      {displayError && (
        <div className="card flex flex-col items-center gap-4 py-16 text-red-500">
          <AlertCircle className="h-8 w-8" />
          <div className="text-center">
            <p className="font-semibold">{displayError}</p>
            <p className="text-sm text-red-400 mt-1">
              Le token {rawId} n&apos;existe pas ou le contrat n&apos;est pas
              disponible.
            </p>
          </div>
          <Link href="/verify" className="btn-secondary text-sm">
            Nouvelle recherche
          </Link>
        </div>
      )}

      {diploma && !displayLoading && !displayError && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DiplomaCard
              tokenId={resolvedTokenId!}
              owner={owner}
              record={diploma}
            />
          </div>
          <div>
            <DiplomaQR tokenId={resolvedTokenId!} />
          </div>
        </div>
      )}

      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Révoquer le diplôme
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Token #{resolvedTokenId?.toString() ?? rawId}
                </p>
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
