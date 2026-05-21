"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  CheckCircle,
  Loader2,
  Users,
  X,
  Clock,
  AlertTriangle,
  Gavel,
} from "lucide-react";
import {
  diplomaContract,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  DEAN_ROLE,
  RECTOR_ROLE,
  ADMIN_ROLE,
  COUNCIL_ROLE,
  formatTimestamp,
  publicClient,
  formatMoyenne,
  PROGRESSION_LABELS,
  PROGRESSION_COLORS,
  parseMoyenne,
} from "@/lib/contract";
import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";

interface BatchCardProps {
  batchId: bigint;
  onUpdate?: () => void;
}

type StudentStruct = {
  studentName?: string;
  matricule?: string;
  baseMoyenne?: number | bigint;
};

type PVStruct = {
  baseMoyenne?: number | bigint;
  finalMoyenne?: number | bigint;
  status?: number | bigint;
};

export function BatchCard({ batchId, onUpdate }: BatchCardProps) {
  const { address } = useAccount();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: status, refetch: refetchStatus } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchStatus",
    args: [batchId],
  });

  const { data: studentCount } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchStudentCount",
    args: [batchId],
  });

  const { data: description } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchDescription",
    args: [batchId],
  });

  const { data: expiresAt } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchExpiry",
    args: [batchId],
  });

  const { data: cancelReasonOnChain } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchCancelReason",
    args: [batchId],
    query: { enabled: status === 5 },
  });

  const { data: deliberation } = useReadContract({
    ...diplomaContract,
    functionName: "getBatchDeliberation",
    args: [batchId],
    query: {
      enabled:
        status !== undefined && Number(status) >= 1 && Number(status) !== 5,
    },
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

  const { data: isCouncil } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [COUNCIL_ROLE, address!],
    query: { enabled: !!address },
  });

  const [delibNote, setDelibNote] = useState("");
  const [showDelibForm, setShowDelibForm] = useState(false);
  const [pvRows, setPvRows] = useState<{ idx: number; student: StudentStruct; pv: PVStruct }[]>([]);
  const [rachatsState, setRachatsState] = useState<
    Record<number, { bumped: string; reason: string }>
  >({});

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      refetchStatus();
      onUpdate?.();
      setShowCancelModal(false);
      setCancelReason("");
      setShowDelibForm(false);
      setDelibNote("");
    }
  }, [isSuccess, refetchStatus, onUpdate]);

  // Fetch PV and student info for PV table and rachat panel
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!studentCount) return;
        const n = Number(studentCount);
        const calls = [] as Promise<unknown>[];
        for (let i = 0; i < n; i++) {
          calls.push(
            publicClient.readContract({
              ...diplomaContract,
              functionName: "getBatchStudent",
              args: [batchId, BigInt(i)],
            }),
          );
        }
        const students = await Promise.all(calls);
        const pvCalls = [] as Promise<unknown>[];
        for (let i = 0; i < n; i++)
          pvCalls.push(
            publicClient.readContract({
              ...diplomaContract,
              functionName: "getStudentPV",
              args: [batchId, BigInt(i)],
            }),
          );
        const pvs = await Promise.all(pvCalls);
        if (!mounted) return;
        const merged = students.map((s: unknown, idx: number) => ({ idx, student: s as StudentStruct, pv: pvs[idx] as PVStruct }));
        setPvRows(merged);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [studentCount, batchId]);

  const loading = isPending || isConfirming;
  const statusNum = status !== undefined ? Number(status) : undefined;
  // 0 Proposed | 1 Deliberated | 2 SignedByDean | 3 SignedByRector | 4 Minted | 5 Cancelled
  const isCancelled = statusNum === 5;
  const isMinted = statusNum === 4;

  const now = Math.floor(Date.now() / 1000);
  const isExpired =
    expiresAt !== undefined &&
    !isMinted &&
    !isCancelled &&
    Number(expiresAt) < now;

  const canDeliberate = isCouncil && statusNum === 0 && !isExpired;
  const canSignDean = isDean && statusNum === 1 && !isExpired;
  const canSignRector = isRector && statusNum === 2 && !isExpired;
  const canFinalize = isAdmin && statusNum === 3 && !isExpired;
  const canCancel = isAdmin && !isMinted && !isCancelled;

  const handleAction = (
    fn: "signByDean" | "signByRector" | "finalizeBatch",
  ) => {
    writeContract({ ...diplomaContract, functionName: fn, args: [batchId] });
  };

  const handleDeliberate = () => {
    // Build rachats array: include entries where reason is present and bumped is valid
    const rachats: { studentIndex: bigint; bumpedMoyenne: number; reason: string }[] = [];
    for (const [idxStr, v] of Object.entries(rachatsState)) {
      const idx = Number(idxStr);
      const bumped = parseMoyenne(v.bumped);
      if (!v.reason?.trim()) continue;
      if (Number.isNaN(bumped)) continue;
      rachats.push({ studentIndex: BigInt(idx), bumpedMoyenne: bumped, reason: v.reason.trim() });
    }

    (writeContract as any)({
      ...diplomaContract,
      functionName: "deliberate",
      args: [batchId, rachats, delibNote.trim()],
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) return;
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
            <p className="font-semibold text-slate-800 leading-snug truncate">
              {description ?? "Chargement…"}
            </p>
            {expiresAt !== undefined && !isMinted && !isCancelled && (
              <p
                className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  isExpired ? "text-red-500" : "text-slate-400",
                )}
              >
                <Clock className="h-3 w-3" />
                {isExpired
                  ? "Expiré"
                  : `Expire le ${formatTimestamp(expiresAt)}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {statusNum !== undefined && (
              <span className={cn("badge", BATCH_STATUS_COLORS[statusNum])}>
                {BATCH_STATUS_LABELS[statusNum]}
              </span>
            )}
            {isExpired && (
              <span className="badge bg-orange-100 text-orange-700 border-orange-200">
                Expiré
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          {studentCount !== undefined
            ? `${studentCount.toString()} étudiants`
            : "—"}
        </div>

        {isCancelled && cancelReasonOnChain && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Motif : {cancelReasonOnChain}</span>
          </div>
        )}

        {!isCancelled && statusNum !== undefined && (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition",
                  statusNum >= step ? "bg-uni-blue" : "bg-slate-200",
                )}
              />
            ))}
          </div>
        )}

        {deliberation &&
          deliberation[1] &&
          deliberation[1] !== "0x0000000000000000000000000000000000000000" && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Gavel className="h-3.5 w-3.5" />
                Délibération du jury
              </div>
              <p className="font-mono text-[10px] text-indigo-600 break-all">
                Conseil : {deliberation[1]}
              </p>
              {deliberation[2] && (
                <p className="italic">« {deliberation[2]} »</p>
              )}
            </div>
          )}

        {canDeliberate && showDelibForm && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 space-y-3">
            <div className="text-sm font-semibold text-indigo-800">
              Procès-verbal & Rachats
            </div>
            <p className="text-xs text-indigo-700">
              Complétez les rachats (bump de moyenne) si nécessaire. Laissez
              vide si aucun rachat.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="p-2">#</th>
                    <th className="p-2">Étudiant</th>
                    <th className="p-2">Base</th>
                    <th className="p-2">Final</th>
                    <th className="p-2">Progression</th>
                    <th className="p-2">Rachat (moy.)</th>
                    <th className="p-2">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {pvRows.length > 0 ? (
                    pvRows.map((r) => {
                      const idx = r.idx;
                      const studentName = r.student.studentName ?? "—";
                      const base =
                        r.pv.baseMoyenne ?? r.student.baseMoyenne ?? 0;
                      const finalM = r.pv.finalMoyenne ?? 0;
                      const status = Number(r.pv.status ?? 0);
                      const existing = rachatsState[idx] || {
                        bumped: "",
                        reason: "",
                      };
                      return (
                        <tr key={idx} className="align-top border-t">
                          <td className="p-2 align-top">{idx + 1}</td>
                          <td className="p-2 align-top">{studentName}</td>
                          <td className="p-2 font-mono">
                            {formatMoyenne(base)}
                          </td>
                          <td className="p-2 font-mono">
                            {formatMoyenne(finalM)}
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[11px] font-semibold",
                                PROGRESSION_COLORS[status],
                              )}
                            >
                              {PROGRESSION_LABELS[status]}
                            </span>
                          </td>
                          <td className="p-2">
                            <input
                              className="input input-sm w-20 font-mono"
                              placeholder="—"
                              value={existing.bumped}
                              onChange={(e) =>
                                setRachatsState((s) => ({
                                  ...s,
                                  [idx]: {
                                    ...(s[idx] || { bumped: "", reason: "" }),
                                    bumped: e.target.value,
                                  },
                                }))
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="input input-sm"
                              placeholder="Motif du rachat"
                              value={existing.reason}
                              onChange={(e) =>
                                setRachatsState((s) => ({
                                  ...s,
                                  [idx]: {
                                    ...(s[idx] || { bumped: "", reason: "" }),
                                    reason: e.target.value,
                                  },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-2 text-xs text-slate-500">
                        Chargement des PV…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <label className="text-xs font-semibold text-indigo-800">
                Note du jury (optionnel)
              </label>
              <textarea
                className="input min-h-[60px] resize-none text-xs"
                placeholder="ex: Jury réuni le 15/06/2024. Tous les étudiants ont été validés à l'unanimité."
                value={delibNote}
                onChange={(e) => setDelibNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={loading}
                onClick={() => {
                  setShowDelibForm(false);
                  setDelibNote("");
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800"
                disabled={loading}
                onClick={handleDeliberate}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Gavel className="h-3 w-3" />
                )}
                Confirmer la délibération
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canDeliberate && !showDelibForm && (
            <button
              className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800"
              disabled={loading}
              onClick={() => setShowDelibForm(true)}
            >
              <Gavel className="h-3 w-3" />
              Délibérer (Conseil)
            </button>
          )}
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
          {isMinted && (
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
      </div>

      {/* Cancel modal */}
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
