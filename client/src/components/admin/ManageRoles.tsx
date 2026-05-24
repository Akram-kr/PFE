"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { isAddress } from "viem";
import {
  UserPlus,
  UserMinus,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DIPLOMA_ABI } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";
import { DEAN_ROLE, RECTOR_ROLE, COUNCIL_ROLE } from "@/lib/contract";
import { cn } from "@/lib/utils";

type RoleAction =
  | "assignDean"
  | "assignRector"
  | "assignCouncil"
  | "removeDean"
  | "removeRector"
  | "removeCouncil";

interface RoleRowProps {
  label: string;
  roleHash: `0x${string}`;
  assignFn: RoleAction;
  removeFn: RoleAction;
  color: string;
  onDone: () => void;
}

function RoleRow({
  label,
  roleHash,
  assignFn,
  removeFn,
  color,
  onDone,
}: RoleRowProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const { writeContractAsync, isPending } = useWriteContract();

  const addressValid = isAddress(input);

  const { data: hasRoleData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DIPLOMA_ABI,
    functionName: "hasRole",
    args: [
      roleHash,
      addressValid
        ? (input as `0x${string}`)
        : "0x0000000000000000000000000000000000000000",
    ],
    query: { enabled: addressValid },
  });

  const alreadyHasRole = addressValid && hasRoleData === true;

  async function handle(fn: RoleAction) {
    if (!addressValid) return;
    setFeedback(null);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DIPLOMA_ABI,
        functionName: fn,
        args: [input as `0x${string}`],
      });
      setFeedback({
        ok: true,
        msg: fn.startsWith("assign")
          ? `${label} assigné avec succès.`
          : `${label} supprimé.`,
      });
      setInput("");
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ ok: false, msg: msg.slice(0, 120) });
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className={cn("h-4 w-4", color)} />
        <span className="font-semibold text-slate-800 text-sm">{label}</span>
        {alreadyHasRole && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
            Rôle actif
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="0x... adresse du wallet"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setFeedback(null);
          }}
          className={cn(
            "flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-mono outline-none transition",
            "focus:ring-2 focus:ring-uni-blue/30 focus:border-uni-blue",
            input && !addressValid ? "border-red-300" : "border-slate-200",
          )}
          disabled={isPending}
        />
      </div>

      {input && !addressValid && (
        <p className="text-xs text-red-500">Adresse invalide.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handle(assignFn)}
          disabled={!addressValid || isPending}
          className="flex items-center gap-1.5 rounded-lg bg-uni-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-uni-blue/90 transition"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Assigner
        </button>
        <button
          onClick={() => handle(removeFn)}
          disabled={!addressValid || isPending}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-40 hover:bg-red-100 transition"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserMinus className="h-3.5 w-3.5" />
          )}
          Retirer
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
            feedback.ok
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          )}
          <span className="break-all">{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}

export function ManageRoles({ onDone }: { onDone: () => void }) {
  const { address } = useAccount();

  if (!address) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Saisissez une adresse wallet, puis cliquez sur <strong>Assigner</strong>{" "}
        pour accorder le rôle ou <strong>Retirer</strong> pour le révoquer.
      </p>

      <RoleRow
        label="Doyen"
        roleHash={DEAN_ROLE}
        assignFn="assignDean"
        removeFn="removeDean"
        color="text-purple-600"
        onDone={onDone}
      />

      <RoleRow
        label="Recteur"
        roleHash={RECTOR_ROLE}
        assignFn="assignRector"
        removeFn="removeRector"
        color="text-amber-600"
        onDone={onDone}
      />

      <RoleRow
        label="Conseil (Council)"
        roleHash={COUNCIL_ROLE}
        assignFn="assignCouncil"
        removeFn="removeCouncil"
        color="text-indigo-600"
        onDone={onDone}
      />
    </div>
  );
}
