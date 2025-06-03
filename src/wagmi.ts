"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { Transport } from "viem";
import { createConfig, http } from "wagmi";
import {
  mainnet,
  sepolia,
  polygon,
  polygonMumbai,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  zkSync,
  zkSyncSepoliaTestnet,
  linea,
  lineaTestnet,
  base,
  baseGoerli,
  bsc,
  bscTestnet,
  baseSepolia,
} from "wagmi/chains";

// Use relative paths for icons from the `public` folder
const customZkSyncSepoliaTestnet = { ...zkSyncSepoliaTestnet, iconUrl: "/img/zksync_logo.svg" };
const customLinea = { ...linea, iconUrl: "/img/linea_logo.png" };
const customLineaTestnet = { ...lineaTestnet, iconUrl: "/img/lineaTesnet_logo.png" };

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
if (!walletConnectProjectId) {
  throw new Error("WalletConnect project ID is not defined.");
}

// Wallet connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        ledgerWallet,
        rabbyWallet,
        coinbaseWallet,
        argentWallet,
        safeWallet,
      ],
    },
  ],
  { appName: "Zybra Finance", projectId: walletConnectProjectId },
);

// Transport configuration
const transports: Record<number, Transport> = {
  [mainnet.id]: http(),
  [sepolia.id]: http(),
  [polygon.id]: http(),
  [polygonMumbai.id]: http(),
  [optimism.id]: http(),
  [optimismGoerli.id]: http(),
  [arbitrum.id]: http(),
  [arbitrumGoerli.id]: http(),
  [zkSync.id]: http(),
  [zkSyncSepoliaTestnet.id]: http(),
  [linea.id]: http(),
  [lineaTestnet.id]: http(),
  [base.id]: http(),
  [baseGoerli.id]: http(),
  [baseSepolia.id]: http(), // Added Base Sepolia transport
  [bsc.id]: http(),
  [bscTestnet.id]: http(),
};

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [
    baseSepolia,
    // mainnet,
    // sepolia,
    // polygon,
    // base,

  ],
  connectors,
  transports,
  ssr: true, // Enable SSR for Wagmi
});
