"use client";
import { type ReactNode, useState, useEffect, useMemo } from "react";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { WagmiProvider } from "wagmi";

import { UserAccountProvider } from "@/context/UserAccountContext";
import { wagmiConfig } from "@/wagmi";

import { BlockProvider } from "../context/BlockContext";

const MoonPayProvider = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayProvider),
  { ssr: false },
);
export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const queryClient = useMemo(() => new QueryClient(), []);

  const appInfo = {
    appName: "Next-Web3-Boilerplate",
  };
  console.log("Env Project ID:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
  const moonpay_api_key = process.env.NEXT_PUBLIC_MOONPAY_API_KEY ?? "";
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo} coolMode modalSize="compact">
          <MoonPayProvider apiKey={moonpay_api_key} debug={true}>
            
            <BlockProvider>
              <UserAccountProvider>{mounted && children}</UserAccountProvider>
            </BlockProvider>
          </MoonPayProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
