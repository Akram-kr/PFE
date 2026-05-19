"use client";
import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  diplomaContract,
  SPECIALTY_SHORT,
  CYCLE_SHORT,
  MENTION_OPTIONS,
  StudentEntry,
} from "@/lib/contract";
import { useRole } from "@/hooks/useRole";
import { useRouter } from "next/navigation";
import { keccak256, encodePacked } from "viem";

// ── helpers ────────────────────────────────────────────────────────────────
const emptyStudent = (): Partial<StudentEntry> => ({
  wallet: "" as `0x${string}`,
  studentName: "",
  matricule: "",
  dateOfBirth: "",
  placeOfBirth: "",
  metadataCID: "",
  sha256Hash: "0x" as `0x${string}`,
  specialty: 1,
  cycle: 2,
  mention: 0,
  graduationYear: new Date().getFullYear(),
  department: "Informatique",
});

export default function AdminProposePage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const { role } = useRole();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [students, setStudents] = useState<Partial<StudentEntry>[]>([
    emptyStudent(),
  ]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [batchId, setBatchId] = useState<bigint | null>(null);

  const addStudent = () => setStudents((prev) => [...prev, emptyStudent()]);
  const removeStudent = (i: number) =>
    setStudents((prev) => prev.filter((_, idx) => idx !== i));

  const updateStudent = (
    i: number,
    field: keyof StudentEntry,
    value: unknown,
  ) => {
    setStudents((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!address || !publicClient) return;
    if (!description.trim()) {
      setError("Description requise");
      return;
    }

    const invalid = students.findIndex(
      (s) => !s.wallet || !s.studentName || !s.matricule || !s.metadataCID,
    );
    if (invalid >= 0) {
      setError(`Étudiant ${invalid + 1}: champs obligatoires manquants`);
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const entries = students as StudentEntry[];
      const txHash = await writeContractAsync({
        address: diplomaContract.address,
        abi: diplomaContract.abi,
        functionName: "proposeBatch",
        args: [entries, description],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Read the new batch ID
      const nextId = (await publicClient.readContract({
        address: diplomaContract.address,
        abi: diplomaContract.abi,
        functionName: "nextBatchId",
      })) as bigint;
      setBatchId(nextId - BigInt(1));

      setStatus("done");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    } catch (e: unknown) {
      setStatus("error");
      setError(
        e instanceof Error
          ? e.message.split("\n")[0]
          : "Erreur lors de la proposition",
      );
    }
  };

  if (role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-mono text-[12px] text-t2">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-6 animate-fade-up">
        <div
          className="w-20 h-20 rounded-full border-2 border-status-green/40
                        bg-status-green-d flex items-center justify-center text-3xl animate-stamp"
        >
          ✓
        </div>
        <h2 className="font-serif text-3xl font-bold text-t1">
          Proposition soumise
        </h2>
        <p className="font-mono text-[12px] text-t2 leading-relaxed">
          Lot #{batchId?.toString()} créé avec {students.length} étudiant(s).
          <br />
          En attente de la signature du Doyen, puis du Recteur.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/proposals")}
            className="px-6 py-2.5 bg-gold text-navy font-mono text-[11px] font-semibold
                       tracking-widest rounded-btn hover:bg-gold-2 transition-colors"
          >
            VOIR LES PROPOSITIONS
          </button>
          <button
            onClick={() => {
              setStatus("idle");
              setStudents([emptyStudent()]);
              setDescription("");
            }}
            className="px-6 py-2.5 border border-line-2 text-t2 font-mono text-[11px]
                       tracking-widest rounded-btn hover:border-gold hover:text-gold transition-colors"
          >
            NOUVELLE PROPOSITION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="font-mono text-[10px] text-gold tracking-widest mb-1">
          ADMIN
        </p>
        <h1 className="font-serif text-3xl font-bold text-t1">
          Proposer un lot de diplômes
        </h1>
        <p className="font-mono text-[11px] text-t2 mt-2">
          Soumettez un lot pour signature par le Doyen et le Recteur.
        </p>
      </div>

      {/* Description */}
      <div className="corner-ornament bg-navy-2 border border-line rounded-panel p-5 animate-fade-up">
        <label className="font-mono text-[10px] text-t2 tracking-widest block mb-2">
          DESCRIPTION DU LOT *
        </label>
        <input
          className="w-full bg-navy-3 border border-line-2 rounded-btn px-4 py-2.5
                     font-mono text-[12px] text-t1 outline-none focus:border-gold
                     transition-colors placeholder:text-t3"
          placeholder="ex: Promotion 2024-2025 — ISIL L3 — Faculté des Sciences"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Student list */}
      <div className="flex flex-col gap-4">
        {students.map((s, i) => (
          <div
            key={i}
            className="corner-ornament bg-navy-2 border border-line rounded-panel p-5
                       animate-fade-up flex flex-col gap-4"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Student header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-gold tracking-widest">
                ÉTUDIANT {i + 1}
              </span>
              {students.length > 1 && (
                <button
                  onClick={() => removeStudent(i)}
                  className="font-mono text-[10px] text-t3 hover:text-red-400 transition-colors"
                >
                  ✕ Supprimer
                </button>
              )}
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: "ADRESSE WALLET *",
                  field: "wallet" as const,
                  placeholder: "0x...",
                },
                {
                  label: "NOM COMPLET *",
                  field: "studentName" as const,
                  placeholder: "Amira Benali",
                },
                {
                  label: "MATRICULE *",
                  field: "matricule" as const,
                  placeholder: "20241234",
                },
                {
                  label: "DATE DE NAISSANCE",
                  field: "dateOfBirth" as const,
                  placeholder: "15/06/2001",
                },
                {
                  label: "LIEU DE NAISSANCE",
                  field: "placeOfBirth" as const,
                  placeholder: "Blida",
                },
                {
                  label: "CID MÉTADONNÉES *",
                  field: "metadataCID" as const,
                  placeholder: "Qm...",
                },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="font-mono text-[9px] text-t3 tracking-widest block mb-1.5">
                    {label}
                  </label>
                  <input
                    className="w-full bg-navy-3 border border-line rounded-btn px-3 py-2
                               font-mono text-[11px] text-t1 outline-none focus:border-gold
                               transition-colors placeholder:text-t3"
                    placeholder={placeholder}
                    value={(s[field] as string) ?? ""}
                    onChange={(e) => updateStudent(i, field, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Selects row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "SPÉCIALITÉ",
                  field: "specialty" as const,
                  opts: [
                    ["SIQ", 0],
                    ["ISIL", 1],
                    ["AI", 2],
                    ["Réseau", 3],
                  ],
                },
                {
                  label: "CYCLE",
                  field: "cycle" as const,
                  opts: [
                    ["L3", 0],
                    ["M2", 1],
                  ],
                },
                {
                  label: "MENTION",
                  field: "mention" as const,
                  opts: [
                    ["Passable", 0],
                    ["Assez Bien", 1],
                    ["Bien", 2],
                    ["Très Bien", 3],
                  ],
                },
              ].map(({ label, field, opts }) => (
                <div key={field}>
                  <label className="font-mono text-[9px] text-t3 tracking-widest block mb-1.5">
                    {label}
                  </label>
                  <select
                    className="w-full bg-navy-3 border border-line rounded-btn px-3 py-2
                               font-mono text-[11px] text-t1 outline-none focus:border-gold
                               transition-colors appearance-none"
                    value={s[field] as number}
                    onChange={(e) =>
                      updateStudent(i, field, parseInt(e.target.value))
                    }
                  >
                    {(opts as [string, number][]).map(([l, v]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label className="font-mono text-[9px] text-t3 tracking-widest block mb-1.5">
                  ANNÉE
                </label>
                <input
                  type="number"
                  className="w-full bg-navy-3 border border-line rounded-btn px-3 py-2
                             font-mono text-[11px] text-t1 outline-none focus:border-gold
                             transition-colors"
                  value={s.graduationYear ?? 2025}
                  onChange={(e) =>
                    updateStudent(i, "graduationYear", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* SHA-256 hash field */}
            <div>
              <label className="font-mono text-[9px] text-t3 tracking-widest block mb-1.5">
                SHA-256 HASH DU PDF *
              </label>
              <input
                className="w-full bg-navy-3 border border-line rounded-btn px-3 py-2
                           font-mono text-[10px] text-t1 outline-none focus:border-gold
                           transition-colors placeholder:text-t3"
                placeholder="0x..."
                value={s.sha256Hash ?? ""}
                onChange={(e) =>
                  updateStudent(
                    i,
                    "sha256Hash",
                    e.target.value as `0x${string}`,
                  )
                }
              />
              <p className="font-mono text-[9px] text-t3 mt-1">
                Calculé côté client : SHA-256 du PDF original avant upload IPFS.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add student button */}
      <button
        onClick={addStudent}
        className="w-full py-3 border border-dashed border-line-2 rounded-panel
                   font-mono text-[11px] text-t2 hover:border-gold hover:text-gold
                   transition-all tracking-wider"
      >
        + AJOUTER UN ÉTUDIANT
      </button>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-btn px-4 py-3">
          <p className="font-mono text-[11px] text-red-400">✕ {error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="w-full py-3.5 bg-gold hover:bg-gold-2 text-navy font-mono text-[12px]
                   font-semibold tracking-widest rounded-btn transition-all
                   hover:shadow-[0_0_24px_rgba(201,168,76,0.3)] disabled:opacity-50
                   flex items-center justify-center gap-3"
      >
        {status === "loading" ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-navy/40 border-t-navy animate-spin" />
            SOUMISSION EN COURS…
          </>
        ) : (
          `▶ PROPOSER LE LOT — ${students.length} ÉTUDIANT(S)`
        )}
      </button>

      <p className="font-mono text-[10px] text-t3 text-center">
        La proposition sera soumise au Doyen et au Recteur pour signature avant
        émission.
      </p>
    </div>
  );
}
