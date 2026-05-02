import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CoreModule from "./Core.js";

export default buildModule("CertificationModule", (m) => {
  const { dao } = m.useModule(CoreModule);

  const eligibility = m.contract("GraduationEligibility", []);
  const credential = m.contract("AcademicCredential", [dao]);

  return { eligibility, credential };
});
