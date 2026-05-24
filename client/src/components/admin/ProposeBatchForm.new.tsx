"use client";

import { useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignMessage,
  useAccount,
} from "wagmi";
import {
  Loader2,
  Trash2,
  Upload,
  Lock,
  ShieldCheck,
  Database,
} from "lucide-react";
import { diplomaContract, publicClient } from "@/lib/contract";
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
import { getStudentBatchProfile } from "@/lib/studentBatch";

interface StudentRow {
  id: string;
  matricule: string;
  wallet: string;
  studentName: string;
  department: string;
  graduationYear: number;
  totalCredits: number | null;
  pfeNote: number | null;
  pdfFile: File | null;
  pdfCID: string;
  shardCIDs: [string, string, string] | null;
  encryptionIv: string;
  metadataCID: string;
  sha256Hash: string;
  status: "idle" | "loading" | "uploading" | "ready" | "error";
}

type SubmitStep = "idle" | "registering" | "proposing";

const emptyRow = (): StudentRow => ({
  id: crypto.randomUUID(),
  matricule: "",
  wallet: "",
  studentName: "",
  department: "Informatique",
  graduationYear: new Date().getFullYear(),
  totalCredits: null,
  pfeNote: null,
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

export function ProposeBatchForm({ onSuccess }: Props) {
  const { address } = useAccount();
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([emptyRow()]);
  const [globalError, setGlobalError] = useState("");
  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");
  const encKeyRef = useRef<CryptoKey | null>(null);
  const { signMessageAsync } = useSignMessage();

  const { writeContractAsync: uploadToStorage, isPending: isStoragePending } =
    useWriteContract();

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
      pdfFile: null,
      pdfCID: "",
      shardCIDs: null,
      encryptionIv: "",
      metadataCID: "",
      sha256Hash: "",
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
        pdfFile: null,
        pdfCID: "",
        shardCIDs: null,
        encryptionIv: "",
        metadataCID: "",
        sha256Hash: "",
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

  const handleUploadAll = async () => {
    setGlobalError("");

    if (FILESTORAGE_ENABLED && !encKeyRef.current) {
      try {
        const signature = await signMessageAsync({ message: SIGN_MESSAGE });
        encKeyRef.current = await deriveEncryptionKey(signature);
      } catch {
        setGlobalError(
          "Signature refusée. La signature MetaMask est requise pour chiffrer les fichiers.",
        );
        return;
      }
    }

    for (const row of rows) {
      if (row.metadataCID) {
        continue;
      }

      if (!row.pdfFile) {
        setGlobalError(
          "Veuillez sélectionner un PDF pour chaque étudiant avant de l'uploader.",
        );
        update(row.id, { status: "error" });
        continue;
      }

      update(row.id, { status: "uploading" });

      try {
        const fileBuffer = await row.pdfFile.arrayBuffer();
        const sha256Hash = await sha256Buffer(fileBuffer);

        let pdfCID = "";
        let shardCIDs: [string, string, string] | null = null;
        let encryptionIv = "";

        if (FILESTORAGE_ENABLED && encKeyRef.current) {
          const { encryptedData, iv } = await encryptBuffer(
            fileBuffer,
            encKeyRef.current,
          );
          encryptionIv = iv;

          const [shard0, shard1, shard2] = shardBuffer(encryptedData, 3);
          const baseName = row.pdfFile.name.replace(/\.pdf$/i, "");

          const [cid0, cid1, cid2] = await Promise.all([
            pinFileToIPFS(shard0, `${baseName}_shard_0.bin`),
            pinFileToIPFS(shard1, `${baseName}_shard_1.bin`),
            pinFileToIPFS(shard2, `${baseName}_shard_2.bin`),
          ]);

          shardCIDs = [cid0, cid1, cid2];
        } else {
          pdfCID = await pinFileToIPFS(fileBuffer, row.pdfFile.name);
        }

        const metadata: Record<string, unknown> = {
          studentName: row.studentName,
          matricule: row.matricule,
          department: row.department,
          graduationYear: row.graduationYear,
          totalCredits: row.totalCredits,
          pfeNote: row.pfeNote,
          university: "Université de Blida 1",
          issueDate: new Date().toISOString().split("T")[0],
          contractAddress: diplomaContract.address,
        };

        if (shardCIDs) {
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
          shardCIDs,
          encryptionIv,
          metadataCID,
          status: "ready",
        });
      } catch {
        update(row.id, { status: "error" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        row.pfeNote >= 0 &&
        Boolean(row.metadataCID);

      return profileReady;
    });

    if (!allReady) {
      setGlobalError(
        "Veuillez charger le profil du matricule, uploader le PDF, puis relancer la soumission.",
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
      ipfsCID: row.metadataCID,
    }));

    const rowsWithShards = rows.filter((row) => row.shardCIDs && row.pdfFile);

    if (FILE_STORAGE_ADDRESS && rowsWithShards.length > 0) {
      try {
        setSubmitStep("registering");

        const fileInputs = rowsWithShards.map((row) => ({
          ipfsHashes: row.shardCIDs as [string, string, string],
          fileName: row.pdfFile!.name.replace(/\.pdf$/i, ""),
          fileExtension: "pdf",
          fileSize: BigInt(row.pdfFile!.size),
          encryptionIv: row.encryptionIv,
          fileHash: row.sha256Hash as `0x${string}`,
        }));

        const storageTxHash = await uploadToStorage({
          address: FILE_STORAGE_ADDRESS,
          abi: FILE_STORAGE_ABI,
          functionName: "uploadMultipleFiles",
          args: [fileInputs],
        });

        await publicClient.waitForTransactionReceipt({ hash: storageTxHash });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setGlobalError(`Erreur FileStorage : ${message}`);
        setSubmitStep("idle");
        return;
      }
    }

    setSubmitStep("proposing");
    proposeBatch({
      ...diplomaContract,
      functionName: "proposeBatch",
      args: [students, description],
    });
  };

  const loading =
    isStoragePending ||
    isProposePending ||
    isConfirming ||
    submitStep !== "idle";

  const uploadReady = rows.every(
    (row) =>
      Boolean(row.matricule) &&
      Boolean(row.wallet) &&
      Boolean(row.studentName) &&
      Boolean(row.department) &&
      row.graduationYear > 1900 &&
      row.totalCredits !== null &&
      row.totalCredits > 0 &&
      row.pfeNote !== null &&
      row.pfeNote >= 0,
  );

  const hasShards = rows.some((row) => row.shardCIDs);

  const submitLabel = () => {
    if (submitStep === "registering") return "Enregistrement FileStorage…";
    if (submitStep === "proposing" && isConfirming)
      return "Confirmation blockchain…";
    if (submitStep === "proposing") return "Proposition en cours…";
    return "Proposer le lot";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {FILESTORAGE_ENABLED ? (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Mode chiffré activé</strong> — les PDFs seront chiffrés
            (AES-GCM) et fragmentés en 3 éclats IPFS avant dêtre intégrés au
            lot.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Database className="h-4 w-4 shrink-0" />
          <span>
            Mode stockage simple — définissez{" "}
            <code>NEXT_PUBLIC_FILE_STORAGE_ADDRESS</code>
            pour activer le chiffrement et le stockage fragmenté.
          </span>
        </div>
      )}

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

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={cn(
              "rounded-lg border p-4 space-y-3",
              row.status === "ready" && "border-green-200 bg-green-50/40",
              row.status === "uploading" && "border-blue-200 bg-blue-50/40",
              row.status === "error" && "border-red-200 bg-red-50/40",
              row.status === "loading" && "border-violet-200 bg-violet-50/40",
              row.status === "idle" && "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Étudiant #{index + 1}
                {row.status === "ready" && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {row.shardCIDs ? "IPFS chiffré ✓" : "IPFS ✓"}
                  </span>
                )}
                {row.status === "loading" && (
                  <span className="flex items-center gap-1 text-violet-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Chargement…
                  </span>
                )}
                {row.status === "uploading" && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Upload…
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
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    update(row.id, {
                      pdfFile: file,
                      metadataCID: "",
                      sha256Hash: "",
                      shardCIDs: null,
                      encryptionIv: "",
                      pdfCID: "",
                      status: "idle",
                    });
                  }
                }}
              />

              {row.status === "ready" && row.shardCIDs && (
                <div className="mt-1.5 space-y-0.5">
                  {row.shardCIDs.map((cid, shardIndex) => (
                    <p
                      key={shardIndex}
                      className="flex items-center gap-1.5 truncate font-mono text-[10px] text-green-700"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      Éclat {shardIndex}: {cid}
                    </p>
                  ))}
                </div>
              )}
              {row.status === "ready" && row.metadataCID && (
                <p className="mt-1 truncate font-mono text-xs text-green-600">
                  Métadonnées CID: {row.metadataCID}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {globalError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </p>
      )}

      {submitStep === "registering" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Étape 1/2 — Enregistrement des{" "}
          {rows.filter((row) => row.shardCIDs).length} fichier(s) dans
          FileStorage…
        </div>
      )}
      {submitStep === "proposing" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Étape 2/2 — Proposition du lot sur la blockchain…
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
            "btn-primary ml-auto text-xs",
            hasShards &&
              FILE_STORAGE_ADDRESS &&
              "bg-blue-700 hover:bg-blue-800",
          )}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
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
