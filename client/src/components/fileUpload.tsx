"use client";

import { useState } from "react";
import { useWriteContract, useAccount, useSignMessage } from "wagmi";
import { Upload, File, Loader2, CheckCircle2, Lock } from "lucide-react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/constants/index";
// Import the utilities we wrote
import { deriveEncryptionKey, encryptFile } from "@/utils/encryption";
import { shardBuffer } from "@/utils/sharding";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "encrypting" | "pinning" | "signing" | "success"
  >("idle");

  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage(); // Needed for the Key seed
  const { writeContractAsync } = useWriteContract();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const uploadProcess = async () => {
    if (!file || !isConnected) return;

    try {
      // PHASE 1: ENCRYPTION
      setStatus("encrypting");
      const signature = await signMessageAsync({
        message: "Authorize Secure File Vault Encryption",
      });
      const key = await deriveEncryptionKey(signature);
      const { encryptedData, iv } = await encryptFile(file, key);

      // PHASE 2: SHARDING
      // We split the encrypted data into 3 pieces
      const shards = shardBuffer(encryptedData, 3);
      setStatus("pinning");

      // PHASE 3: MULTI-UPLOAD TO IPFS
      const uploadPromises = shards.map(async (shard, index) => {
        const shardBlob = new Blob([shard]);
        const formData = new FormData();
        // We label the shards (e.g., "myfile.png.part0")
        formData.append("file", shardBlob, `${file.name}.part${index}`);

        const res = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: formData,
          },
        );

        const data = await res.json();
        return data.IpfsHash as string;
      });

      // Wait for all 3 shards to finish uploading
      const ipfsHashes = await Promise.all(uploadPromises);

      // PHASE 4: BLOCKCHAIN
      setStatus("signing");
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "uploadFile",
        args: [
          ipfsHashes, // This is now our array: ["hash1", "hash2", "hash3"]
          file.name,
          file.name.split(".").pop() || "unknown",
          BigInt(file.size),
          iv,
        ],
      });

      setStatus("success");
    } catch (error) {
      console.error("Sharded upload failed", error);
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {/* MONOCHROME UI UI remains similar, but we add visual feedback for the lock */}
      <div className="border-2 border-dashed border-black p-12 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative">
        <input
          type="file"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {!file ? (
          <>
            <Upload className="w-12 h-12 mb-4 text-black" />
            <p className="font-mono text-sm uppercase tracking-tighter text-center">
              Click or drag to select file <br />
              <span className="text-[10px] text-gray-400 mt-2 block">
                Files are encrypted locally before upload
              </span>
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-black" />
            <span className="font-mono font-bold text-lg">{file.name}</span>
          </div>
        )}
      </div>

      <button
        onClick={uploadProcess}
        disabled={!file || status !== "idle"}
        className={`w-full mt-4 py-4 font-black uppercase tracking-widest border-2 border-black transition-all flex justify-center items-center gap-2
          ${status === "idle" ? "bg-black text-white hover:bg-white hover:text-black" : "bg-gray-200 text-gray-500 cursor-not-allowed"}
        `}
      >
        {status === "encrypting" && (
          <>
            <Loader2 className="animate-spin" /> Local Encryption...
          </>
        )}
        {status === "pinning" && (
          <>
            <Loader2 className="animate-spin" /> Uploading Scrambled Data...
          </>
        )}
        {status === "signing" && (
          <>
            <Loader2 className="animate-spin" /> Saving Metadata to Chain...
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 /> Encrypted & Stored
          </>
        )}
        {status === "idle" && "Push to Secure Vault"}
      </button>
    </div>
  );
}
