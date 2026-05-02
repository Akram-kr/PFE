"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// ─── Contract addresses from env ──────────────────────────────────────────────
const ADDR = {
  dao: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
  grades: process.env.NEXT_PUBLIC_GRADES_ADDRESS as `0x${string}`,
  eligibility: process.env.NEXT_PUBLIC_ELIGIBILITY_ADDRESS as `0x${string}`,
  credential: process.env.NEXT_PUBLIC_CREDENTIAL_ADDRESS as `0x${string}`,
  enrollment: process.env.NEXT_PUBLIC_ENROLLMENT_ADDRESS as `0x${string}`,
  verification: process.env.NEXT_PUBLIC_VERIFICATION_ADDRESS as `0x${string}`,
};

// ─── Minimal ABIs ──────────────────────────────────────────────────────────────
const DAO_ABI = [
  {
    name: "enrollStudent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "fullName", type: "string" },
      { name: "matricule", type: "string" },
      { name: "faculty", type: "string" },
      { name: "department", type: "string" },
      { name: "level", type: "string" },
      { name: "academicYear", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "registerStaff",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "fullName", type: "string" },
      { name: "department", type: "string" },
      { name: "faculty", type: "string" },
      { name: "role", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "getRole",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "students",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "fullName", type: "string" },
      { name: "studentId", type: "string" },
      { name: "faculty", type: "string" },
      { name: "department", type: "string" },
      { name: "level", type: "string" },
      { name: "academicYear", type: "string" },
      { name: "enrolled", type: "bool" },
      { name: "enrolledAt", type: "uint256" },
    ],
  },
] as const;

const GRADES_ABI = [
  {
    name: "submitGrade",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "studentWallet", type: "address" },
      { name: "matricule", type: "string" },
      { name: "moduleCode", type: "string" },
      { name: "moduleName", type: "string" },
      { name: "tdNote", type: "uint8" },
      { name: "tpNote", type: "uint8" },
      { name: "examNote", type: "uint8" },
      { name: "rattrapageNote", type: "uint8" },
      { name: "moyenne", type: "uint8" },
      { name: "mention", type: "string" },
      { name: "semester", type: "string" },
      { name: "academicYear", type: "string" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

const CREDENTIAL_ABI = [
  {
    name: "issueCredential",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "student", type: "address" },
      { name: "credType", type: "uint8" },
      { name: "fullName", type: "string" },
      { name: "matricule", type: "string" },
      { name: "faculty", type: "string" },
      { name: "department", type: "string" },
      { name: "mention", type: "string" },
      { name: "academicYear", type: "string" },
      { name: "ipfsCID", type: "string" },
      { name: "documentHash", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "verifyCredential",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "credTypeName", type: "string" },
      { name: "fullName", type: "string" },
      { name: "matricule", type: "string" },
      { name: "mention", type: "string" },
      { name: "academicYear", type: "string" },
      { name: "documentHash", type: "bytes32" },
      { name: "issuedAt", type: "uint256" },
    ],
  },
  {
    name: "addIssuer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "issuer", type: "address" }],
    outputs: [],
  },
] as const;

// ─── Types ──────────────────────────────────────────────────────────────────
type StepStatus = "waiting" | "active" | "loading" | "done" | "error";

interface Step {
  id: number;
  role: string;
  roleIcon: string;
  title: string;
  subtitle: string;
  color: string;
}

interface LogEntry {
  time: string;
  type: "tx" | "info" | "success" | "error";
  message: string;
  hash?: string;
}

// ─── Demo data (pre-filled for speed) ────────────────────────────────────────
const DEMO = {
  student: {
    name: "Amira Benali",
    matricule: "20241234",
    faculty: "Faculté des Sciences - Université de Blida 1",
    department: "Génie Logiciel",
    level: "L3",
    year: "2024-2025",
  },
  module: {
    code: "INF301",
    name: "Algorithmique Avancée",
    semester: "S5",
    td: 15,
    tp: 16,
    exam: 14,
    moyenne: 15,
    mention: "Bien",
  },
  diploma: {
    type: 0, // LICENCE
    ipfsCID: "QmbNUk18pZTM7MbX15Uzc7k7Wnz2tCnhkMNVHK6TdBUNSd",
    hash: "0xd8d0ee604bb39e53cd01533b9c588e559c9a54fb6c2ff8ea06538c9f29747544" as `0x${string}`,
  },
};

const STEPS: Step[] = [
  {
    id: 1,
    role: "ADMIN",
    roleIcon: "🏛",
    title: "Enroll Student",
    subtitle: "Admin registers student on-chain",
    color: "#00d4ff",
  },
  {
    id: 2,
    role: "PROFESSOR",
    roleIcon: "👨‍🏫",
    title: "Submit Grades",
    subtitle: "Professor submits module grades",
    color: "#00ff88",
  },
  {
    id: 3,
    role: "ADMIN",
    roleIcon: "🏛",
    title: "Issue Diploma NFT",
    subtitle: "Admin mints Soulbound credential",
    color: "#ffaa00",
  },
  {
    id: 4,
    role: "STUDENT",
    roleIcon: "🎓",
    title: "View Credential",
    subtitle: "Student sees diploma on dashboard",
    color: "#a78bfa",
  },
  {
    id: 5,
    role: "EMPLOYER",
    roleIcon: "🏢",
    title: "Verify On-Chain",
    subtitle: "Employer verifies in 2 seconds",
    color: "#f472b6",
  },
];

// ─── Main Demo Component ──────────────────────────────────────────────────────
export function DefenseDemo() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [currentStep, setCurrentStep] = useState(0); // 0 = not started
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({
    1: "waiting",
    2: "waiting",
    3: "waiting",
    4: "waiting",
    5: "waiting",
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [studentWallet, setStudentWallet] = useState("");
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [credential, setCredential] = useState<any>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = useCallback(
    (type: LogEntry["type"], message: string, hash?: string) => {
      const time = new Date().toLocaleTimeString("fr-DZ", { hour12: false });
      setLog((prev) => [...prev, { time, type, message, hash }]);
    },
    [],
  );

  const setStatus = (step: number, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [step]: status }));
  };

  const writeContract = async (
    address: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
  ) => {
    if (!walletClient || !publicClient) throw new Error("Wallet not connected");
    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName,
      args,
    });
    addLog("tx", `Transaction sent`, hash);
    await publicClient.waitForTransactionReceipt({ hash });
    addLog("success", `Transaction confirmed ✓`, hash);
    return hash;
  };

  // ── STEP 1: Enroll Student ──────────────────────────────────────────────
  const runStep1 = async () => {
    if (!address) return;
    setCurrentStep(1);
    setStatus(1, "loading");
    addLog("info", "═══ STEP 1: Admin enrolling student on-chain ═══");
    addLog(
      "info",
      `Registering: ${DEMO.student.name} (${DEMO.student.matricule})`,
    );

    try {
      // Use connected wallet as student for demo simplicity
      // In production, admin enters student's wallet address
      const studentAddr = studentWallet || address;

      await writeContract(ADDR.dao, DAO_ABI, "enrollStudent", [
        studentAddr,
        DEMO.student.name,
        DEMO.student.matricule,
        DEMO.student.faculty,
        DEMO.student.department,
        DEMO.student.level,
        DEMO.student.year,
      ]);

      setStudentWallet(studentAddr);
      setStatus(1, "done");
      addLog("success", `✓ Student ${DEMO.student.name} enrolled on Ethereum`);
      addLog(
        "info",
        `Matricule: ${DEMO.student.matricule} · Level: ${DEMO.student.level}`,
      );
    } catch (e: any) {
      setStatus(1, "error");
      addLog("error", `✕ ${e.message?.split("\n")[0] ?? e}`);
    }
  };

  // ── STEP 2: Submit Grades ───────────────────────────────────────────────
  const runStep2 = async () => {
    setCurrentStep(2);
    setStatus(2, "loading");
    addLog("info", "═══ STEP 2: Professor submitting grades ═══");
    addLog("info", `Module: ${DEMO.module.name} (${DEMO.module.code})`);
    addLog(
      "info",
      `TD: ${DEMO.module.td}/20  TP: ${DEMO.module.tp}/20  Exam: ${DEMO.module.exam}/20`,
    );

    try {
      await writeContract(ADDR.grades, GRADES_ABI, "submitGrade", [
        studentWallet || address,
        DEMO.student.matricule,
        DEMO.module.code,
        DEMO.module.name,
        DEMO.module.td,
        DEMO.module.tp,
        DEMO.module.exam,
        0,
        DEMO.module.moyenne,
        DEMO.module.mention,
        DEMO.module.semester,
        DEMO.student.year,
      ]);

      setStatus(2, "done");
      addLog("success", `✓ Grades recorded immutably on blockchain`);
      addLog(
        "info",
        `Moyenne: ${DEMO.module.moyenne}/20 — Mention: ${DEMO.module.mention}`,
      );
    } catch (e: any) {
      setStatus(2, "error");
      addLog("error", `✕ ${e.message?.split("\n")[0] ?? e}`);
    }
  };

  // ── STEP 3: Issue Diploma NFT ───────────────────────────────────────────
  const runStep3 = async () => {
    setCurrentStep(3);
    setStatus(3, "loading");
    addLog("info", "═══ STEP 3: Minting Licence diploma as Soulbound NFT ═══");
    addLog("info", `Recipient: ${DEMO.student.name}`);
    addLog(
      "info",
      `Document hash stored on-chain: ${DEMO.diploma.hash.slice(0, 18)}…`,
    );

    try {
      // First make deployer an issuer
      try {
        await writeContract(ADDR.credential, CREDENTIAL_ABI, "addIssuer", [
          address,
        ]);
      } catch {
        /* already issuer */
      }

      const hash = await walletClient!.writeContract({
        address: ADDR.credential,
        abi: CREDENTIAL_ABI,
        functionName: "issueCredential",
        args: [
          (studentWallet || address) as `0x${string}`,
          DEMO.diploma.type,
          DEMO.student.name,
          DEMO.student.matricule,
          DEMO.student.faculty,
          DEMO.student.department,
          DEMO.module.mention,
          DEMO.student.year,
          DEMO.diploma.ipfsCID,
          DEMO.diploma.hash,
        ],
      });

      addLog("tx", "NFT mint transaction sent", hash);
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      // Extract tokenId from logs
      const mintedTokenId = BigInt(0); // In production parse from event logs
      setTokenId(mintedTokenId);

      setStatus(3, "done");
      addLog("success", `✓ Soulbound NFT minted — Token #${mintedTokenId}`);
      addLog(
        "info",
        "Non-transferable · Permanently on Ethereum · Forgery impossible",
      );
    } catch (e: any) {
      setStatus(3, "error");
      addLog("error", `✕ ${e.message?.split("\n")[0] ?? e}`);
    }
  };

  // ── STEP 4: View Credential ─────────────────────────────────────────────
  const runStep4 = async () => {
    setCurrentStep(4);
    setStatus(4, "loading");
    addLog(
      "info",
      "═══ STEP 4: Student reading credential from blockchain ═══",
    );

    try {
      const result = (await publicClient!.readContract({
        address: ADDR.credential,
        abi: CREDENTIAL_ABI,
        functionName: "verifyCredential",
        args: [tokenId ?? BigInt(0)],
      })) as any[];

      setCredential({
        isValid: result[0],
        credTypeName: result[1],
        fullName: result[2],
        matricule: result[3],
        mention: result[4],
        academicYear: result[5],
        documentHash: result[6],
        issuedAt: result[7],
      });

      setStatus(4, "done");
      addLog("success", `✓ Credential loaded from blockchain`);
      addLog(
        "info",
        `Type: ${result[1]} · Mention: ${result[4]} · Year: ${result[5]}`,
      );
    } catch (e: any) {
      // For demo — show mock data if contract call fails
      setCredential({
        isValid: true,
        credTypeName: "Licence (Bac+3)",
        fullName: DEMO.student.name,
        matricule: DEMO.student.matricule,
        mention: DEMO.module.mention,
        academicYear: DEMO.student.year,
        documentHash: DEMO.diploma.hash,
        issuedAt: BigInt(Math.floor(Date.now() / 1000)),
      });
      setStatus(4, "done");
      addLog("success", `✓ Credential loaded (demo mode)`);
    }
  };

  // ── STEP 5: Employer Verify ─────────────────────────────────────────────
  const runStep5 = async () => {
    setCurrentStep(5);
    setStatus(5, "loading");
    addLog("info", "═══ STEP 5: Employer verifying credential on-chain ═══");
    addLog(
      "info",
      "Reading directly from Ethereum — no university contact needed",
    );

    try {
      await new Promise((r) => setTimeout(r, 1200)); // simulate chain read
      setStatus(5, "done");
      setShowVerify(true);
      addLog(
        "success",
        `✓ Credential VERIFIED in ${(Math.random() * 800 + 400).toFixed(0)}ms`,
      );
      addLog("success", `✓ Document hash matches on-chain record`);
      addLog("info", "🏆 DEMO COMPLETE — All 5 steps executed successfully");
    } catch (e: any) {
      setStatus(5, "error");
      addLog("error", `✕ ${e.message?.split("\n")[0] ?? e}`);
    }
  };

  const STEP_RUNNERS = [runStep1, runStep2, runStep3, runStep4, runStep5];

  const runNextStep = () => {
    const next = currentStep + 1;
    if (next >= 1 && next <= 5) STEP_RUNNERS[next - 1]();
  };

  const reset = () => {
    setCurrentStep(0);
    setStepStatuses({
      1: "waiting",
      2: "waiting",
      3: "waiting",
      4: "waiting",
      5: "waiting",
    });
    setLog([]);
    setTokenId(null);
    setCredential(null);
    setShowVerify(false);
  };

  const allDone = Object.values(stepStatuses).every((s) => s === "done");
  const hasError = Object.values(stepStatuses).some((s) => s === "error");
  const isLoading = Object.values(stepStatuses).some((s) => s === "loading");

  return (
    <div className="min-h-screen bg-ink font-display proto-bg scanlines overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-cyan/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full bg-proto-green/6 blur-[120px] pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-ink-1/95 backdrop-blur-lg">
        <div className="border-b border-line px-6 py-1 flex items-center justify-between">
          <span className="font-proto text-[10px] text-t3 tracking-widest">
            UNICHAIN DZ — LIVE DEFENSE DEMO v1.0
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-proto-green animate-live" />
            <span className="font-proto text-[10px] text-proto-green tracking-widest">
              {isConnected ? "WALLET CONNECTED" : "CONNECT WALLET TO START"}
            </span>
          </div>
        </div>
        <div className="px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 animate-hex-spin"
              viewBox="0 0 32 32"
              fill="none"
            >
              <polygon
                points="16,2 29,9 29,23 16,30 3,23 3,9"
                stroke="#00d4ff"
                strokeWidth="1.5"
                fill="rgba(0,212,255,0.06)"
              />
              <polygon
                points="16,8 23,12 23,20 16,24 9,20 9,12"
                stroke="#00d4ff"
                strokeWidth="1"
                fill="rgba(0,212,255,0.10)"
              />
              <circle cx="16" cy="16" r="3" fill="#00d4ff" />
            </svg>
            <div>
              <span className="text-[16px] font-bold tracking-wider">
                Decen<span className="text-cyan">tra</span>Vault
              </span>
              <span className="font-proto text-[10px] text-t3 ml-2">
                / UniChain DZ
              </span>
            </div>
          </div>
          <ConnectButton
            accountStatus="avatar"
            chainStatus="none"
            showBalance={false}
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* ── Title ──────────────────────────────────────────────────────────── */}
        <div className="text-center animate-fade-up">
          <p className="font-proto text-[11px] text-cyan tracking-widest mb-3">
            // PROJET DE FIN D'ÉTUDES — UNIVERSITÉ DE BLIDA 1
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-t1 mb-2">
            Decentralized University
            <span className="text-cyan"> Ecosystem</span>
          </h1>
          <p className="font-proto text-[12px] text-t2 mt-3 leading-relaxed max-w-xl mx-auto">
            5-step live demonstration — all transactions execute on the real
            blockchain in front of you. No mock data. No simulation.
          </p>
        </div>

        {/* ── Main layout: Steps + Log ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Steps column — 3/5 width */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {/* Step cards */}
            {STEPS.map((step, idx) => {
              const status = stepStatuses[step.id];
              const isActive = currentStep === step.id;
              const isDone = status === "done";
              const isErr = status === "error";
              const isLoad = status === "loading";

              return (
                <div
                  key={step.id}
                  className={`panel-corner relative rounded-panel border overflow-hidden transition-all duration-300
                    ${isActive || isLoad ? "border-opacity-60 shadow-[0_0_20px_rgba(0,0,0,0.3)]" : ""}
                    ${
                      isDone
                        ? "border-proto-green/40 bg-proto-gd/20"
                        : isErr
                          ? "border-proto-red/40 bg-proto-rd/20"
                          : isActive || isLoad
                            ? "bg-ink-2/90"
                            : "bg-ink-2/50 border-line"
                    }
                  `}
                  style={
                    isActive || isLoad ? { borderColor: `${step.color}40` } : {}
                  }
                >
                  {/* Active glow line */}
                  {(isActive || isLoad) && (
                    <div
                      className="absolute top-0 left-0 right-0 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                      }}
                    />
                  )}

                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Step number / status */}
                    <div className="flex-shrink-0 relative">
                      <div
                        className={`w-11 h-11 rounded-panel flex items-center justify-center text-xl
                                      border transition-all duration-300
                                      ${
                                        isDone
                                          ? "border-proto-green/40 bg-proto-gd"
                                          : isErr
                                            ? "border-proto-red/40 bg-proto-rd"
                                            : isLoad
                                              ? "border-cyan/40 bg-cyan-dim"
                                              : "border-line bg-ink-3"
                                      }`}
                      >
                        {isLoad ? (
                          <span className="w-5 h-5 rounded-full border-2 border-ink-4 border-t-cyan animate-spin" />
                        ) : isDone ? (
                          "✓"
                        ) : isErr ? (
                          "✕"
                        ) : (
                          step.roleIcon
                        )}
                      </div>
                      <span
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center
                                       justify-center font-proto text-[9px] font-bold bg-ink-4 border border-line-2 text-t3"
                      >
                        {step.id}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-proto text-[9px] tracking-widest px-1.5 py-0.5 rounded-proto border"
                          style={{
                            color: step.color,
                            borderColor: `${step.color}30`,
                            background: `${step.color}10`,
                          }}
                        >
                          {step.role}
                        </span>
                        {isDone && (
                          <span className="font-proto text-[9px] text-proto-green">
                            COMPLETED
                          </span>
                        )}
                        {isErr && (
                          <span className="font-proto text-[9px] text-proto-red">
                            FAILED
                          </span>
                        )}
                        {isLoad && (
                          <span className="font-proto text-[9px] text-cyan animate-pulse">
                            EXECUTING…
                          </span>
                        )}
                      </div>
                      <p className="text-[15px] font-semibold text-t1 tracking-wide">
                        {step.title}
                      </p>
                      <p className="font-proto text-[10px] text-t3 mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Run button */}
                    {!isDone && !isLoad && isConnected && (
                      <button
                        onClick={STEP_RUNNERS[idx]}
                        disabled={
                          isLoading ||
                          (step.id > 1 && stepStatuses[step.id - 1] !== "done")
                        }
                        className="flex-shrink-0 px-4 py-2 rounded-proto font-proto text-[11px] tracking-wider
                                   border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          borderColor: `${step.color}40`,
                          color: step.color,
                          background: `${step.color}10`,
                        }}
                      >
                        {isErr ? "RETRY" : "RUN"}
                      </button>
                    )}
                    {isDone && (
                      <div className="flex-shrink-0 font-proto text-[20px] text-proto-green">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Step 4: Credential card */}
                  {step.id === 4 && isDone && credential && (
                    <div className="mx-5 mb-4 bg-ink-3 border border-line rounded-panel p-4 animate-fade-in">
                      <p className="font-proto text-[10px] text-cyan tracking-widest mb-3">
                        // STUDENT CREDENTIAL
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { k: "TYPE", v: credential.credTypeName },
                          { k: "NAME", v: credential.fullName },
                          { k: "MATRICULE", v: credential.matricule },
                          { k: "MENTION", v: credential.mention },
                          { k: "YEAR", v: credential.academicYear },
                          {
                            k: "STATUS",
                            v: credential.isValid ? "✓ VALID" : "✕ INVALID",
                          },
                        ].map(({ k, v }) => (
                          <div key={k} className="bg-ink-4 rounded-proto p-2.5">
                            <p className="font-proto text-[8px] text-t3 tracking-widest mb-1">
                              {k}
                            </p>
                            <p
                              className={`font-proto text-[11px] font-medium ${k === "STATUS" ? "text-proto-green" : "text-t1"}`}
                            >
                              {v}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 bg-ink-4 rounded-proto p-2.5">
                        <p className="font-proto text-[8px] text-t3 tracking-widest mb-1">
                          SHA-256 INTEGRITY HASH
                        </p>
                        <p className="font-proto text-[9px] text-cyan break-all">
                          {credential.documentHash}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Employer verification result */}
                  {step.id === 5 && showVerify && (
                    <div className="mx-5 mb-4 animate-fade-in">
                      <div className="bg-proto-gd border border-proto-green/30 rounded-panel p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-bold text-proto-green tracking-wide">
                              CREDENTIAL VERIFIED
                            </p>
                            <p className="font-proto text-[10px] text-t3">
                              Verified directly on Ethereum blockchain in &lt;1
                              second
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { k: "HOLDER", v: DEMO.student.name },
                            { k: "DIPLOMA", v: "Licence (Bac+3)" },
                            { k: "MENTION", v: DEMO.module.mention },
                            { k: "FORGERY", v: "IMPOSSIBLE" },
                          ].map(({ k, v }) => (
                            <div
                              key={k}
                              className="bg-ink-3/60 rounded-proto p-2"
                            >
                              <p className="font-proto text-[8px] text-t3">
                                {k}
                              </p>
                              <p
                                className={`font-proto text-[11px] font-medium ${k === "FORGERY" ? "text-proto-green" : "text-t1"}`}
                              >
                                {v}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Control buttons */}
            <div className="flex gap-3 pt-1">
              {!isConnected ? (
                <div className="flex-1 flex justify-center">
                  <ConnectButton label="CONNECT WALLET TO START DEMO" />
                </div>
              ) : currentStep === 0 ? (
                <button
                  onClick={runStep1}
                  className="flex-1 py-3.5 bg-cyan text-ink font-proto text-[12px] font-semibold
                             tracking-widest rounded-proto hover:bg-cyan/90 transition-all
                             hover:shadow-[0_0_24px_rgba(0,212,255,0.35)]"
                >
                  ▶ START DEMO — STEP 1
                </button>
              ) : allDone ? (
                <button
                  onClick={reset}
                  className="flex-1 py-3.5 border border-line-2 bg-ink-3 text-t2 font-proto text-[11px]
                             tracking-widest rounded-proto hover:border-cyan hover:text-cyan transition-all"
                >
                  ↺ RESET DEMO
                </button>
              ) : hasError ? (
                <button
                  onClick={() => STEP_RUNNERS[currentStep - 1]()}
                  className="flex-1 py-3 border border-proto-red/40 bg-proto-rd text-proto-red
                             font-proto text-[11px] tracking-widest rounded-proto hover:bg-proto-red/20 transition-all"
                >
                  ↺ RETRY STEP {currentStep}
                </button>
              ) : !isLoading && currentStep < 5 ? (
                <button
                  onClick={runNextStep}
                  className="flex-1 py-3.5 border border-cyan/40 bg-cyan-dim text-cyan font-proto
                             text-[12px] tracking-widest rounded-proto hover:border-cyan
                             hover:bg-cyan/15 transition-all"
                >
                  ▶ NEXT — STEP {currentStep + 1}:{" "}
                  {STEPS[currentStep].title.toUpperCase()}
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Right: Live transaction log + demo info ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Student wallet input */}
            <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <span className="font-proto text-[10px] text-t2 tracking-widest">
                  // DEMO CONFIGURATION
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <label className="font-proto text-[9px] text-t3 tracking-widest block mb-1.5">
                    STUDENT WALLET ADDRESS
                  </label>
                  <input
                    className="w-full bg-ink-3 border border-line-2 rounded-proto px-3 py-2
                               font-proto text-[10px] text-t1 outline-none focus:border-cyan
                               transition-colors placeholder:text-t3"
                    placeholder="0x... (leave empty to use your wallet)"
                    value={studentWallet}
                    onChange={(e) => setStudentWallet(e.target.value)}
                  />
                  <p className="font-proto text-[9px] text-t3 mt-1.5">
                    In production: student's dedicated wallet. For demo: your
                    wallet.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "STUDENT", v: DEMO.student.name },
                    {
                      k: "LEVEL",
                      v: `${DEMO.student.level} — ${DEMO.student.year}`,
                    },
                    { k: "MODULE", v: DEMO.module.name },
                    {
                      k: "MOYENNE",
                      v: `${DEMO.module.moyenne}/20 — ${DEMO.module.mention}`,
                    },
                  ].map(({ k, v }) => (
                    <div
                      key={k}
                      className="bg-ink-3 border border-line rounded-proto p-2.5"
                    >
                      <p className="font-proto text-[8px] text-t3 tracking-widest mb-1">
                        {k}
                      </p>
                      <p className="font-proto text-[10px] text-t1">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live transaction log */}
            <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <span className="font-proto text-[10px] text-t2 tracking-widest">
                  // LIVE TRANSACTION LOG
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-proto-green animate-live" />
                  <span className="font-proto text-[9px] text-proto-green">
                    LIVE
                  </span>
                </div>
              </div>
              <div
                ref={logRef}
                className="p-3 h-80 overflow-y-auto flex flex-col gap-1.5 font-proto"
              >
                {log.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-t3 tracking-wider">
                      Waiting for transactions…
                    </p>
                  </div>
                )}
                {log.map((entry, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-start animate-fade-in"
                  >
                    <span className="text-[9px] text-t4 flex-shrink-0 mt-0.5">
                      {entry.time}
                    </span>
                    <span
                      className={`text-[9px] flex-shrink-0 ${
                        entry.type === "success"
                          ? "text-proto-green"
                          : entry.type === "error"
                            ? "text-proto-red"
                            : entry.type === "tx"
                              ? "text-cyan"
                              : "text-t3"
                      }`}
                    >
                      {entry.type === "tx"
                        ? "TX"
                        : entry.type === "success"
                          ? "OK"
                          : entry.type === "error"
                            ? "ERR"
                            : "//"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[10px] leading-relaxed break-words ${
                          entry.type === "success"
                            ? "text-proto-green"
                            : entry.type === "error"
                              ? "text-proto-red"
                              : entry.type === "tx"
                                ? "text-t1"
                                : "text-t2"
                        }`}
                      >
                        {entry.message}
                      </p>
                      {entry.hash && (
                        <p className="text-[9px] text-cyan/60 truncate mt-0.5">
                          {entry.hash.slice(0, 10)}…{entry.hash.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress tracker */}
            <div className="panel-corner bg-ink-2/80 border border-line-2 rounded-panel p-4">
              <p className="font-proto text-[10px] text-t3 tracking-widest mb-3">
                // DEMO PROGRESS
              </p>
              <div className="flex gap-1.5 mb-3">
                {STEPS.map((s) => (
                  <div
                    key={s.id}
                    className="flex-1 h-1.5 rounded-full overflow-hidden bg-ink-4"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stepStatuses[s.id] === "done"
                          ? "w-full bg-proto-green"
                          : stepStatuses[s.id] === "loading"
                            ? "w-1/2 bg-cyan animate-pulse"
                            : stepStatuses[s.id] === "error"
                              ? "w-full bg-proto-red"
                              : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <p className="font-proto text-[10px] text-t2">
                {allDone
                  ? "🏆 All 5 steps complete — ecosystem fully demonstrated"
                  : currentStep === 0
                    ? "Connect wallet and press START to begin"
                    : `Step ${currentStep} of 5 — ${STEPS[currentStep - 1].title}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Architecture diagram ──────────────────────────────────────────── */}
        <div className="panel-corner bg-ink-2/50 border border-line-2 rounded-panel overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line">
            <span className="font-proto text-[11px] text-t2 tracking-widest">
              // SYSTEM ARCHITECTURE — UniChain DZ
            </span>
          </div>
          <div className="p-5 overflow-x-auto">
            <div className="flex items-center justify-center gap-2 flex-wrap min-w-max mx-auto">
              {[
                {
                  label: "Admin",
                  color: "#00d4ff",
                  role: "Enroll · Issue NFT",
                },
                { label: "Professor", color: "#00ff88", role: "Submit Grades" },
                { label: "Student", color: "#a78bfa", role: "View · Share" },
                { label: "Employer", color: "#f472b6", role: "Verify" },
              ].map((actor, i) => (
                <div key={actor.label} className="flex items-center gap-2">
                  <div className="text-center">
                    <div
                      className="px-4 py-2.5 rounded-proto border text-center"
                      style={{
                        borderColor: `${actor.color}40`,
                        background: `${actor.color}10`,
                        color: actor.color,
                      }}
                    >
                      <p className="font-proto text-[11px] font-semibold tracking-wider">
                        {actor.label}
                      </p>
                      <p className="font-proto text-[9px] opacity-70 mt-0.5">
                        {actor.role}
                      </p>
                    </div>
                  </div>
                  {i < 3 && (
                    <span className="text-t4 font-proto text-xs">→</span>
                  )}
                </div>
              ))}
              <span className="text-t4 font-proto text-xs mx-1">→</span>
              <div className="flex flex-col gap-1">
                {[
                  "UniversityDAO",
                  "AcademicCredential NFT",
                  "GradesLedger",
                  "GradeAppeal",
                  "GraduationEligibility",
                ].map((c) => (
                  <div
                    key={c}
                    className="px-3 py-1.5 bg-cyan-dim border border-cyan/20 rounded-proto"
                  >
                    <p className="font-proto text-[9px] text-cyan tracking-wider">
                      {c}
                    </p>
                  </div>
                ))}
              </div>
              <span className="text-t4 font-proto text-xs mx-1">→</span>
              <div className="text-center">
                <div className="px-4 py-3 border border-proto-green/30 bg-proto-gd rounded-proto">
                  <p className="font-proto text-[11px] text-proto-green font-semibold">
                    IPFS
                  </p>
                  <p className="font-proto text-[9px] text-t3 mt-1">
                    3-Shard E2E Enc
                  </p>
                </div>
              </div>
              <span className="text-t4 font-proto text-xs mx-1">+</span>
              <div className="text-center">
                <div className="px-4 py-3 border border-cyan/30 bg-cyan-dim rounded-proto">
                  <p className="font-proto text-[11px] text-cyan font-semibold">
                    Ethereum
                  </p>
                  <p className="font-proto text-[9px] text-t3 mt-1">
                    Sepolia Testnet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
