import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CoreModule", (m) => {
  const dao = m.contract("UniversityDAO", ["Université de Blida 1", "UDBB1"]);
  const enrollment = m.contract("EnrollmentRegistry", []);

  return { dao, enrollment };
});
