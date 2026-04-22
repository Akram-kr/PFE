"use client";
import * as React from "react";
import { Connector, useConnect, useConnectors } from "wagmi";

export function WalletOptions() {
  const { connect } = useConnect();
  const connectors = useConnectors();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Select Provider
      </p>
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
    </div>
  );
  function WalletOption({
    connector,
    onClick,
  }: {
    connector: Connector;
    onClick: () => void;
  }) {
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      (async () => {
        const provider = await connector.getProvider();
        setReady(!!provider);
      })();
    }, [connector]);

    if (!ready) return null; // Hide the button if the wallet isn't installed
    return (
      <button
        onClick={onClick}
        className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-all text-sm font-bold uppercase tracking-tighter text-left"
      >
        {connector.name}
      </button>
    );
  }
}
