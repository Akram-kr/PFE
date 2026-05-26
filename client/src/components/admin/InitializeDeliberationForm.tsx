"use client";

import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { Loader2, Send } from "lucide-react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ADMIN_ROLE } from "@/lib/contract";
import {
  PFE_DELIBERATION_ABI,
  PFE_DELIBERATION_ADDRESS,
} from "@/lib/pfeDeliberation";
import { cn } from "@/lib/utils";

interface SessionForm {
  matricule: string;
  name: string;
  pfeTitle: string;
  specialty: string;
  academicYear: string;
  president: string;
  promoteur: string;
  examinateur1: string;
  examinateur2: string;
}

const emptyForm: SessionForm = {
  matricule: "",
  name: "",
  pfeTitle: "",
  specialty: "",
  academicYear: "",
  president: "",
  promoteur: "",
  examinateur1: "",
  examinateur2: "",
};

interface Props {
  onSuccess?: () => void;
}

export function InitializeDeliberationForm({ onSuccess }: Props) {
  const { address } = useAccount();
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const deliberationAddress = PFE_DELIBERATION_ADDRESS as
    | `0x${string}`
    | undefined;

  const { data: isAdmin = false } = useReadContract({
    address: deliberationAddress,
    abi: PFE_DELIBERATION_ABI,
    functionName: "hasRole",
    args: [
      ADMIN_ROLE,
      (address ??
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    query: { enabled: Boolean(address && deliberationAddress) },
  }) as { data?: boolean };

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const juryWallets = [
    form.president,
    form.promoteur,
    form.examinateur1,
    form.examinateur2,
  ];

  const invalidJuryAddresses = juryWallets.filter(
    (value) => value.trim() !== "" && !isAddress(value),
  );

  const canSubmit = useMemo(() => {
    return Boolean(
      deliberationAddress &&
      address &&
      isAdmin &&
      form.matricule.trim() &&
      form.name.trim() &&
      form.pfeTitle.trim() &&
      form.specialty.trim() &&
      form.academicYear.trim() &&
      form.president.trim() &&
      form.promoteur.trim() &&
      form.examinateur1.trim() &&
      form.examinateur2.trim() &&
      invalidJuryAddresses.length === 0,
    );
  }, [
    address,
    deliberationAddress,
    form,
    invalidJuryAddresses.length,
    isAdmin,
  ]);

  const updateField = (field: keyof SessionForm, value: string) => {
    setError(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    if (!deliberationAddress) {
      setError("Adresse du contrat de délibération non configurée.");
      return;
    }

    if (!address) {
      setError("Connectez votre wallet pour initialiser une session.");
      return;
    }

    if (!isAdmin) {
      setError(
        "Ce wallet n’a pas le rôle ADMIN sur le contrat de délibération.",
      );
      return;
    }

    const requiredFields = [
      form.matricule,
      form.name,
      form.pfeTitle,
      form.specialty,
      form.academicYear,
      form.president,
      form.promoteur,
      form.examinateur1,
      form.examinateur2,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (invalidJuryAddresses.length > 0) {
      setError("Une ou plusieurs adresses du jury sont invalides.");
      return;
    }

    try {
      await writeContractAsync({
        address: deliberationAddress,
        abi: PFE_DELIBERATION_ABI,
        functionName: "initializeSession",
        args: [
          {
            matricule: form.matricule,
            name: form.name,
            pfeTitle: form.pfeTitle,
            specialty: form.specialty,
            academicYear: form.academicYear,
          },
          {
            president: form.president as `0x${string}`,
            promoteur: form.promoteur as `0x${string}`,
            examinateur1: form.examinateur1 as `0x${string}`,
            examinateur2: form.examinateur2 as `0x${string}`,
          },
        ],
      });
    } catch (submitError: unknown) {
      console.error("Error during session initialization:", submitError);
      const err = submitError as { shortMessage?: string; message?: string };
      const cleanMessage =
        err.shortMessage ||
        (err.message
          ? err.message.split("\n")[0]
          : "L'initialisation de la session a échoué.");

      setError(`Échec : ${cleanMessage}`);
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!deliberationAddress && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Le contrat de délibération n’est pas configuré. Ajoutez la variable
          <span className="mx-1 font-mono">
            NEXT_PUBLIC_DELIBERATION_CONTRACT_ADDRESS
          </span>
          dans votre environnement.
        </div>
      )}

      {!isAdmin && Boolean(address) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Ce wallet n’est pas autorisé à initialiser une session de
          délibération.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="label">Matricule</span>
          <input
            className="input"
            value={form.matricule}
            onChange={(event) => updateField("matricule", event.target.value)}
            placeholder="202331000001"
          />
        </label>

        <label className="space-y-1">
          <span className="label">Nom complet</span>
          <input
            className="input"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Nom Prénom"
          />
        </label>

        <label className="space-y-1">
          <span className="label">Sujet PFE</span>
          <input
            className="input"
            value={form.pfeTitle}
            onChange={(event) => updateField("pfeTitle", event.target.value)}
            placeholder="Titre du projet"
          />
        </label>

        <label className="space-y-1">
          <span className="label">Spécialité</span>
          <input
            className="input"
            value={form.specialty}
            onChange={(event) => updateField("specialty", event.target.value)}
            placeholder="Génie logiciel"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="label">Année académique</span>
          <input
            className="input"
            value={form.academicYear}
            onChange={(event) =>
              updateField("academicYear", event.target.value)
            }
            placeholder="2024/2025"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Jury</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(
            [
              { key: "president", label: "Président" },
              { key: "promoteur", label: "Promoteur" },
              { key: "examinateur1", label: "Examinateur 1" },
              { key: "examinateur2", label: "Examinateur 2" },
            ] as const
          ).map(({ key, label }) => {
            const value = form[key];
            const invalid = value.trim() !== "" && !isAddress(value);

            return (
              <label key={key} className="space-y-1">
                <span className="label">{label}</span>
                <input
                  className={cn(
                    "input",
                    invalid &&
                      "border-red-300 focus:border-red-400 focus:ring-red-200",
                  )}
                  value={value}
                  onChange={(event) => updateField(key, event.target.value)}
                  placeholder="0x..."
                />
                {invalid && (
                  <p className="text-xs text-red-500">Adresse invalide.</p>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canSubmit || isPending || isConfirming}
          className="btn-primary"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Initialisation…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Initialiser la session
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {isSuccess && txHash && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Session initialisée avec succès. Transaction : {txHash}
        </div>
      )}
    </form>
  );
}
