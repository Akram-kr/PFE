"use client";

import { useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
  useAccount,
} from "wagmi";
import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Upload,
  Lock,
  ShieldCheck,
  Database,
} from "lucide-react";
import {
  diplomaContract,
  SPECIALTY_OPTIONS,
  CYCLE_OPTIONS,
  MENTION_OPTIONS,
  publicClient,
} from "@/lib/contract";
import { pinMetadataToIPFS, pinFileToIPFS } from "@/lib/pinata";
import {
  sha256Buffer,
  encryptBuffer,
  shardBuffer,
  deriveEncryptionKey,
  SIGN_MESSAGE,
} from "@/lib/crypto";
import {
  FILE_STORAGE_ABI,
  FILE_STORAGE_ADDRESS,
  FILESTORAGE_ENABLED,
} from "@/lib/filestorage";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string;
  wallet: string;
  studentName: string;
  matricule: string;
  dateOfBirth: string;
  placeOfBirth: string;
  specialty: number;
  cycle: number;
  mention: number;
  s1Grade: number | null;
  s2Grade: number | null;
  graduationYear: number;
  department: string;
  pdfFile: File | null;
  /** Single-file CID (plain upload, no encryption) */
  pdfCID: string;
  /** Three shard CIDs (encrypted upload) */
  shardCIDs: [string, string, string] | null;
  /** AES-GCM IV hex string (24 chars) — stored on-chain in FileStorage */
  encryptionIv: string;
  metadataCID: string;
  sha256Hash: string;
  status: "idle" | "uploading" | "ready" | "error";
}

type SubmitStep = "idle" | "registering" | "proposing";

const emptyRow = (): StudentRow => ({
  id: crypto.randomUUID(),
  wallet: "",
  studentName: "",
  matricule: "",
  dateOfBirth: "",
  placeOfBirth: "",
  specialty: 2,
  cycle: 1,
  mention: 2,
  s1Grade: null,
  s2Grade: null,
  graduationYear: new Date().getFullYear(),
  department: "Informatique",
  pdfFile: null,
  pdfCID: "",
  shardCIDs: null,
  encryptionIv: "",
  metadataCID: "",
  sha256Hash: "",
  status: "idle",
});

interface Props {
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProposeBatchForm({ onSuccess }: Props) {
  const { address } = useAccount();
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([emptyRow()]);
  const [globalError, setGlobalError] = useState("");
  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");
  /** Cached AES-GCM key derived from MetaMask signature — never leaves the browser */
  const encKeyRef = useRef<CryptoKey | null>(null);

  const { signMessageAsync } = useSignMessage();

  // FileStorage registration transaction (phase 1)
  const { writeContractAsync: uploadToStorage, isPending: isStoragePending } =
    useWriteContract();

  // Batch proposal transaction (phase 2)
  const {
    writeContract: proposeBatch,
    data: txHash,
    isPending: isProposePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();

      setTimeout(() => {
        setSubmitStep("idle");
      }, 0);
    }
  }, [isSuccess, onSuccess]);

  // ── Row helpers ─────────────────────────────────────────────────────────────

  const update = (id: string, patch: Partial<StudentRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const computeGradeTreeRoot = async (row: StudentRow) => {
    const baseMoyenne = Math.round(
      (((row.s1Grade ?? 0) + (row.s2Grade ?? 0)) / 2) * 100,
    );
    const payload = new TextEncoder().encode(
      `${row.studentName}|${row.matricule}|${row.department}|${row.graduationYear}|${row.s1Grade ?? 0}|${row.s2Grade ?? 0}|${baseMoyenne}`,
    );
    const digest = await crypto.subtle.digest("SHA-256", payload);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `0x${hex}` as `0x${string}`;
  };

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (id: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  // ── IPFS Upload ─────────────────────────────────────────────────────────────

  const handleUploadAll = async () => {
    setGlobalError("");

    // Request MetaMask signature once to derive the AES encryption key
    if (FILESTORAGE_ENABLED && !encKeyRef.current) {
      try {
        const sig = await signMessageAsync({ message: SIGN_MESSAGE });
        encKeyRef.current = await deriveEncryptionKey(sig);
      } catch {
        setGlobalError(
          "Signature refusée. La signature MetaMask est requise pour chiffrer les fichiers.",
        );
        return;
      }
    }

    for (const row of rows) {
      if (row.metadataCID) continue;

      update(row.id, { status: "uploading" });

      try {
        const fileBuffer = row.pdfFile ? await row.pdfFile.arrayBuffer() : null;

        let sha256Hash = row.sha256Hash;
        let pdfCID = row.pdfCID;
        let shardCIDs: [string, string, string] | null = null;
        let encryptionIv = "";

        if (fileBuffer) {
          // SHA-256 of the ORIGINAL unencrypted file — the link between both contracts
          sha256Hash = await sha256Buffer(fileBuffer);

          if (FILESTORAGE_ENABLED && encKeyRef.current) {
            // ── Encrypted + sharded path ──────────────────────────────────────
            const { encryptedData, iv } = await encryptBuffer(
              fileBuffer,
              encKeyRef.current,
            );
            encryptionIv = iv;

            const [s0, s1, s2] = shardBuffer(encryptedData, 3);
            const base = row.pdfFile!.name.replace(/\.pdf$/i, "");

            const [c0, c1, c2] = await Promise.all([
              pinFileToIPFS(s0, `${base}_shard_0.bin`),
              pinFileToIPFS(s1, `${base}_shard_1.bin`),
              pinFileToIPFS(s2, `${base}_shard_2.bin`),
            ]);

            shardCIDs = [c0, c1, c2];
            pdfCID = "";
          } else {
            // ── Plain single-file path (FileStorage not configured) ───────────
            pdfCID = await pinFileToIPFS(fileBuffer, row.pdfFile!.name);
          }
        }

        // ── Build IPFS metadata JSON ──────────────────────────────────────────
        const cycleLabel = row.cycle === 0 ? "L3" : "M2";
        const specialtyLabel =
          SPECIALTY_OPTIONS[row.specialty]?.label.split(" — ")[0] ?? "";
        const mentionLabel = MENTION_OPTIONS[row.mention]?.label ?? "";

        const metadata: Record<string, unknown> = {
          studentName: row.studentName,
          matricule: row.matricule,
          dateOfBirth: row.dateOfBirth,
          placeOfBirth: row.placeOfBirth,
          cycle: cycleLabel,
          specialty: specialtyLabel,
          mention: mentionLabel,
          department: row.department,
          university: "Université de Blida 1",
          graduationYear: row.graduationYear,
          academicYear: `${row.graduationYear - 1}-${row.graduationYear}`,
          issueDate: new Date().toISOString().split("T")[0],
          contractAddress: diplomaContract.address,
          s1Grade: row.s1Grade,
          s2Grade: row.s2Grade,
          baseMoyenne:
            row.s1Grade !== null && row.s2Grade !== null
              ? ((row.s1Grade + row.s2Grade) / 2).toFixed(2)
              : null,
        };

        if (shardCIDs) {
          // Encrypted shards — FileStorage mode
          metadata.encrypted = true;
          metadata.shardCIDs = shardCIDs;
          metadata.encryptionIv = encryptionIv;
          metadata.fileStorageOwner = address;
        } else {
          metadata.diplomaPdfCID = pdfCID;
        }

        const metadataCID = await pinMetadataToIPFS(
          metadata,
          `Diplome_${row.studentName.replace(/\s/g, "_")}`,
        );

        update(row.id, {
          pdfCID,
          sha256Hash,
          metadataCID,
          shardCIDs,
          encryptionIv,
          status: "ready",
        });
      } catch {
        update(row.id, { status: "error" });
      }
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    const allReady = rows.every(
      (r) =>
        r.wallet &&
        r.studentName &&
        r.matricule &&
        r.metadataCID &&
        r.sha256Hash &&
        r.department &&
        r.s1Grade !== null &&
        r.s2Grade !== null,
    );
    if (!allReady) {
      setGlobalError(
        "Veuillez remplir tous les champs obligatoires et uploader les fichiers vers IPFS d'abord.",
      );
      return;
    }

    const students = await Promise.all(
      rows.map(async (r) => {
        const gradeTreeRoot = await computeGradeTreeRoot(r);
        return {
          wallet: r.wallet as `0x${string}`,
          studentName: r.studentName,
          matricule: r.matricule,
          dateOfBirth: r.dateOfBirth,
          placeOfBirth: r.placeOfBirth,
          metadataCID: r.metadataCID,
          sha256Hash: r.sha256Hash as `0x${string}`,
          gradeTreeRoot,
          specialty: r.specialty,
          cycle: r.cycle,
          graduationYear: r.graduationYear,
          department: r.department,
          s1Grade: Math.round((r.s1Grade ?? 0) * 100),
          s2Grade: Math.round((r.s2Grade ?? 0) * 100),
          baseMoyenne: Math.round(
            (((r.s1Grade ?? 0) + (r.s2Grade ?? 0)) / 2) * 100,
          ),
        };
      }),
    );

    // ── Phase 1: Register encrypted shards in FileStorage ──────────────────
    const rowsWithShards = rows.filter((r) => r.shardCIDs && r.pdfFile);

    if (FILE_STORAGE_ADDRESS && rowsWithShards.length > 0) {
      try {
        setSubmitStep("registering");

        const fileInputs = rowsWithShards.map((r) => ({
          ipfsHashes: r.shardCIDs! as [string, string, string],
          fileName: r.pdfFile!.name.replace(/\.pdf$/i, ""),
          fileExtension: "pdf",
          fileSize: BigInt(r.pdfFile!.size),
          encryptionIv: r.encryptionIv,
          fileHash: r.sha256Hash as `0x${string}`,
        }));

        const storageTxHash = await uploadToStorage({
          address: FILE_STORAGE_ADDRESS,
          abi: FILE_STORAGE_ABI,
          functionName: "uploadMultipleFiles",
          args: [fileInputs],
        });

        // Wait for the FileStorage transaction to be mined before proposing
        await publicClient.waitForTransactionReceipt({ hash: storageTxHash });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setGlobalError(`Erreur FileStorage : ${msg}`);
        setSubmitStep("idle");
        return;
      }
    }

    // ── Phase 2: Propose the diploma batch ─────────────────────────────────
    setSubmitStep("proposing");
    proposeBatch({
      ...diplomaContract,
      functionName: "proposeBatch",
      args: [students, description],
    });
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const loading =
    isStoragePending ||
    isProposePending ||
    isConfirming ||
    submitStep !== "idle";
  const uploadReady = rows.every(
    (r) => r.wallet && r.studentName && r.matricule && r.department,
  );
  const hasShards = rows.some((r) => r.shardCIDs);

  const submitLabel = () => {
    if (submitStep === "registering") return "Enregistrement FileStorage…";
    if (submitStep === "proposing" && isConfirming)
      return "Confirmation blockchain…";
    if (submitStep === "proposing") return "Proposition en cours…";
    return "Proposer le lot";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Encryption mode banner */}
      {FILESTORAGE_ENABLED ? (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Mode chiffré activé</strong> — les PDFs seront chiffrés
            (AES-GCM) et fragmentés en 3 éclats IPFS avant d être enregistrés
            dans FileStorage. La clé ne quitte jamais votre navigateur.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Database className="h-4 w-4 shrink-0" />
          <span>
            Mode stockage simple — définissez{" "}
            <code>NEXT_PUBLIC_FILE_STORAGE_ADDRESS</code> pour activer le
            chiffrement et le stockage fragmenté.
          </span>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="label">Description du lot *</label>
        <input
          className="input"
          placeholder="ex: Promotion 2024 — Master Informatique"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>


      {/* Student rows */}
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className={cn(
              "rounded-lg border p-4 space-y-3",
              row.status === "ready" && "border-green-200 bg-green-50/40",
              row.status === "uploading" && "border-blue-200  bg-blue-50/40",
              row.status === "error" && "border-red-200   bg-red-50/40",
              row.status === "idle" && "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Étudiant #{idx + 1}
                {row.status === "ready" && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {row.shardCIDs ? "IPFS chiffré ✓" : "IPFS ✓"}
                  </span>
                )}
                {row.status === "uploading" && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" /> Upload…
                  </span>
                )}
                {row.status === "error" && (
                  <span className="text-red-600">✗ Erreur upload</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Wallet étudiant *</label>
                <input
                  className="input font-mono text-xs"
                  placeholder="0x…"
                  value={row.wallet}
                  onChange={(e) => update(row.id, { wallet: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Nom complet *</label>
                <input
                  className="input"
                  placeholder="Prénom NOM"
                  value={row.studentName}
                  onChange={(e) =>
                    update(row.id, { studentName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Matricule *</label>
                <input
                  className="input font-mono"
                  placeholder="MAT12345"
                  value={row.matricule}
                  onChange={(e) =>
                    update(row.id, { matricule: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Département *</label>
                <input
                  className="input"
                  placeholder="Informatique"
                  value={row.department}
                  onChange={(e) =>
                    update(row.id, { department: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Date de naissance</label>
                <input
                  type="date"
                  className="input"
                  value={row.dateOfBirth}
                  onChange={(e) =>
                    update(row.id, { dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Lieu de naissance</label>
                <input
                  className="input"
                  placeholder="Blida"
                  value={row.placeOfBirth}
                  onChange={(e) =>
                    update(row.id, { placeOfBirth: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Moyenne semestre 1 *</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.01}
                  className="input"
                  placeholder="Ex: 12.50"
                  value={row.s1Grade ?? ""}
                  onChange={(e) =>
                    update(row.id, {
                      s1Grade:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Moyenne semestre 2 *</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.01}
                  className="input"
                  placeholder="Ex: 13.75"
                  value={row.s2Grade ?? ""}
                  onChange={(e) =>
                    update(row.id, {
                      s2Grade:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Spécialité *</label>
                <select
                  className="input"
                  value={row.specialty}
                  onChange={(e) =>
                    update(row.id, { specialty: Number(e.target.value) })
                  }
                >
                  {SPECIALTY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cycle *</label>
                <select
                  className="input"
                  value={row.cycle}
                  onChange={(e) =>
                    update(row.id, { cycle: Number(e.target.value) })
                  }
                >
                  {CYCLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mention *</label>
                <select
                  className="input"
                  value={row.mention}
                  onChange={(e) =>
                    update(row.id, { mention: Number(e.target.value) })
                  }
                >
                  {MENTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Année de promotion *</label>
                <input
                  type="number"
                  className="input"
                  min={2000}
                  max={2100}
                  value={row.graduationYear}
                  onChange={(e) =>
                    update(row.id, { graduationYear: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>


            {/* PDF upload */}
            <div>
              <label className="label flex items-center gap-1.5">
                Fichier PDF du diplôme
                {FILESTORAGE_ENABLED && (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                    <Lock className="h-2.5 w-2.5" /> Chiffré + 3 éclats
                  </span>
                )}
              </label>
              <input
                type="file"
                accept="application/pdf"
                className="block w-full text-xs text-slate-500 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-uni-blue hover:file:bg-blue-100"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    update(row.id, {
                      pdfFile: f,
                      status: "idle",
                      metadataCID: "",
                      shardCIDs: null,
                    });
                }}
              />

              {row.status === "ready" && row.shardCIDs && (
                <div className="mt-1.5 space-y-0.5">
                  {row.shardCIDs.map((cid, i) => (
                    <p
                      key={i}
                      className="flex items-center gap-1.5 font-mono text-[10px] text-green-700 truncate"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      Éclat {i}: {cid}
                    </p>
                  ))}
                </div>
              )}
              {row.status === "ready" && row.metadataCID && (
                <p className="mt-1 font-mono text-xs text-green-600 truncate">
                  Métadonnées CID: {row.metadataCID}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {globalError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </p>
      )}

      {/* Submit step progress */}
      {submitStep === "registering" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Étape 1/2 — Enregistrement des{" "}
          {rows.filter((r) => r.shardCIDs).length} fichier(s) dans FileStorage…
        </div>
      )}
      {submitStep === "proposing" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Étape 2/2 — Proposition du lot sur la blockchain…
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={addRow}
          className="btn-secondary text-xs"
        >
          <Plus className="h-4 w-4" /> Ajouter un étudiant
        </button>
        <button
          type="button"
          onClick={handleUploadAll}
          className="btn-secondary text-xs"
          disabled={!uploadReady || loading}
        >
          {FILESTORAGE_ENABLED ? (
            <>
              <Lock className="h-4 w-4" /> Chiffrer &amp; uploader
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Uploader vers IPFS
            </>
          )}
        </button>
        <button
          type="submit"
          className={cn(
            "btn-primary text-xs ml-auto",
            hasShards &&
              FILE_STORAGE_ADDRESS &&
              "bg-blue-700 hover:bg-blue-800",
          )}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitLabel()}
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
