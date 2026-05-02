// ignition/modules/UniChainDZ.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UniChainDZ", (m) => {
  // ── 1. UniversityDAO ──────────────────────────────────────────────────
  const dao = m.contract("UniversityDAO", [
    {
      univName: "Université de Blida 1",
      univCode: "UDBB1",
    },
  ]);

  // ── 2. GradesLedger ──────────────────────────────────────────────────
  const gradesLedger = m.contract("GradesLedger", []);

  // ── 3. GraduationEligibility ─────────────────────────────────────────
  const eligibility = m.contract("GraduationEligibility", []);

  // ── 4. GradeAppeal (needs eligibility address) ────────────────────────
  const gradeAppeal = m.contract("GradeAppeal", [
    eligibility, // passes the contract — Ignition resolves address automatically
  ]);

  // ── 5. AcademicCredential (needs DAO address) ─────────────────────────
  const credential = m.contract("AcademicCredential", [dao]);

  // ── 6. EnrollmentRegistry ─────────────────────────────────────────────
  const enrollment = m.contract("EnrollmentRegistry", []);

  // ── 7. VerificationPortal (needs credential + grades addresses) ───────
  const verification = m.contract("VerificationPortal", [
    { credential: credential, gradesLedger: gradesLedger },
  ]);

  // ── 8. FileStorage (your original vault contract) ─────────────────────
  const fileStorage = m.contract("FileStorage", []);

  // Return all contracts so Ignition logs their addresses
  return {
    dao,
    gradesLedger,
    eligibility,
    gradeAppeal,
    credential,
    enrollment,
    verification,
    fileStorage,
  };
});
