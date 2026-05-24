import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const wagmiConfig = createConfig({
  chains: [hardhat],
  connectors: [metaMask(), injected()],
  transports: {
    [hardhat.id]: http(rpcUrl),
  },
  ssr: true,
});

/** UniversityDiploma contract address */
export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

/** FileStorage contract address — optional, enables encrypted sharded uploads */
export const FILE_STORAGE_ADDRESS =
  (process.env.NEXT_PUBLIC_FILE_STORAGE_ADDRESS as `0x${string}` | undefined) ??
  undefined;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
