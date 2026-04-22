"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagami";

/**
 * The Providers component wraps the entire application.
 * It provides:
 * 1. WagmiProvider: Manages the blockchain connection state.
 * 2. QueryClientProvider: Manages the data fetching state (async states).
 */
export function Providers({ children }: { children: ReactNode }) {
  // We use useState to initialize the QueryClient.
  // This ensures the client is created only once during the component's lifecycle.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Since blockchain data doesn't change every millisecond,
            // we can set a staleTime to reduce unnecessary re-fetches.
            staleTime: 5000,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
