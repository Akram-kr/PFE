"use client";

import { useAccount, useDisconnect } from "wagmi";
import { WalletOptions } from "./walletOptions";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs font-mono font-bold bg-black text-white px-2 py-1">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-[10px] uppercase underline hover:no-underline tracking-widest"
        >
          Disconnect
        </button>
      </div>
      //   <Connection />
    );
  }

  return <WalletOptions />;
}
