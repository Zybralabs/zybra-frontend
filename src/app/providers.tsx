"use client";
import { type ReactNode, useState, useEffect, useMemo } from "react";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { UserAccountProvider } from "@/context/UserAccountContext";
import { wagmiConfig } from "@/wagmi";

import { BlockProvider } from "../context/BlockContext";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const queryClient = useMemo(() => new QueryClient(), []);

  const appInfo = {
    appName: "Next-Web3-Boilerplate",
  };
  console.log("Env Project ID:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo} coolMode modalSize="compact">
          <BlockProvider>
            <UserAccountProvider>{mounted && children}</UserAccountProvider>
          </BlockProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
