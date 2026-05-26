"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseAbiItem } from "viem";
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  Send,
  RefreshCw,
} from "lucide-react";
import { publicClient } from "@/lib/contract";
import {
  PFE_DELIBERATION_ABI,
  PFE_DELIBERATION_ADDRESS,
} from "@/lib/pfeDeliberation";
import { WalletButton } from "@/components/WalletButton";

interface StudentInfo {
  matricule: string;
  name: string;
  pfeTitle: string;
  specialty: string;
  academicYear: string;
}

interface JuryInfo {
  president: string;
  promoteur: string;
  examinateur1: string;
  examinateur2: string;
}

interface SessionDetails {
  sessionId: bigint;
  student: StudentInfo;
  jury: JuryInfo;
  voteCount: number;
  isCalculated: boolean;
  finalAverage: number;
  mentionLabel: string;
  state: number;
}

type GradeCriterion =
  | "rapport"
  | "conception"
  | "application"
  | "presentation"
  | "qa";

type GradeInputs = Record<GradeCriterion, string>;

const GRADE_LIMITS = {
  rapport: 5,
  conception: 4,
  application: 5,
  presentation: 3,
  qa: 3,
} as const;

const GRADE_CRITERIA = [
  { key: "rapport", label: "Rapport" },
  { key: "conception", label: "Conception" },
  { key: "application", label: "Application" },
  { key: "presentation", label: "Présentation" },
  { key: "qa", label: "Q&A" },
] as const satisfies ReadonlyArray<{
  key: GradeCriterion;
  label: string;
}>;

const EMPTY_GRADE: GradeInputs = {
  rapport: "5",
  conception: "4",
  application: "5",
  presentation: "3",
  qa: "3",
};

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function validateGrade(criterion: GradeCriterion, value: string) {
  if (value.trim() === "") {
    return "La note est requise.";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return "La note doit être un entier.";
  }

  if (parsed < 0) {
    return "La note doit être supérieure ou égale à 0.";
  }

  if (parsed > GRADE_LIMITS[criterion]) {
    return `La note doit être inférieure ou égale à ${GRADE_LIMITS[criterion]}.`;
  }

  return "";
}

function parseGrade(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) * 100 : 0;
}

async function loadAssignedSessions(
  address: string,
  deliberationAddress: `0x${string}`,
) {
  const sessionInitialized = parseAbiItem(
    "event SessionInitialized(uint256 indexed sessionId, string matricule, address president, uint256 createdAt)",
  );

  const logs = await publicClient.getLogs({
    address: deliberationAddress,
    event: sessionInitialized,
    fromBlock: BigInt(0),
    toBlock: "latest",
  });

  const sessionIds = Array.from(
    new Set(
      logs
        .map((log) => log.args.sessionId)
        .filter((value): value is bigint => value !== undefined),
    ),
  );

  const assignedSessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const [student, jury, status] = (await Promise.all([
        publicClient.readContract({
          address: deliberationAddress,
          abi: PFE_DELIBERATION_ABI,
          functionName: "getStudentInfo",
          args: [sessionId],
        }),
        publicClient.readContract({
          address: deliberationAddress,
          abi: PFE_DELIBERATION_ABI,
          functionName: "getJuryInfo",
          args: [sessionId],
        }),
        publicClient.readContract({
          address: deliberationAddress,
          abi: PFE_DELIBERATION_ABI,
          functionName: "getSessionStatus",
          args: [sessionId],
        }),
      ])) as [StudentInfo, JuryInfo, [number, boolean, number, string, number]];

      const juryAddresses = [
        jury.president,
        jury.promoteur,
        jury.examinateur1,
        jury.examinateur2,
      ].map(normalizeAddress);

      if (!juryAddresses.includes(normalizeAddress(address))) {
        return null;
      }

      return {
        sessionId,
        student,
        jury,
        voteCount: Number(status[0]),
        isCalculated: status[1],
        finalAverage: Number(status[2]),
        mentionLabel: status[3],
        state: Number(status[4]),
      } satisfies SessionDetails;
    }),
  );

  return assignedSessions.filter(
    (session): session is SessionDetails => session !== null,
  );
}

interface JurySessionCardProps {
  session: SessionDetails;
  inputs: GradeInputs;
  disabled: boolean;
  isSubmitting: boolean;
  onGradeChange: (criterion: GradeCriterion, value: string) => void;
  onSubmit: () => void;
}

const JurySessionCard = memo(function JurySessionCard({
  session,
  inputs,
  disabled,
  isSubmitting,
  onGradeChange,
  onSubmit,
}: JurySessionCardProps) {
  const sessionId = session.sessionId.toString();
  const isLocked = session.isCalculated || session.state === 2;

  const fieldState = useMemo(
    () =>
      GRADE_CRITERIA.map((criterion) => ({
        ...criterion,
        error: validateGrade(criterion.key, inputs[criterion.key]),
        max: GRADE_LIMITS[criterion.key],
      })),
    [inputs],
  );

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-uni-blue">
            Session #{sessionId}
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            {session.student.name}
          </h2>
          <p className="text-sm text-slate-500">
            {session.student.matricule} • {session.student.specialty} •{" "}
            {session.student.academicYear}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="font-semibold text-slate-800">Vote count</p>
          <p className="text-slate-500">{session.voteCount}/4</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Sujet</p>
          <p className="mt-1 text-sm text-slate-600">
            {session.student.pfeTitle}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Statut</p>
          <p className="mt-1 text-sm text-slate-600">
            {isLocked
              ? `Calculée — ${session.mentionLabel} (${(session.finalAverage / 100).toFixed(2)}/20)`
              : "Ouverte pour vote"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="label">Président</p>
          <p className="text-sm text-slate-600 font-mono">
            {session.jury.president}
          </p>
        </div>
        <div>
          <p className="label">Promoteur</p>
          <p className="text-sm text-slate-600 font-mono">
            {session.jury.promoteur}
          </p>
        </div>
        <div>
          <p className="label">Examinateur 1</p>
          <p className="text-sm text-slate-600 font-mono">
            {session.jury.examinateur1}
          </p>
        </div>
        <div>
          <p className="label">Examinateur 2</p>
          <p className="text-sm text-slate-600 font-mono">
            {session.jury.examinateur2}
          </p>
        </div>
      </div>

      {isLocked ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          La session est verrouillée. La note finale est déjà publiée sur la
          blockchain.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="label">Grades</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {fieldState.map((criterion) => (
                <label key={criterion.key} className="space-y-1">
                  <span className="text-sm text-slate-600">
                    {criterion.label}{" "}
                    <span className="text-slate-400">
                      (0 à {criterion.max})
                    </span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={criterion.max}
                    step={1}
                    value={inputs[criterion.key]}
                    onChange={(event) =>
                      onGradeChange(criterion.key, event.target.value)
                    }
                    className={
                      criterion.error
                        ? "input border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "input"
                    }
                    disabled={disabled || isSubmitting}
                  />
                  {criterion.error && (
                    <p className="text-xs text-red-500">{criterion.error}</p>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Soumission…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Soumettre mes notes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default function JuryPage() {
  const { address, isConnected } = useAccount();
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingSessionId, setSubmittingSessionId] = useState<bigint | null>(
    null,
  );
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInputs>>(
    {},
  );

  const deliberationAddress = PFE_DELIBERATION_ADDRESS as
    | `0x${string}`
    | undefined;

  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const handledTxHashRef = useRef<string | null>(null);

  const hasDeliberationConfig = Boolean(deliberationAddress);
  const isTxBusy = isPending || isConfirming;

  const refreshSessions = useCallback(async () => {
    if (!address || !deliberationAddress) {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    setError(null);

    try {
      const nextSessions = await loadAssignedSessions(
        address,
        deliberationAddress,
      );
      setSessions(nextSessions);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Impossible de charger les sessions de délibération.",
      );
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [address, deliberationAddress]);

  const clearSessionInputs = useCallback(
    (currentSessions: SessionDetails[]) => {
      setGradeInputs((current) => {
        const next = { ...current };
        for (const session of currentSessions) {
          delete next[session.sessionId.toString()];
        }
        return next;
      });
    },
    [],
  );

  const handleGradeChange = useCallback(
    (sessionId: bigint, criterion: GradeCriterion, value: string) => {
      const key = sessionId.toString();
      setGradeInputs((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? EMPTY_GRADE),
          [criterion]: value,
        },
      }));
    },
    [],
  );

  useEffect(() => {
    if (!isConnected || !address || !deliberationAddress) {
      return;
    }

    let active = true;

    void (async () => {
      if (!active) {
        return;
      }
      await refreshSessions();
    })();

    return () => {
      active = false;
    };
  }, [address, deliberationAddress, isConnected, refreshSessions]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }

    if (handledTxHashRef.current === txHash) {
      return;
    }

    handledTxHashRef.current = txHash;

    const timeoutId = window.setTimeout(() => {
      clearSessionInputs(sessions);
      void refreshSessions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [clearSessionInputs, isSuccess, refreshSessions, sessions, txHash]);

  useEffect(() => {
    if (!txHash) {
      handledTxHashRef.current = null;
    }
  }, [txHash]);

  const onSubmitGrade = useCallback(
    async (sessionId: bigint) => {
      if (!deliberationAddress) {
        setError("Adresse du contrat de délibération non configurée.");
        return;
      }

      const inputs = gradeInputs[sessionId.toString()] ?? EMPTY_GRADE;
      const firstError = GRADE_CRITERIA.map((criterion) =>
        validateGrade(criterion.key, inputs[criterion.key]),
      ).find((message) => message !== "");

      if (firstError) {
        setError(firstError);
        return;
      }

      setSubmittingSessionId(sessionId);
      setError(null);

      try {
        await writeContractAsync({
          address: deliberationAddress,
          abi: PFE_DELIBERATION_ABI,
          functionName: "submitGrade",
          args: [
            sessionId,
            parseGrade(inputs.rapport),
            parseGrade(inputs.conception),
            parseGrade(inputs.application),
            parseGrade(inputs.presentation),
            parseGrade(inputs.qa),
          ],
        });

        setSubmittingSessionId(null);
      } catch (error: any) {
        console.error("MetaMask / Contract Error:", error);

        // 1. Instantly unfreeze the submitting state
        setSubmittingSessionId(null);

        // 2. Extract the clean revert message (e.g., "Jury already voted" or "User rejected request")
        const customMessage =
          error.shortMessage ||
          (error.message
            ? error.message.split("\n")[0]
            : "Annulée par l'utilisateur.");

        // 3. Display it in the error box
        setError(`Échec : ${customMessage}`);
      }
    },
    [deliberationAddress, gradeInputs, writeContractAsync],
  );

  if (!isConnected && !address) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-uni-blue">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Espace jury</h1>
        <p className="text-slate-500">
          Connectez votre wallet MetaMask pour voir les sessions qui vous sont
          assignées et soumettre vos notes.
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-uni-blue">
            Délibération PFE
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Tableau jury</h1>
          <p className="mt-2 text-sm text-slate-500">
            Les sessions vous sont attribuées automatiquement à partir de la
            blockchain. Lorsque les 4 jurys ont voté, le contrat calcule la note
            finale et la verrouille.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshSessions()}
          className="btn-secondary"
          disabled={loadingSessions}
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      {!hasDeliberationConfig && (
        <div className="card border-amber-200 bg-amber-50 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">
              Contrat de délibération non configuré.
            </p>
          </div>
          <p className="mt-2 text-sm">
            Ajoutez{" "}
            <span className="font-mono">
              NEXT_PUBLIC_DELIBERATION_CONTRACT_ADDRESS
            </span>{" "}
            dans votre fichier <span className="font-mono">.env.local</span>.
          </p>
        </div>
      )}

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-700">
          <p className="font-semibold">Erreur</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {loadingSessions ? (
        <div className="card flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des sessions assignées…
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center text-slate-500">
          Aucune session de délibération assignée à ce wallet pour
          l&apos;instant.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const sessionId = session.sessionId.toString();
            const inputs = gradeInputs[sessionId] ?? EMPTY_GRADE;
            const isSubmitting = submittingSessionId === session.sessionId;

            return (
              <JurySessionCard
                key={sessionId}
                session={session}
                inputs={inputs}
                disabled={isTxBusy}
                isSubmitting={isSubmitting}
                onGradeChange={(criterion, value) =>
                  handleGradeChange(session.sessionId, criterion, value)
                }
                onSubmit={() => void onSubmitGrade(session.sessionId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
