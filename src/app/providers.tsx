"use client";
import { useState, useEffect, type PropsWithChildren } from "react";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient as QClient, QueryClientProvider as QProvider } from "react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import dynamic from "next/dynamic";
import { WagmiProvider } from "wagmi";
import {
  AlchemyAccountProvider,
  type AlchemyAccountsProviderProps,
} from "@account-kit/react";
import { ApolloProvider } from "@apollo/client";
import { UserAccountProvider } from "@/context/UserAccountContext";
import { SmartAccountClientProvider } from "@/context/SmartAccountClientContext";
import { UniversalTransactionProvider } from "@/context/UniversalTransactionContext";
import { TransactionSponsorshipProvider } from "@/context/TransactionSponsorshipProvider";
import { TransactionProvider } from "@/context/TransactionContext";
import { wagmiConfig } from "@/wagmi";
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
import type { UserProvidedConfig } from "@centrifuge/centrifuge-js";
import { ENV_CONFIG } from "@/utils/env";

// Client-only CentrifugeProvider wrapper
const ClientOnlyCentrifugeProvider = ({ children, config }: { children: React.ReactNode; config: UserProvidedConfig }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // Dynamic import only on client side
  const CentrifugeProvider = dynamic(
    () => import("@centrifuge/centrifuge-react").then((mod) => mod.CentrifugeProvider).catch(() => {
      console.warn('CentrifugeProvider failed to load, using fallback');
      return ({ children }: { children: React.ReactNode }) => <>{children}</>;
    }),
    {
      ssr: false,
      loading: () => <>{children}</>,
    },
  ) as any;

  return <CentrifugeProvider config={config}>{children}</CentrifugeProvider>;
};

const MoonPayProvider = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayProvider).catch(() => {
    // Fallback component if MoonPay fails to load
    console.warn('MoonPay provider failed to load, using fallback');
    return ({ children }: { children: React.ReactNode }) => <>{children}</>;
  }),
  {
    ssr: false,
    loading: () => null,
  },
) as any;

// Safe wrapper for MoonPay
const SafeMoonPayProvider = ({ children, apiKey }: { children: React.ReactNode; apiKey: string }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !apiKey) {
    return <>{children}</>;
  }

  try {
    return <MoonPayProvider apiKey={apiKey} debug>{children}</MoonPayProvider>;
  } catch (error) {
    console.warn('MoonPay provider error:', error);
    return <>{children}</>;
  }
};



const centConfig: UserProvidedConfig = {
  network: ENV_CONFIG.NETWORK,
  kusamaWsUrl: ENV_CONFIG.RELAY_WSS_URL,
  polkadotWsUrl: ENV_CONFIG.RELAY_WSS_URL,
  altairWsUrl: ENV_CONFIG.COLLATOR_WSS_URL,
  centrifugeWsUrl: "wss://fullnode.development.cntrfg.com",
  printExtrinsics: ENV_CONFIG.NODE_ENV === "development",
  centrifugeSubqueryUrl: ENV_CONFIG.SUBQUERY_URL,
  altairSubqueryUrl: ENV_CONFIG.SUBQUERY_URL,
  metadataHost: ENV_CONFIG.IPFS_GATEWAY,
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
  const moonpay_api_key = ENV_CONFIG.MOONPAY_API_KEY;
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
              <ClientOnlyCentrifugeProvider config={centConfig}>
                <RainbowKitProvider appInfo={appInfo} coolMode modalSize="compact">
                  <SafeMoonPayProvider apiKey={moonpay_api_key}>
                    <BlockProvider>
                      <Updaters />
                      <UserAccountProvider>
                        <TransactionProvider>
                          <SmartAccountClientProvider>
                            <UniversalTransactionProvider>
                              <TransactionSponsorshipProvider>
                                {mounted && children}
                              </TransactionSponsorshipProvider>
                            </UniversalTransactionProvider>
                          </SmartAccountClientProvider>
                        </TransactionProvider>
                      </UserAccountProvider>
                    </BlockProvider>
                  </SafeMoonPayProvider>
                </RainbowKitProvider>
              </ClientOnlyCentrifugeProvider>
            </ApolloProvider>
        </AlchemyAccountProvider>
          </WagmiProvider>
          </QProvider>
      </QueryClientProvider>
    </Provider>
  );
};
