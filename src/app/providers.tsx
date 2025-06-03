"use client";
import { type ReactNode, useState, useEffect, useMemo, type PropsWithChildren } from "react";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient as QClient, QueryClientProvider as QProvider } from "react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartAccountClientOptsSchema } from "@aa-sdk/core";
import { Provider } from "react-redux";
import { type SupportedAccountTypes } from "@account-kit/core";
import dynamic from "next/dynamic";
import { WagmiProvider } from "wagmi";
import {
  AlchemyAccountProvider,
  type AlchemyAccountsProviderProps,
  type AlchemyAccountsUIConfig,
} from "@account-kit/react";
import { ApolloProvider } from "@apollo/client";
import { UserAccountProvider } from "@/context/UserAccountContext";
import { wagmiConfig } from "@/wagmi";
import { z } from "zod";
import { BlockProvider } from "../context/BlockContext";
import { alchemy_config } from "@/config";
import { apolloClient } from "@/graphql/apollo";
import ApplicationUpdater from "@/state/application/updater";
import LogsUpdater from "@/state/logs/updater";
import TransactionUpdater from "@/state/transactions/updater";
import UserUpdater from "@/state/user/updater";
import { MulticallUpdater } from "@/lib/state/multicall";
import store from "@/state";
import { pinToApi } from "@/utils/pinToApi";
import { CentrifugeProvider } from "@centrifuge/centrifuge-react";
import type { UserProvidedConfig } from "@centrifuge/centrifuge-js";

const MoonPayProvider = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayProvider),
  { ssr: false },
);



const centConfig: UserProvidedConfig = {
  network: process.env.NEXT_PUBLIC_NETWORK as "altair" | "centrifuge",
  kusamaWsUrl: process.env.NEXT_PUBLIC_RELAY_WSS_URL as string,
  polkadotWsUrl: process.env.NEXT_PUBLIC_RELAY_WSS_URL as string,
  altairWsUrl: process.env.NEXT_PUBLIC_COLLATOR_WSS_URL as string,
  centrifugeWsUrl: "wss://fullnode.development.cntrfg.com",
  printExtrinsics: process.env.NODE_ENV === "development",
  centrifugeSubqueryUrl: process.env.NEXT_PUBLIC_SUBQUERY_URL as string,
  altairSubqueryUrl: process.env.NEXT_PUBLIC_SUBQUERY_URL as string,
  metadataHost: process.env.NEXT_PUBLIC_IPFS_GATEWAY as string,
  pinFile: (b64URI: string) =>
    pinToApi("pinFile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uri: b64URI }),
    }),
  pinJson: (json: unknown) =>
    pinToApi("pinJson", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json }),
    }),
};

function Updaters() {
  return (
    <>
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <LogsUpdater />
    </>
  );
}

export const Providers = ({
  initialState,
  children,
}: PropsWithChildren<{
  initialState?: AlchemyAccountsProviderProps["initialState"];
}>) => {
  const [mounted, setMounted] = useState(false);
  const queryClient = new QueryClient();
  const qClient = new QClient();
  useEffect(() => setMounted(true), []);

  const appInfo = {
    appName: "Zybra Finance",
  };
  const moonpay_api_key = process.env.NEXT_PUBLIC_MOONPAY_API_KEY ?? "";
  return (
    <Provider store={store}>

      <QueryClientProvider client={queryClient}>
      <QProvider client={qClient}>
        <WagmiProvider config={wagmiConfig}>
        <AlchemyAccountProvider
          config={alchemy_config}
          queryClient={queryClient}
          initialState={initialState}
          >
            <ApolloProvider client={apolloClient}>
              <CentrifugeProvider config={centConfig}>
                <RainbowKitProvider appInfo={appInfo} coolMode modalSize="compact">
                  <MoonPayProvider apiKey={moonpay_api_key} debug>
                    <BlockProvider>
                      <Updaters />
                      <UserAccountProvider>{mounted && children}</UserAccountProvider>
                    </BlockProvider>
                  </MoonPayProvider>
                </RainbowKitProvider>
              </CentrifugeProvider>
            </ApolloProvider>
        </AlchemyAccountProvider>
          </WagmiProvider>
          </QProvider>
      </QueryClientProvider>
    </Provider>
  );
};
