"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  LayoutDashboard,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import { parseAbiItem } from "viem";
import { publicClient } from "@/lib/contract";
import { useRole } from "@/hooks/useRole";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { ProposeBatchFormAuto } from "@/components/admin/ProposeBatchFormAuto";
import { BatchCard } from "@/components/admin/BatchCard";
import { ManageRoles } from "@/components/admin/ManageRoles";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: {
    label: "Administrateur",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  dean: {
    label: "Doyen",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  rector: {
    label: "Recteur",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
};

const proposedEvent = parseAbiItem(
  "event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount)",
);
const finalizedEvent = parseAbiItem(
  "event BatchFinalized(uint256 indexed batchId, uint256 diplomasMinted)",
);

export default function AdminPage() {
  const { isConnected } = useAccount();
  const { role, isLoading, address } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [batchIds, setBatchIds] = useState<bigint[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [proposedLogs, finalizedLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: proposedEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: finalizedEvent,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
        ]);

        if (!mounted) {
          return;
        }

        const nextBatchIds = proposedLogs
          .map((log) => log.args.batchId)
          .filter((value): value is bigint => value !== undefined)
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

        const mintedTokens = finalizedLogs.reduce(
          (sum, log) => sum + Number(log.args.diplomasMinted ?? BigInt(0)),
          0,
        );

        setBatchIds(nextBatchIds);
        setTotalTokens(mintedTokens);
      } catch {
        if (mounted) {
          setBatchIds([]);
          setTotalTokens(0);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const isAdmin = role === "admin";
  const hasAnyRole = isAdmin || role === "dean" || role === "rector";
  const roles = hasAnyRole ? [role] : [];
  const totalBatches = batchIds.length;

  const handleRefresh = () => {
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 font-medium">
            Vérification des autorisations sur DiploChain...
          </p>
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
            Ce wallet ne possède aucun rôle valide (Admin, Doyen, Recteur,
            Conseil) sur le contrat.
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
              <span className="text-slate-400">rôle </span>
              {role}
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
              Gérer les rôles — Doyen &amp; Recteur
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
              <ProposeBatchFormAuto
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
