import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CoreModule from "./Core.js";

export default buildModule("GradesModule", (m) => {
  // Use the DAO and Enrollment from the Core module
  const { dao, enrollment } = m.useModule(CoreModule);

  const gradesLedger = m.contract("GradesLedger", []);

  // You can even set the registry address automatically
  m.call(gradesLedger, "setRegistry", [enrollment]);

  return { gradesLedger };
});
