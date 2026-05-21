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
  /** UEs (Unité d'Enseignement) with subjects */
  ues: UE[];
}

type SubmitStep = "idle" | "registering" | "proposing";

interface Subject {
  id: string;
  name: string;
  cc: number | null; // Contrôle continu (0-20)
  exam: number | null; // Examen (0-20)
  coef: number; // coefficient weight
  credits: number; // ECTS-like credits
}

interface UE {
  id: string;
  title: string;
  subjects: Subject[];
}

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
  graduationYear: new Date().getFullYear(),
  department: "Informatique",
  pdfFile: null,
  pdfCID: "",
  shardCIDs: null,
  encryptionIv: "",
  metadataCID: "",
  sha256Hash: "",
  status: "idle",
  ues: [
    {
      id: crypto.randomUUID(),
      title: "UE 1",
      subjects: [
        {
          id: crypto.randomUUID(),
          name: "Matière 1",
          cc: null,
          exam: null,
          coef: 1,
          credits: 3,
        },
      ],
    },
  ],
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
  // Per-batch CC weight (0..1) used for live compensation preview
  const [batchCcWeight, setBatchCcWeight] = useState<number>(0.4);

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

  // UE / Subject helpers
  const addUE = (rowId: string) =>
    update(rowId, {
      ues: [
        ...rows.find((r) => r.id === rowId)!.ues,
        {
          id: crypto.randomUUID(),
          title: `UE ${Date.now() % 1000}`,
          subjects: [],
        },
      ],
    });

  const removeUE = (rowId: string, ueId: string) =>
    update(rowId, {
      ues: rows.find((r) => r.id === rowId)!.ues.filter((u) => u.id !== ueId),
    });

  const addSubject = (rowId: string, ueId: string) =>
    update(rowId, {
      ues: rows
        .find((r) => r.id === rowId)!
        .ues.map((u) =>
          u.id === ueId
            ? {
                ...u,
                subjects: [
                  ...u.subjects,
                  {
                    id: crypto.randomUUID(),
                    name: "Nouvelle matière",
                    cc: null,
                    exam: null,
                    coef: 1,
                    credits: 3,
                  },
                ],
              }
            : u,
        ),
    });

  const removeSubject = (rowId: string, ueId: string, subId: string) =>
    update(rowId, {
      ues: rows
        .find((r) => r.id === rowId)!
        .ues.map((u) =>
          u.id === ueId
            ? { ...u, subjects: u.subjects.filter((s) => s.id !== subId) }
            : u,
        ),
    });

  const updateSubject = (
    rowId: string,
    ueId: string,
    subId: string,
    patch: Partial<Subject>,
  ) =>
    update(rowId, {
      ues: rows
        .find((r) => r.id === rowId)!
        .ues.map((u) =>
          u.id === ueId
            ? {
                ...u,
                subjects: u.subjects.map((s) =>
                  s.id === subId ? { ...s, ...patch } : s,
                ),
              }
            : u,
        ),
    });

  // Compute preview grades using batchCcWeight (0..1)
  const computeStudentPreview = (row: StudentRow) => {
    const ueResults = row.ues.map((ue) => {
      let totalCoef = 0;
      let weightedSum = 0;
      ue.subjects.forEach((s) => {
        const cc = s.cc ?? 0;
        const exam = s.exam ?? 0;
        // Input cc/exam are 0..20; compute weighted final using batchCcWeight (0..1)
        const subjScore = cc * batchCcWeight + exam * (1 - batchCcWeight);
        totalCoef += s.coef;
        weightedSum += subjScore * s.coef;
      });
      const ueAvg = totalCoef > 0 ? weightedSum / totalCoef : null;
      return { ueTitle: ue.title, ueAvg };
    });
    const validUeAverages = ueResults
      .map((u) => u.ueAvg)
      .filter((v) => v !== null) as number[];
    const overall = validUeAverages.length
      ? validUeAverages.reduce((a, b) => a + b, 0) / validUeAverages.length
      : null;
    return { ueResults, overall };
  };

  // Build a simple Merkle-like root placeholder by hashing concatenated leaves.
  // Proper Merkle tree construction can be added later; this produces a deterministic bytes32-like hex.
  const computeGradeTreeRoot = (row: StudentRow): `0x${string}` => {
    // Each leaf: keccak256(ueTitle + subjectName + cc*100 + exam*100)
    const leaves: string[] = [];
    row.ues.forEach((ue) => {
      ue.subjects.forEach((s) => {
        const cc = Math.round((s.cc ?? 0) * 100);
        const exam = Math.round((s.exam ?? 0) * 100);
        const leaf = `${ue.title}|${s.name}|${cc}|${exam}`;
        leaves.push(leaf);
      });
    });
    const concatenated = leaves.join("||") || row.sha256Hash || "";
    // For now return the file hash as a stable placeholder; a real Merkle root requires async hashing.
    return (
      (row.sha256Hash as `0x${string}`) ||
      (("0x" + "0".repeat(64)) as `0x${string}`)
    );
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
        };

        // Include UE/subject breakdown so off-chain grade trees can be rebuilt for verification
        metadata.ues = row.ues.map((ue) => ({
          title: ue.title,
          subjects: ue.subjects.map((s) => ({
            name: s.name,
            cc: s.cc,
            exam: s.exam,
            coef: s.coef,
            credits: s.credits,
          })),
        }));

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
        r.department,
    );
    if (!allReady) {
      setGlobalError(
        "Veuillez remplir tous les champs obligatoires et uploader les fichiers vers IPFS d'abord.",
      );
      return;
    }

    const students = rows.map((r) => ({
      wallet: r.wallet as `0x${string}`,
      studentName: r.studentName,
      matricule: r.matricule,
      dateOfBirth: r.dateOfBirth,
      placeOfBirth: r.placeOfBirth,
      metadataCID: r.metadataCID,
      sha256Hash: r.sha256Hash as `0x${string}`,
      // gradeTreeRoot — placeholder using the same file hash for now
      gradeTreeRoot:
        (r.sha256Hash as `0x${string}`) ||
        (("0x" + "0".repeat(64)) as `0x${string}`),
      specialty: r.specialty,
      cycle: r.cycle,
      graduationYear: r.graduationYear,
      department: r.department,
      // baseMoyenne: compute from UE/subjects using batchCcWeight (centi-points)
      baseMoyenne: (() => {
        const preview = computeStudentPreview(r).overall;
        return preview ? Math.round(preview * 100) : 0;
      })(),
      // rawCreditsEarned: sum of credits where subject score >= 10
      rawCreditsEarned: (() => {
        let credits = 0;
        r.ues.forEach((ue) =>
          ue.subjects.forEach((s) => {
            const cc = s.cc ?? 0;
            const exam = s.exam ?? 0;
            const subjScore = cc * batchCcWeight + exam * (1 - batchCcWeight);
            if (subjScore >= 10) credits += s.credits;
          }),
        );
        return credits;
      })(),
    }));

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
      args: [
        students as unknown as any,
        Math.round(batchCcWeight * 100),
        description,
      ],
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

      {/* Batch CC weight slider */}
      <div>
        <label className="label">Pondération CC globale (par lot)</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(batchCcWeight * 100)}
            onChange={(e) => setBatchCcWeight(Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="w-16 text-right font-mono text-sm">
            {Math.round(batchCcWeight * 100)}%
          </div>
        </div>
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

            {/* UE / Subject editor */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">UE &amp; Matières</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addUE(row.id)}
                    className="btn-secondary text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter UE
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {row.ues.map((ue) => (
                  <div key={ue.id} className="rounded border p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        value={ue.title}
                        onChange={(e) =>
                          update(row.id, {
                            ues: row.ues.map((u) =>
                              u.id === ue.id
                                ? { ...u, title: e.target.value }
                                : u,
                            ),
                          })
                        }
                        className="input text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addSubject(row.id, ue.id)}
                          className="btn-secondary text-xs"
                        >
                          <Plus className="h-3 w-3" /> Matière
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUE(row.id, ue.id)}
                          className="text-red-500 text-xs"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ue.subjects.map((s) => (
                        <div
                          key={s.id}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <input
                            className="col-span-4 input input-sm"
                            value={s.name}
                            onChange={(e) =>
                              updateSubject(row.id, ue.id, s.id, {
                                name: e.target.value,
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step={0.1}
                            className="col-span-2 input input-sm font-mono"
                            placeholder="CC"
                            value={s.cc ?? ""}
                            onChange={(e) =>
                              updateSubject(row.id, ue.id, s.id, {
                                cc:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step={0.1}
                            className="col-span-2 input input-sm font-mono"
                            placeholder="Exam"
                            value={s.exam ?? ""}
                            onChange={(e) =>
                              updateSubject(row.id, ue.id, s.id, {
                                exam:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={1}
                            max={10}
                            className="col-span-1 input input-sm"
                            value={s.coef}
                            onChange={(e) =>
                              updateSubject(row.id, ue.id, s.id, {
                                coef: Number(e.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            min={1}
                            max={10}
                            className="col-span-1 input input-sm"
                            value={s.credits}
                            onChange={(e) =>
                              updateSubject(row.id, ue.id, s.id, {
                                credits: Number(e.target.value),
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeSubject(row.id, ue.id, s.id)}
                            className="col-span-1 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live preview using batch CC weight */}
            <div className="mt-3 rounded border px-3 py-2 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Aperçu des notes (pondération CC:{" "}
                  {(batchCcWeight * 100).toFixed(0)}%)
                </p>
                <div className="text-xs text-slate-400">
                  Moyenne estimée:{" "}
                  <strong>
                    {computeStudentPreview(row).overall
                      ? computeStudentPreview(row).overall!.toFixed(2)
                      : "—"}
                  </strong>
                </div>
              </div>
              <div className="mt-2 text-xs space-y-1">
                {computeStudentPreview(row).ueResults.map((u) => (
                  <div
                    key={u.ueTitle}
                    className="flex items-center justify-between"
                  >
                    <span className="text-slate-600">{u.ueTitle}</span>
                    <span className="font-mono">
                      {u.ueAvg ? u.ueAvg.toFixed(2) : "—"}
                    </span>
                  </div>
                ))}
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
