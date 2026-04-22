"use client";

import {
  useReadContract,
  useAccount,
  useSignMessage,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FileText, Unlock, Loader2 } from "lucide-react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/constants/index";
import { deriveEncryptionKey, decryptFile } from "@/utils/encryption";
import { useState } from "react";

interface FileRecord {
  fileName: string;
  fileSize: bigint;
  exts: string;
  ipfsHash: string[];
  timestamp: bigint;
  encryptionIv: string; // Added to match your updated Solidity struct
}

export default function FileList() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);

  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserFiles",
    account: address,
  });

  const files = data as FileRecord[] | undefined;

  // --- THE DECRYPTION CORE ---
  const handleDownloadAndDecrypt = async (file: FileRecord, index: number) => {
    try {
      setDecryptingIndex(index);

      // 1. Re-generate the Key
      const signature = await signMessageAsync({
        message: "Authorize Secure File Vault Encryption",
      });
      const key = await deriveEncryptionKey(signature);

      // 2. FETCH ALL SHARDS
      // file.ipfsHashes is now an array from your updated contract
      const shardPromises = file.ipfsHash.map(async (hash) => {
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
        if (!res.ok) throw new Error(`Failed to fetch shard: ${hash}`);
        return await res.arrayBuffer();
      });

      const shardBuffers = await Promise.all(shardPromises);

      // 3. REASSEMBLE (Merge the Buffers)
      // We calculate the total size first
      const totalLength = shardBuffers.reduce(
        (acc, buf) => acc + buf.byteLength,
        0,
      );
      const combinedBuffer = new Uint8Array(totalLength);

      // We copy each shard into the combined array in order
      let offset = 0;
      for (const buf of shardBuffers) {
        combinedBuffer.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
      }

      // 4. DECRYPT THE COMBINED DATA
      const decryptedBuffer = await decryptFile(
        combinedBuffer.buffer, // Use the .buffer property
        key,
        file.encryptionIv,
      );

      // 5. TRIGGER DOWNLOAD
      const blob = new Blob([decryptedBuffer]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.fileName);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Reassembly/Decryption failed", error);
      alert("Failed to reconstruct file. Please check your connection.");
    } finally {
      setDecryptingIndex(null);
    }
  };
  //  deletion of the file from the blockchain and ipfs
  const { writeContractAsync: deleteContractFile } = useWriteContract();

  const handleDelete = async (index: number) => {
    if (
      !confirm("Are you sure you want to delete this file from the blockchain?")
    )
      return;

    try {
      // We send the index of the file in the user's array
      await deleteContractFile({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "deleteFile",
        args: [BigInt(index)],
      });

      alert("File record deleted from Blockchain!");
      // Note: To remove from Pinata as well, you would need a backend
      // or a Pinata Unpin API call here using the file.ipfsHash
    } catch (error) {
      console.error("Deletion failed:", error);
    }
  };
  if (!isConnected) return null;

  return (
    <div className="mt-20 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-1 bg-black"></div>
        <h3 className="text-xs font-bold uppercase tracking-widest">
          Your Decentralized Vault
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-gray-100 animate-pulse border border-black/10"
            />
          ))}
        </div>
      ) : (
        <div className="border-2 border-black overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] tracking-widest">
                <th className="p-4">Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {files &&
                files.map((file, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <FileText size={16} />
                      <span className="font-bold truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {(Number(file.fileSize) / 1024).toFixed(2)} KB
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 border border-black rounded-full uppercase">
                        {file.exts || "file"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadAndDecrypt(file, index)}
                        disabled={decryptingIndex !== null}
                        className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] uppercase font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400"
                      >
                        {decryptingIndex === index ? (
                          <>
                            Decrypting...{" "}
                            <Loader2 size={10} className="animate-spin" />
                          </>
                        ) : (
                          <>
                            Unlock & Download <Unlock size={10} />
                          </>
                        )}
                      </button>
                      {/* delete button */}
                      <button
                        onClick={() => handleDelete(index)}
                        className="border border-black p-1 hover:bg-black hover:text-white transition-all"
                        title="Delete File"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {(!files || files.length === 0) && (
            <div className="p-10 text-center text-gray-400 uppercase text-xs tracking-widest">
              No files detected on-chain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
