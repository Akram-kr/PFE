"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { AlertTriangle, CheckCircle, Loader2, Users, X } from "lucide-react";
import { parseAbiItem } from "viem";
import { DIPLOMA_ABI } from "@/lib/abi";
import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { getBatchDraft } from "@/lib/batchDraft";
import {
  ADMIN_ROLE,
  BATCH_STATUS_COLORS,
  BATCH_STATUS_LABELS,
  DEAN_ROLE,
  RECTOR_ROLE,
  diplomaContract,
  publicClient,
} from "@/lib/contract";

type BatchStatus = 0 | 1 | 2 | 3 | 4;

type BatchState = {
  status: BatchStatus | null;
  studentCount: bigint | null;
  proposer: string | null;
  cancelReason: string | null;
};

interface BatchCardProps {
  batchId: bigint;
  onUpdate?: () => void;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const proposedEvent = parseAbiItem(
  "event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount)",
);
const signedByDeanEvent = parseAbiItem(
  "event BatchSignedByDean(uint256 indexed batchId, address indexed dean)",
);
const signedByRectorEvent = parseAbiItem(
  "event BatchSignedByRector(uint256 indexed batchId, address indexed rector)",
);
const finalizedEvent = parseAbiItem(
  "event BatchFinalized(uint256 indexed batchId, uint256 diplomasMinted)",
);
const cancelledEvent = parseAbiItem(
  "event BatchCancelled(uint256 indexed batchId, address indexed cancelledBy, string reason)",
);

export function BatchCard({ batchId, onUpdate }: BatchCardProps) {
  const { address } = useAccount();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [finalizeError, setFinalizeError] = useState("");
  const [isPreparingFinalization, setIsPreparingFinalization] = useState(false);
  const [batchState, setBatchState] = useState<BatchState>({
    status: null,
    studentCount: null,
    proposer: null,
    cancelReason: null,
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: isDean } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [DEAN_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: isRector } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [RECTOR_ROLE, address!],
    query: { enabled: !!address },
  });

  useEffect(() => {
    let mounted = true;

    const loadBatchData = async () => {
      try {
        const [
          proposedLogs,
          deanLogs,
          rectorLogs,
          finalizedLogs,
          cancelledLogs,
        ] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: proposedEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: signedByDeanEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: signedByRectorEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: finalizedEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: cancelledEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
        ]);

        const proposed = proposedLogs.find(
          (log) => log.args.batchId === batchId,
        );
        const dean = deanLogs.find((log) => log.args.batchId === batchId);
        const rector = rectorLogs.find((log) => log.args.batchId === batchId);
        const finalized = finalizedLogs.find(
          (log) => log.args.batchId === batchId,
        );
        const cancelled = cancelledLogs.find(
          (log) => log.args.batchId === batchId,
        );

        const nextState: BatchState = {
          status: null,
          studentCount: proposed?.args.studentCount ?? null,
          proposer: proposed?.args.proposer ?? null,
          cancelReason: cancelled?.args.reason ?? null,
        };

        if (cancelled) {
          nextState.status = 4;
        } else if (finalized) {
          nextState.status = 3;
        } else if (rector) {
          nextState.status = 2;
        } else if (dean) {
          nextState.status = 1;
        } else if (proposed) {
          nextState.status = 0;
        }

        if (mounted) {
          setBatchState(nextState);
        }
      } catch {
        if (mounted) {
          setBatchState({
            status: null,
            studentCount: null,
            proposer: null,
            cancelReason: null,
          });
        }
      }
    };

    loadBatchData();

    return () => {
      mounted = false;
    };
  }, [batchId, refreshKey]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRefreshKey((value) => value + 1);
      onUpdate?.();
      setShowCancelModal(false);
      setCancelReason("");
      setFinalizeError("");
      setIsPreparingFinalization(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccess, onUpdate]);

  const draftStudents = getBatchDraft(batchId);
  const loading = isPending || isConfirming || isPreparingFinalization;
  const statusNum = batchState.status;
  const canSignDean = Boolean(isDean) && statusNum === 0;
  const canSignRector = Boolean(isRector) && statusNum === 1;
  const canFinalize = Boolean(isAdmin) && statusNum === 2;
  const canCancel = Boolean(isAdmin) && statusNum !== 3 && statusNum !== 4;

  const handleFinalizeBatch = async () => {
    setFinalizeError("");

    if (draftStudents.length === 0) {
      setFinalizeError(
        "Aucune donnée du lot n'est disponible. Reproposez le lot pour générer les PDF automatiquement.",
      );
      return;
    }

    try {
      setIsPreparingFinalization(true);

      const response = await fetch(
        `/api/batches/${batchId.toString()}/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ students: draftStudents }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        cids?: string[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "La génération des PDF a échoué.");
      }

      if (!payload.cids?.length) {
        throw new Error("Aucun CID IPFS n'a été retourné.");
      }

      writeContract({
        ...diplomaContract,
        functionName: "finalizeBatch",
        args: [batchId, payload.cids],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFinalizeError(message);
      setIsPreparingFinalization(false);
    }
  };

  const handleAction = async (
    action: "signByDean" | "signByRector" | "finalizeBatch",
  ) => {
    if (action === "finalizeBatch") {
      await handleFinalizeBatch();
      return;
    }

    writeContract({
      ...diplomaContract,
      functionName: action,
      args: [batchId],
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      return;
    }

    writeContract({
      ...diplomaContract,
      functionName: "cancelBatch",
      args: [batchId, cancelReason.trim()],
    });
  };

  return (
    <>
      <div className="card flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-mono mb-1">
              Lot #{batchId.toString()}
            </p>
            <p className="font-semibold text-slate-800 leading-snug">
              Lot de diplômes
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {batchState.proposer
                ? `Proposé par ${shortenAddress(batchState.proposer)}`
                : "Chargement du proposer…"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {statusNum !== null ? (
              <span className={cn("badge", BATCH_STATUS_COLORS[statusNum])}>
                {BATCH_STATUS_LABELS[statusNum]}
              </span>
            ) : (
              <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                Chargement…
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          {batchState.studentCount !== null
            ? `${batchState.studentCount.toString()} étudiants`
            : "Chargement…"}
        </div>

        {batchState.cancelReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Motif : {batchState.cancelReason}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canSignDean && (
            <button
              className="btn-primary text-xs"
              disabled={loading}
              onClick={() => handleAction("signByDean")}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Signer (Doyen)
            </button>
          )}

          {canSignRector && (
            <button
              className="btn-primary text-xs"
              disabled={loading}
              onClick={() => handleAction("signByRector")}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Signer (Recteur)
            </button>
          )}

          {canFinalize && (
            <button
              className="btn-primary text-xs bg-green-700 hover:bg-green-800"
              disabled={loading}
              onClick={() => handleAction("finalizeBatch")}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Finaliser le lot
            </button>
          )}

          {statusNum === 3 && (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Diplômes émis
            </span>
          )}

          {canCancel && (
            <button
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
              disabled={loading}
              onClick={() => setShowCancelModal(true)}
            >
              <X className="h-3 w-3" />
              Annuler
            </button>
          )}
        </div>

        {txHash && (
          <p className="text-xs text-slate-400 font-mono truncate">
            Tx: {txHash}
          </p>
        )}

        {finalizeError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {finalizeError}
          </p>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Annuler le lot
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lot #{batchId.toString()}
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
              <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
              Le lot sera définitivement annulé. Les diplômes déjà émis ne sont
              pas affectés.
            </div>

            <div>
              <label className="label">
                Motif d&apos;annulation <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="ex: Données incorrectes soumises par le département…"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Fermer
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={loading || !cancelReason.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {isConfirming ? "Confirmation…" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
