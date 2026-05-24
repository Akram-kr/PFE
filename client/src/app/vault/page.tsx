"use client";
import { useState, useRef, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useSignMessage } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FILE_STORAGE_ABI } from "@/lib/filestorage-abi";
import { FILE_STORAGE_ADDRESS } from "@/lib/filestorage";

// ── Crypto utilities ───────────────────────────────────────────────────────
const SIGN_MSG =
  "Sign this message to unlock your DiploChain Vault. This does not cost gas.";
const KDF_SALT = new TextEncoder().encode("DiploChain-Blida1-v1");

async function deriveKey(
  address: string,
  sign: (m: string) => Promise<string>,
): Promise<CryptoKey> {
  const sig = await sign(SIGN_MSG);
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sig),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: KDF_SALT, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptFile(buf: ArrayBuffer, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buf);
  return {
    ciphertext: ct,
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };
}

async function decryptFile(ct: ArrayBuffer, ivHex: string, key: CryptoKey) {
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
}

async function sha256Hex(buf: ArrayBuffer): Promise<`0x${string}`> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return `0x${Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function shardBuffer(buf: ArrayBuffer): [Blob, Blob, Blob] {
  const b = new Uint8Array(buf);
  const s = Math.ceil(b.length / 3);
  return [
    new Blob([b.slice(0, s)]),
    new Blob([b.slice(s, s * 2)]),
    new Blob([b.slice(s * 2)]),
  ];
}

function reassemble(shards: ArrayBuffer[]): ArrayBuffer {
  const total = shards.reduce((a, s) => a + s.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const s of shards) {
    out.set(new Uint8Array(s), off);
    off += s.byteLength;
  }
  return out.buffer;
}

async function uploadShard(
  shard: Blob,
  name: string,
  idx: number,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", shard, `${name}.shard${idx}`);
  fd.append("pinataMetadata", JSON.stringify({ name: `${name}-s${idx}` }));
  const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}` },
    body: fd,
  });
  if (!r.ok) throw new Error(`Pinata shard ${idx} failed`);
  return (await r.json()).IpfsHash as string;
}

async function fetchShard(cid: string): Promise<ArrayBuffer> {
  const gw =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
  const r = await fetch(`${gw}/ipfs/${cid}`);
  if (!r.ok) throw new Error(`Failed to fetch shard ${cid}`);
  return r.arrayBuffer();
}

function formatBytes(n: number): string {
  if (n === 0) return "0 B";
  const k = 1024,
    s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function fileIcon(ext: string): string {
  const m: Record<string, string> = {
    pdf: "📄",
    png: "🖼",
    jpg: "🖼",
    jpeg: "🖼",
    mp4: "🎬",
    mp3: "🎵",
    docx: "📝",
    xlsx: "📊",
    zip: "📦",
    sol: "💻",
  };
  return m[ext.toLowerCase()] ?? "📁";
}

// ── Types ──────────────────────────────────────────────────────────────────
type Stage =
  | "idle"
  | "hashing"
  | "encrypting"
  | "sharding"
  | "uploading"
  | "confirming"
  | "done"
  | "error";
const STAGE_LABEL: Record<Stage, string> = {
  idle: "Déposer un fichier ici ou cliquer pour parcourir",
  hashing: "Calcul du hash SHA-256…",
  encrypting: "Chiffrement AES-256-GCM…",
  sharding: "Division en 3 fragments…",
  uploading: "Upload vers IPFS…",
  confirming: "Enregistrement sur la blockchain…",
  done: "Fichier sécurisé ✓",
  error: "Échec — cliquer pour réessayer",
};
const PIPE_STEPS: Stage[] = [
  "hashing",
  "encrypting",
  "sharding",
  "uploading",
  "confirming",
];

interface VaultFile {
  ipfsHashes: [string, string, string];
  fileName: string;
  fileExtension: string;
  fileSize: bigint;
  timestamp: bigint;
  encryptionIv: string;
  fileHash: `0x${string}`;
  version: bigint;
  exists: boolean;
  index: number;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function VaultPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [dlIdx, setDlIdx] = useState<number | null>(null);
  const [dlStage, setDlStage] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<CryptoKey | null>(null);

  // ── Read files ─────────────────────────────────────────────────────────
  const { data: rawFiles = [], isLoading } = useQuery({
    queryKey: ["vault-files", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!address || !publicClient) return [];
      const res = await publicClient.readContract({
        address: FILE_STORAGE_ADDRESS,
        abi: FILE_STORAGE_ABI,
        functionName: "getUserFiles",
        account: address,
      });
      return (res as VaultFile[]).map((f, i) => ({ ...f, index: i }));
    },
  });
  const files = rawFiles as VaultFile[];

  const { data: remaining } = useQuery({
    queryKey: ["vault-storage", address],
    enabled: !!address && !!publicClient,
    queryFn: async () => {
      if (!address || !publicClient) return BigInt(1024 * 1024 * 1024);
      return publicClient.readContract({
        address: FILE_STORAGE_ADDRESS,
        abi: FILE_STORAGE_ABI,
        functionName: "getRemainingStorage",
        account: address,
      }) as Promise<bigint>;
    },
  });

  // ── Key ────────────────────────────────────────────────────────────────
  const getKey = useCallback(async () => {
    if (keyRef.current) return keyRef.current;
    if (!address) throw new Error("Portefeuille non connecté");
    const key = await deriveKey(address, (msg) =>
      signMessageAsync({ message: msg }),
    );
    keyRef.current = key;
    return key;
  }, [address, signMessageAsync]);

  // ── Upload ─────────────────────────────────────────────────────────────
  const upload = useCallback(
    async (file: File) => {
      setError("");
      setProgress(0);
      try {
        const buf = await file.arrayBuffer();
        const ext = file.name.split(".").pop() ?? "";

        setStage("hashing");
        const hash = await sha256Hex(buf);
        setProgress(15);

        const key = await getKey();
        setProgress(25);

        setStage("encrypting");
        const { ciphertext, iv } = await encryptFile(buf, key);
        setProgress(40);

        setStage("sharding");
        const shards = shardBuffer(ciphertext);
        setProgress(50);

        setStage("uploading");
        const [c0, c1, c2] = await Promise.all([
          uploadShard(shards[0], file.name, 0),
          uploadShard(shards[1], file.name, 1),
          uploadShard(shards[2], file.name, 2),
        ]);
        setProgress(80);

        setStage("confirming");
        const txHash = await writeContractAsync({
          address: FILE_STORAGE_ADDRESS,
          abi: FILE_STORAGE_ABI,
          functionName: "uploadFile",
          args: [[c0, c1, c2], file.name, ext, BigInt(file.size), iv, hash],
        });
        await publicClient!.waitForTransactionReceipt({ hash: txHash });
        setProgress(100);
        setStage("done");
        queryClient.invalidateQueries({ queryKey: ["vault-files"] });
        queryClient.invalidateQueries({ queryKey: ["vault-storage"] });
        setTimeout(() => setStage("idle"), 2000);
      } catch (e: unknown) {
        setStage("error");
        setError(
          e instanceof Error ? e.message.split("\n")[0] : "Échec upload",
        );
      }
    },
    [getKey, writeContractAsync, publicClient, queryClient],
  );

  // ── Download ───────────────────────────────────────────────────────────
  const download = useCallback(
    async (f: VaultFile) => {
      setDlIdx(f.index);
      setDlStage("Récupération des fragments…");
      try {
        const [s0, s1, s2] = await Promise.all([
          fetchShard(f.ipfsHashes[0]),
          fetchShard(f.ipfsHashes[1]),
          fetchShard(f.ipfsHashes[2]),
        ]);
        setDlStage("Assemblage…");
        const ct = reassemble([s0, s1, s2]);
        setDlStage("Déchiffrement…");
        const key = await getKey();
        const dec = await decryptFile(ct, f.encryptionIv, key);
        setDlStage("Vérification…");
        const computed = await sha256Hex(dec);
        if (computed.toLowerCase() !== f.fileHash.toLowerCase())
          throw new Error("Hash mismatch — fichier corrompu");
        const url = URL.createObjectURL(new Blob([dec]));
        const a = document.createElement("a");
        a.href = url;
        a.download = f.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Échec téléchargement");
      } finally {
        setDlIdx(null);
        setDlStage("");
      }
    },
    [getKey],
  );

  // ── Delete ─────────────────────────────────────────────────────────────
  const deleteFile = useCallback(
    async (index: number) => {
      const tx = await writeContractAsync({
        address: FILE_STORAGE_ADDRESS,
        abi: FILE_STORAGE_ABI,
        functionName: "deleteFile",
        args: [BigInt(index)],
      });
      await publicClient!.waitForTransactionReceipt({ hash: tx });
      queryClient.invalidateQueries({ queryKey: ["vault-files"] });
      queryClient.invalidateQueries({ queryKey: ["vault-storage"] });
    },
    [writeContractAsync, publicClient, queryClient],
  );

  // ── Rename ─────────────────────────────────────────────────────────────
  const doRename = useCallback(async () => {
    if (renaming === null || !newName.trim()) return;
    const tx = await writeContractAsync({
      address: FILE_STORAGE_ADDRESS,
      abi: FILE_STORAGE_ABI,
      functionName: "renameFile",
      args: [BigInt(renaming), newName.trim()],
    });
    await publicClient!.waitForTransactionReceipt({ hash: tx });
    setRenaming(null);
    setNewName("");
    queryClient.invalidateQueries({ queryKey: ["vault-files"] });
  }, [renaming, newName, writeContractAsync, publicClient, queryClient]);

  const isUploading = !["idle", "done", "error"].includes(stage);
  const activeStep = PIPE_STEPS.indexOf(stage);
  const usedBytes =
    1024 * 1024 * 1024 - Number(remaining ?? BigInt(1024 * 1024 * 1024));
  const usedPct = Math.min((usedBytes / (1024 * 1024 * 1024)) * 100, 100);

  if (!address)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-mono text-[12px] text-t2">
          Connectez votre portefeuille pour accéder au coffre.
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="font-mono text-[10px] text-gold tracking-widest mb-1">
          // COFFRE CHIFFRÉ
        </p>
        <h1 className="font-serif text-3xl font-bold text-t1">
          Coffre de Documents
        </h1>
        <p className="font-mono text-[11px] text-t2 mt-2">
          Stockage chiffré E2E · 3 fragments IPFS · Hash d'intégrité on-chain
        </p>
      </div>

      {/* Storage bar */}
      <div className="bg-navy-2 border border-line rounded-panel p-4 animate-fade-up">
        <div className="flex justify-between mb-2">
          <div className="grid grid-cols-4 gap-6">
            {[
              { l: "UTILISÉ", v: formatBytes(usedBytes) },
              { l: "FICHIERS", v: files.length.toString() },
              { l: "LIBRE", v: formatBytes(Number(remaining ?? 0)) },
              { l: "QUOTA", v: "1 GB" },
            ].map(({ l, v }) => (
              <div key={l}>
                <p className="font-mono text-[9px] text-t3 tracking-widest">
                  {l}
                </p>
                <p className="font-mono text-[13px] font-medium text-t1">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-1.5 bg-navy-4 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold
                          transition-all duration-700"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col gap-3 animate-fade-up">
        <div
          className={[
            "relative flex flex-col items-center justify-center min-h-[152px] rounded-panel border-2",
            "transition-all duration-200",
            dragging
              ? "border-gold bg-gold-dim scale-[1.01]"
              : stage === "done"
                ? "border-status-green/50 bg-status-green-d cursor-default"
                : stage === "error"
                  ? "border-red-500/40 bg-red-500/5 cursor-pointer"
                  : isUploading
                    ? "border-gold/60 border-solid cursor-default"
                    : "border-dashed border-line-2 bg-navy-2/60 hover:border-gold/50 hover:bg-gold-dim cursor-pointer",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) upload(f);
          }}
          onClick={() => !isUploading && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
            disabled={isUploading}
          />

          {!isUploading && stage === "idle" && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div
                className="w-12 h-12 rounded-panel bg-gold-dim border border-line-2
                              flex items-center justify-center text-gold"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-t1">
                Déposer un fichier ou cliquer
              </p>
              <p className="font-mono text-[10px] text-t3">
                Max 100 MB · Tous formats · AES-256-GCM
              </p>
            </div>
          )}
          {isUploading && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full border-2 border-navy-4 border-t-gold animate-spin" />
              <p className="font-mono text-[11px] text-gold">
                {STAGE_LABEL[stage]}
              </p>
            </div>
          )}
          {stage === "done" && (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <span className="text-3xl">✅</span>
              <p className="font-mono text-[11px] text-status-green">
                Fichier sécurisé on-chain
              </p>
            </div>
          )}
          {stage === "error" && (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <span className="text-3xl">❌</span>
              <p className="font-mono text-[11px] text-red-400">
                Échec — cliquer pour réessayer
              </p>
            </div>
          )}
        </div>

        {/* Pipeline */}
        {isUploading && (
          <div className="flex items-center animate-fade-in">
            {PIPE_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={[
                      "w-2 h-2 rounded-full border transition-all",
                      i < activeStep
                        ? "bg-gold border-gold"
                        : i === activeStep
                          ? "bg-transparent border-gold shadow-[0_0_0_3px_rgba(201,168,76,0.2)]"
                          : "bg-transparent border-navy-4",
                    ].join(" ")}
                  />
                  <span
                    className={`font-mono text-[8px] ${i === activeStep ? "text-gold" : "text-t3"}`}
                  >
                    {s.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                {i < PIPE_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mb-4 ${i < activeStep ? "bg-gold" : "bg-line"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {isUploading && (
          <div className="h-[3px] bg-navy-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold/70 to-gold rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-btn px-4 py-3">
          <p className="font-mono text-[11px] text-red-400">✕ {error}</p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="font-mono text-[10px] text-t3 tracking-widest">
          FICHIERS STOCKÉS
        </span>
        <div className="flex-1 h-px bg-line" />
      </div>

      {/* File list */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-panel skeleton" />
          ))}
        </div>
      ) : files.filter((f) => f.exists).length === 0 ? (
        <div className="text-center py-14 animate-fade-in">
          <p className="font-mono text-[12px] text-t2">
            Votre coffre est vide.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {files
            .filter((f) => f.exists)
            .map((f, i) => (
              <div
                key={f.index}
                className="relative bg-navy-2 border border-line rounded-panel p-4
                         hover:border-line-2 transition-all flex items-start
                         sm:items-center gap-3 flex-col sm:flex-row animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-card bg-navy-3 border border-line
                                flex items-center justify-center text-xl"
                  >
                    {fileIcon(f.fileExtension)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1.5 bg-gold text-navy text-[7px]
                                 font-bold px-1 py-px rounded border border-navy-2 uppercase"
                  >
                    {f.fileExtension || "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {renaming === f.index ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") doRename();
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        className="flex-1 bg-navy-3 border border-gold rounded-btn px-2.5 py-1
                                 font-mono text-[12px] text-t1 outline-none"
                      />
                      <button
                        onClick={doRename}
                        className="w-7 h-7 rounded-btn bg-status-green-d text-green-400
                                 text-sm flex items-center justify-center"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setRenaming(null)}
                        className="w-7 h-7 rounded-btn bg-red-500/10 text-red-400
                                 text-sm flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="font-semibold text-[13px] text-t1 truncate">
                      {f.fileName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      formatBytes(Number(f.fileSize)),
                      new Date(Number(f.timestamp) * 1000).toLocaleDateString(
                        "fr-DZ",
                      ),
                      `v${Number(f.version)}`,
                    ].map((v, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] text-t3 flex items-center gap-1.5"
                      >
                        {v}
                        {i < 2 && (
                          <span className="w-1 h-1 rounded-full bg-t3/40" />
                        )}
                      </span>
                    ))}
                    <span
                      className="font-mono text-[9px] text-gold bg-gold-dim border border-line
                                   px-1.5 py-px rounded"
                    >
                      🔐 E2E
                    </span>
                  </div>
                  <div className="hidden sm:flex gap-1.5">
                    {f.ipfsHashes.map((cid, i) => (
                      <span
                        key={i}
                        className="font-mono text-[9px] text-t3 bg-navy-3 border
                                             border-line rounded px-1.5 py-0.5 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                        {cid.slice(0, 8)}…
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => download(f)}
                    disabled={dlIdx !== null}
                    title="Télécharger et déchiffrer"
                    className="w-9 h-9 rounded-card border border-line bg-navy-3 text-t2
                             flex items-center justify-center hover:border-gold hover:text-gold
                             disabled:opacity-40 transition-all"
                  >
                    {dlIdx === f.index ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-navy-4 border-t-gold animate-spin" />
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRenaming(f.index);
                      setNewName(f.fileName);
                    }}
                    className="w-9 h-9 rounded-card border border-line bg-navy-3 text-t2
                             flex items-center justify-center hover:border-line-2 hover:text-t1
                             transition-all text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteFile(f.index)}
                    className="w-9 h-9 rounded-card border border-line bg-navy-3 text-t2
                             flex items-center justify-center hover:border-red-500/40 hover:text-red-400
                             transition-all text-sm"
                  >
                    🗑
                  </button>
                </div>

                {/* Download overlay */}
                {dlIdx === f.index && (
                  <div
                    className="absolute inset-0 bg-navy/70 backdrop-blur-sm rounded-panel
                                flex items-center justify-center animate-fade-in"
                  >
                    <p className="font-mono text-[11px] text-gold animate-pulse">
                      {dlStage}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
