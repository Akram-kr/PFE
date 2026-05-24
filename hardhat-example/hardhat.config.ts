import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.25", // keep whatever version you are currently using
    settings: {
      viaIR: true, // <-- THIS IS THE MAGIC LINE
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
