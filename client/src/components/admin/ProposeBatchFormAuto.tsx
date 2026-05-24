"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { parseAbiItem } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { cn } from "@/lib/utils";
import { diplomaContract, publicClient } from "@/lib/contract";
import { getStudentBatchProfile } from "@/lib/studentBatch";
import { saveBatchDraft } from "@/lib/batchDraft";

interface StudentRow {
  id: string;
  matricule: string;
  wallet: string;
  studentName: string;
  department: string;
  graduationYear: number;
  totalCredits: number | null;
  pfeNote: number | null;
  status: "idle" | "loading" | "error";
}

type SubmitStep = "idle" | "proposing";

const batchProposedEvent = parseAbiItem(
  "event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount)",
);

const emptyRow = (): StudentRow => ({
  id: crypto.randomUUID(),
  matricule: "",
  wallet: "",
  studentName: "",
  department: "Informatique",
  graduationYear: new Date().getFullYear(),
  totalCredits: null,
  pfeNote: null,
  status: "idle",
});

interface Props {
  onSuccess?: () => void;
}

export function ProposeBatchFormAuto({ onSuccess }: Props) {
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([emptyRow()]);
  const [globalError, setGlobalError] = useState("");
  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");

  const {
    writeContract,
    data: txHash,
    isPending: isProposePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }

    const persistDraft = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: diplomaContract.address,
          event: batchProposedEvent,
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        const log = logs.find((entry) => entry.transactionHash === txHash);

        if (log?.args.batchId !== undefined) {
          saveBatchDraft(
            log.args.batchId,
            rows.map((row) => ({
              wallet: row.wallet,
              studentName: row.studentName,
              matricule: row.matricule,
              department: row.department,
              graduationYear: row.graduationYear,
              totalCredits: row.totalCredits ?? 0,
              pfeNote: row.pfeNote ?? 0,
            })),
          );
        }
      } finally {
        setSubmitStep("idle");
        onSuccess?.();
      }
    };

    void persistDraft();
  }, [isSuccess, onSuccess, rows, txHash]);

  const update = (id: string, patch: Partial<StudentRow>) =>
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  const resetRowProfile = (id: string, matricule: string) =>
    update(id, {
      matricule,
      wallet: "",
      studentName: "",
      department: "Informatique",
      graduationYear: new Date().getFullYear(),
      totalCredits: null,
      pfeNote: null,
      status: "idle",
    });

  const lookupStudent = async (rowId: string, matricule: string) => {
    const normalizedMatricule = matricule.trim();

    if (!normalizedMatricule) {
      resetRowProfile(rowId, "");
      setGlobalError("");
      return;
    }

    update(rowId, { status: "loading" });

    try {
      const profile = await getStudentBatchProfile(normalizedMatricule);

      if (!profile) {
        throw new Error("Aucun étudiant trouvé pour ce matricule.");
      }

      update(rowId, {
        matricule: profile.matricule,
        wallet: profile.wallet,
        studentName: profile.studentName,
        department: profile.department,
        graduationYear: profile.graduationYear,
        totalCredits: profile.totalCredits,
        pfeNote: profile.pfeNote,
        status: "idle",
      });
      setGlobalError("");
    } catch (error) {
      resetRowProfile(rowId, normalizedMatricule);
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Impossible de charger le profil étudiant.",
      );
    }
  };

  const addRow = () => setRows((currentRows) => [...currentRows, emptyRow()]);

  const removeRow = (id: string) =>
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== id)
        : currentRows,
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError("");

    const allReady = rows.every((row) => {
      const profileReady =
        Boolean(row.wallet) &&
        Boolean(row.studentName) &&
        Boolean(row.department) &&
        row.graduationYear > 1900 &&
        row.totalCredits !== null &&
        row.totalCredits > 0 &&
        row.pfeNote !== null &&
        row.pfeNote >= 0;

      return profileReady;
    });

    if (!allReady) {
      setGlobalError(
        "Veuillez charger le profil du matricule avant de proposer le lot.",
      );
      return;
    }

    const students = rows.map((row) => ({
      wallet: row.wallet as `0x${string}`,
      studentName: row.studentName,
      matricule: row.matricule,
      department: row.department,
      graduationYear: row.graduationYear,
      totalCredits: row.totalCredits as number,
      pfeNote: row.pfeNote as number,
      ipfsCID: "",
    }));

    setSubmitStep("proposing");

    writeContract({
      ...diplomaContract,
      functionName: "proposeBatch",
      args: [students, description],
    });
  };

  const loading = isProposePending || isConfirming || submitStep !== "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <strong>PDF auto-généré à la finalisation.</strong> Aucun upload n'est
        requis au moment de la proposition.
      </div>

      <div>
        <label className="label">Description du lot *</label>
        <input
          className="input"
          placeholder="ex: Promotion 2024 — Master Informatique"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={cn(
              "rounded-lg border p-4 space-y-3",
              row.status === "error" && "border-red-200 bg-red-50/40",
              row.status === "loading" && "border-violet-200 bg-violet-50/40",
              row.status === "idle" && "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Étudiant #{index + 1}
                {row.status === "loading" && (
                  <span className="flex items-center gap-1 text-violet-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Chargement…
                  </span>
                )}
                {row.status === "error" && (
                  <span className="text-red-600">✗ Erreur</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-slate-400 transition hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Matricule *</label>
              <input
                className="input font-mono"
                placeholder="202331000001"
                value={row.matricule}
                onChange={(event) => {
                  resetRowProfile(row.id, event.target.value);
                }}
                onBlur={() => lookupStudent(row.id, row.matricule)}
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Le profil étudiant est chargé depuis Prisma après validation du
                matricule.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Nom complet
                  </p>
                  <p className="font-medium text-slate-800">
                    {row.studentName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Wallet
                  </p>
                  <p className="font-medium text-slate-800 break-all">
                    {row.wallet || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Département
                  </p>
                  <p className="font-medium text-slate-800">
                    {row.department || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Année de promotion
                  </p>
                  <p className="font-medium text-slate-800">
                    {row.graduationYear || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Crédits
                  </p>
                  <p className="font-medium text-slate-800">
                    {row.totalCredits ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Note PFE
                  </p>
                  <p className="font-medium text-slate-800">
                    {row.pfeNote !== null
                      ? (row.pfeNote / 100).toFixed(2)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {globalError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </p>
      )}

      {submitStep === "proposing" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Proposition du lot sur la blockchain…
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={addRow}
          className="btn-secondary text-xs"
        >
          <Upload className="h-4 w-4" /> Ajouter un étudiant
        </button>

        <button
          type="submit"
          className="btn-primary ml-auto text-xs"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {submitStep === "proposing"
            ? "Proposition en cours…"
            : "Proposer le lot"}
        </button>
      </div>

      {txHash && (
        <p className="rounded bg-green-50 p-2 font-mono text-xs text-green-700 truncate">
          ✓ Transaction proposeBatch : {txHash}
        </p>
      )}
    </form>
  );
}
