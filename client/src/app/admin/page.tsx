"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  LayoutDashboard,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import { useRole } from "@/hooks/useRole"; // Importing your new hook
import { diplomaContract } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { ProposeBatchForm } from "@/components/admin/ProposeBatchForm";
import { BatchCard } from "@/components/admin/BatchCard";
import { ManageRoles } from "@/components/admin/ManageRoles";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/utils";
import { useReadContract } from "wagmi";

export default function AdminPage() {
  const { isConnected } = useAccount();
  const { role, allRoles, isAdmin, isLoading, address } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Still need these for global dashboard counts
  const { data: nextBatchId, refetch: refetchBatches } = useReadContract({
    ...diplomaContract,
    functionName: "nextBatchId",
  });

  const { data: nextTokenId, refetch: refetchTokens } = useReadContract({
    ...diplomaContract,
    functionName: "nextTokenId",
  });

  const totalBatches = nextBatchId ? Number(nextBatchId) : 0;
  const totalTokens = nextTokenId ? Number(nextTokenId) : 0;

  const handleRefresh = () => {
    refetchBatches();
    refetchTokens();
    setRefreshKey((k) => k + 1);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <LayoutDashboard className="h-16 w-16 text-blue-500" />
        <h1 className="text-2xl font-bold">Tableau de bord administratif</h1>
        <WalletButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p>Vérification de vos privilèges...</p>
      </div>
    );
  }

  if (role === "none" || role === "student") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h1 className="text-xl font-bold">Accès refusé</h1>
        <p>Ce compte ne possède pas de rôle administratif.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            Connecté en tant que : {role.toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" /> Actualiser
        </button>
      </div>

      {/* Admin Features (Visible only if isAdmin is true) */}
      {isAdmin && (
        <>
          <div className="card">
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="flex w-full justify-between font-semibold"
            >
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" /> Gérer les rôles
              </span>
              {showRoles ? "▲" : "▼"}
            </button>
            {showRoles && (
              <div className="mt-4 pt-4 border-t">
                <ManageRoles onDone={handleRefresh} />
              </div>
            )}
          </div>

          <div className="card">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex w-full justify-between font-semibold"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" /> Proposer un lot
              </span>
              {showForm ? "▲" : "▼"}
            </button>
            {showForm && (
              <div className="mt-4 pt-4 border-t">
                <ProposeBatchForm onSuccess={handleRefresh} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Batch List */}
      <div key={refreshKey}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase mb-4">
          Lots ({totalBatches})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: totalBatches }, (_, i) => BigInt(i))
            .reverse()
            .map((id) => (
              <BatchCard
                key={id.toString()}
                batchId={id}
                onUpdate={handleRefresh}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
