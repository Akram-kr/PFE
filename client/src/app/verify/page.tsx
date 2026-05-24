"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, QrCode, ShieldCheck } from "lucide-react";

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = tokenId.trim();
    if (id !== "") router.push(`/verify/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center space-y-8">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-uni-blue to-blue-600 text-white shadow-lg">
          <ShieldCheck className="h-10 w-10" />
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Vérification de diplôme
        </h1>
        <p className="mt-2 text-slate-500">
          Entrez un numéro de token NFT pour vérifier instantanément l
          authenticité d un diplôme de l Université de Blida 1.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="card">
        <label className="label text-left block mb-2">
          Numéro de token NFT ou matricule
        </label>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            type="text"
            placeholder="ex: 0, 1, 42, 2024-AB123…"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">
            <Search className="h-4 w-4" />
            Vérifier
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400 text-left">
          Entrez ici le token NFT ou le matricule de l étudiant.
        </p>
      </form>
      {/* QR hint */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 space-y-2">
        <QrCode className="mx-auto h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">
          Vous pouvez aussi scanner directement le QR code imprimé sur le
          diplôme — il redirige vers cette page avec le token pré-rempli.
        </p>
      </div>

      {/* How it works */}
      <div className="text-left card space-y-4">
        <h2 className="font-semibold text-slate-800">
          Comment ça fonctionne ?
        </h2>
        <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
          <li>
            Le numéro du token est lu depuis la blockchain Ethereum locale.
          </li>
          <li>
            Le CID IPFS et le hash SHA-256 du PDF sont récupérés du contrat
            intelligent.
          </li>
          <li>
            Les métadonnées (nom, spécialité, cycle…) sont chargées depuis IPFS.
          </li>
          <li>
            Un badge <strong className="text-green-700">Authentique</strong> ou{" "}
            <strong className="text-red-700">Non valide</strong> saffiche selon
            le résultat de la vérification.
          </li>
        </ol>
      </div>
    </div>
  );
}
