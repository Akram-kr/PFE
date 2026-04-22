import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FileStorageModule = buildModule("FileStorageModule", (m) => {
  const fileStorage = m.contract("FileStorage");

  return { fileStorage };
});

export default FileStorageModule;
