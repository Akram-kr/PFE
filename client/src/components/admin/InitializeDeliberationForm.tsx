"use client";

import { useMemo, useState, useEffect } from "react";
import { isAddress } from "viem";
import { Loader2, Send } from "lucide-react";
import { getStudentBatchProfile } from "@/lib/studentBatch";
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
  const [fetchingError, setFetchingError] = useState<string | null>(null);
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
  const resetProfile = (matricule: string) => {
    updateField("matricule", matricule);
    updateField("name", "");
    updateField("specialty", "");
    updateField("academicYear", "");
  };
  const lookupStudent = async (matricule: string) => {
    const normalizedMatricule = matricule.trim();

    if (!normalizedMatricule) {
      updateField("matricule", "");
      updateField("name", "");
      updateField("specialty", "");
      updateField("academicYear", "");
      setFetchingError(
        "Le matricule est requis pour charger le profil étudiant.",
      );
      return;
    }

    try {
      const profile = await getStudentBatchProfile(normalizedMatricule);

      if (!profile) {
        throw new Error("Aucun étudiant trouvé pour ce matricule.");
      }

      // Update the form with the retrieved profile data
      updateField("matricule", profile.matricule);
      updateField("name", profile.studentName);
      updateField("specialty", profile.department);
      updateField("academicYear", profile.currentYear);

      setFetchingError("");
    } catch (error) {
      updateField("matricule", normalizedMatricule);
      setFetchingError(
        error instanceof Error
          ? error.message
          : "Impossible de charger le profil étudiant.",
      );
    }
  };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    console.log("Form submission triggered", form);
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
      form.pfeTitle,
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
    // ####################
    console.log("Submitting form with data:", form);
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
      setIsPending(false);
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

      <div className="space-y-3  border border-slate-200  rounded-xl  bg-slate-50 p-4 text-sm">
        {/* Top Section: Matricule Input remains on its own line */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label mb-1">Matricule *</label>
            <input
              className="input font-mono w-full"
              placeholder="202331000001"
              value={form.matricule}
              onChange={(event) => resetProfile(event.target.value)}
              onBlur={() => lookupStudent(form.matricule)}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Le profil étudiant est chargé depuis Progress après validation du
              matricule.
            </p>
          </div>
          <div>
            <label className="label mb-1">Project name</label>
            <input
              className="input w-full"
              placeholder="Titre du projet"
              value={form.pfeTitle}
              onChange={(event) => updateField("pfeTitle", event.target.value)}
            />
          </div>
        </div>
        {/* Bottom Section: ONLY the profile details rendered on a clean single line */}
        <div className=" input flex flex-row items-center bg-white justify-between rounded-lg gap-6 border-t border-slate-100 p-4">
          {/* 1. Nom Complet */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 whitespace-nowrap">
              Nom complet
            </p>
            <p className="font-medium text-slate-800 truncate">
              {form.name || "_"}
            </p>
          </div>

          {/* 2. Spécialité */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 whitespace-nowrap">
              Spécialité
            </p>
            <p className="font-medium text-slate-800 truncate">
              {form.specialty || "_"}
            </p>
          </div>

          {/* 3. Année de promotion */}
          <div className="shrink-0 ">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 whitespace-nowrap">
              Année de promotion
            </p>

            <p className="font-medium text-slate-800">
              {form.academicYear || "_"}
            </p>
          </div>
        </div>
      </div>
      {fetchingError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchingError}
        </div>
      )}
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
