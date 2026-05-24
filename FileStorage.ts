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
  // ── 2. DiplomaNFT ─────────────────────────────────────────────────────
  const diplomaNFT = m.contract("DiplomaNFT", []);

  // ── 3. VerificationPortal ───────────────────────────────────────────
  const verificationPortal = m.contract("VerificationPortal", []);

  // ── 4. DiplomaMultiSig ──────────────────────────────────────────────

  const diplomaMultisig = m.contract("DiplomaMultiSig");
  // ── 5. FileStorage ──────────────────────────────────────────────────

  const FileStorage = m.contract("FileStorage", []);
  return {
    UniversityDAO: dao,
    DiplomaNFT: diplomaNFT,
    VerificationPortal: verificationPortal,
    DiplomaMultiSig: diplomaMultisig,
    FileStorage: FileStorage,
  };
});
