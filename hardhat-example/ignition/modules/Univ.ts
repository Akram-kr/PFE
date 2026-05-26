import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition module for UniversityDiploma.
 *
 * Constructor only requires the admin address.
 * Dean and Rector are assigned afterwards via assignDean() / assignRector()
 * from the admin dashboard (or directly via the contract).
 *
 * Override the default at deploy time:
 *   npx hardhat ignition deploy ignition/modules/Univ.ts --network localhost \
 *     --parameters '{"Univ":{"adminAddress":"0x…"}}'
 *
 * The default maps to Hardhat account #0.
 */
const Univ = buildModule("Univ", (m) => {
  const adminAddress = m.getParameter(
    "adminAddress",
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  );

  const universityDiploma = m.contract("UniversityDiploma", [adminAddress]);
  const FileStorage = m.contract("FileStorage", []);
  const deliberation = m.contract("PFEDeliberation", []);
  return { universityDiploma, FileStorage, deliberation };
});

export default Univ;
