"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import {
  LayoutDashboard,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import {
  diplomaContract,
  ADMIN_ROLE,
  DEAN_ROLE,
  RECTOR_ROLE,
  COUNCIL_ROLE,
} from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DIPLOMA_ABI } from "@/lib/abi";
import { ProposeBatchForm } from "@/components/admin/ProposeBatchForm";
import { BatchCard } from "@/components/admin/BatchCard";
import { ManageRoles } from "@/components/admin/ManageRoles";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: {
    label: "Administrateur",
    color: "bg-blue-100   text-blue-800   border-blue-200",
  },
  council: {
    label: "Conseil",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  dean: {
    label: "Doyen",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  rector: {
    label: "Recteur",
    color: "bg-amber-100  text-amber-800  border-amber-200",
  },
};

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: isAdmin,
    isLoading: adminLoading,
    isError: adminError,
    error: adminErr,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: isDean } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [DEAN_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: isRector } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [RECTOR_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: isCouncil } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [COUNCIL_ROLE, address!],
    query: { enabled: !!address },
  });

  const { data: nextBatchId, refetch } = useReadContract({
    ...diplomaContract,
    functionName: "nextBatchId",
  });

  const { data: nextTokenId } = useReadContract({
    ...diplomaContract,
    functionName: "nextTokenId",
  });

  const roles = [
    isAdmin && "admin",
    isCouncil && "council",
    isDean && "dean",
    isRector && "rector",
  ].filter(Boolean) as string[];

  const hasAnyRole = roles.length > 0;
  const totalBatches = nextBatchId ? Number(nextBatchId) : 0;
  const totalTokens = nextTokenId ? Number(nextTokenId) : 0;
  const batchIds = Array.from({ length: totalBatches }, (_, i) => BigInt(i));

  const handleRefresh = () => {
    refetch();
    setRefreshKey((k) => k + 1);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-uni-blue">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            Tableau de bord administratif
          </h1>
          <p className="text-slate-500">
            Connectez votre wallet pour accéder au tableau de bord.
          </p>
        </div>
        <WalletButton />
      </div>
    );
  }

  if (adminLoading || (isAdmin === undefined && !adminError)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-uni-blue" />
        <p className="text-sm text-slate-500">Vérification du rôle en cours…</p>
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-xs font-mono text-slate-500 max-w-md w-full">
          <p>
            <span className="text-slate-400">wallet </span>
            {address}
          </p>
          <p>
            <span className="text-slate-400">contrat </span>
            {CONTRACT_ADDRESS}
          </p>
          <p>
            <span className="text-slate-400">rpc </span>
            {process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"}
          </p>
        </div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="max-w-md w-full text-left">
          <h1 className="mb-2 text-xl font-bold text-slate-800 text-center">
            Erreur RPC
          </h1>
          <p className="text-slate-500 text-sm text-center mb-3">
            La lecture du contrat a échoué. Vérifiez les points ci-dessous.
          </p>
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-xs font-mono text-red-700 space-y-1">
            <p>
              <span className="text-red-400">wallet </span>
              {address}
            </p>
            <p>
              <span className="text-red-400">contrat </span>
              {CONTRACT_ADDRESS}
            </p>
            <p>
              <span className="text-red-400">rpc </span>
              {process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"}
            </p>
            <p className="pt-1 border-t border-red-200 text-red-600 break-all">
              {String(adminErr)}
            </p>
          </div>
          <ul className="mt-4 space-y-1 text-xs text-slate-500 list-disc list-inside">
            <li>
              Le nœud Hardhat est-il démarré ? <code>npx hardhat node</code>
            </li>
            <li>Le contrat est-il déployé sur ce nœud ?</li>
            <li>
              <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code> dans{" "}
              <code>.env.local</code> est-il correct ?
            </li>
            <li>
              MetaMask est-il sur le réseau Hardhat Local (Chain ID 31337) ?
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (!hasAnyRole) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="max-w-md w-full">
          <h1 className="mb-2 text-xl font-bold text-slate-800">
            Accès non autorisé
          </h1>
          <p className="text-slate-500 text-sm">
            Ce wallet ne possède aucun rôle (Admin, Conseil, Doyen, Recteur) sur
            le contrat.
          </p>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs font-mono text-slate-500 space-y-1">
            <p>
              <span className="text-slate-400">wallet </span>
              {address}
            </p>
            <p>
              <span className="text-slate-400">contrat </span>
              {CONTRACT_ADDRESS}
            </p>
            <p>
              <span className="text-slate-400">isAdmin </span>
              {String(isAdmin)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les lots de diplômes — proposez, signez et frappez les NFTs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {roles.map((r) => (
            <span key={r} className={cn("badge border", ROLE_LABELS[r].color)}>
              {ROLE_LABELS[r].label}
            </span>
          ))}
          <button onClick={handleRefresh} className="btn-secondary text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lots totaux" value={totalBatches} />
        <StatCard label="Diplômes émis" value={totalTokens} />
        <StatCard
          label="Contrat"
          value={CONTRACT_ADDRESS.slice(0, 10) + "…"}
          mono
        />
      </div>

      {/* Manage roles (admin only) */}
      {isAdmin && (
        <div className="card">
          <button
            onClick={() => setShowRoles((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Users className="h-5 w-5 text-purple-500" />
              Gérer les rôles — Conseil, Doyen &amp; Recteur
            </div>
            <span className="text-xs text-slate-400">
              {showRoles ? "Fermer ▲" : "Ouvrir ▼"}
            </span>
          </button>
          {showRoles && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <ManageRoles onDone={handleRefresh} />
            </div>
          )}
        </div>
      )}

      {/* Propose batch (admin only) */}
      {isAdmin && (
        <div className="card">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Plus className="h-5 w-5 text-uni-blue" />
              Proposer un nouveau lot
            </div>
            <span className="text-xs text-slate-400">
              {showForm ? "Fermer ▲" : "Ouvrir ▼"}
            </span>
          </button>
          {showForm && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <ProposeBatchForm
                onSuccess={() => {
                  setShowForm(false);
                  handleRefresh();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Batch list */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Lots ({totalBatches})
        </h2>
        {totalBatches === 0 ? (
          <div className="card py-12 text-center text-slate-400">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin opacity-30" />
            <p className="text-sm">
              Aucun lot encore. Proposez le premier ci-dessus.
            </p>
          </div>
        ) : (
          <div key={refreshKey} className="grid gap-4 sm:grid-cols-2">
            {[...batchIds].reverse().map((id) => (
              <BatchCard
                key={id.toString()}
                batchId={id}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold text-slate-900",
          mono && "font-mono text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}
