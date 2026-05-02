import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import GradesModule from "./Grades.js";
import Certification from "./Certification.js";

export default buildModule("AppealsModule", (m) => {
  const { credential } = m.useModule(Certification);
  const { gradesLedger } = m.useModule(GradesModule);

  // VerificationPortal needs both to cross-reference data
  const verification = m.contract("VerificationPortal", [
    credential,
    gradesLedger,
  ]);

  // Deploy GradeAppeal and link it to the existing GradesLedger
  const gradeAppeal = m.contract("GradeAppeal", [gradesLedger]);

  return { gradeAppeal, verification };
});
