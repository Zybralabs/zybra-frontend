import { SmartAccountClientOptsSchema } from "@aa-sdk/core";
import { type SupportedAccountTypes } from "@account-kit/core";
import { arbitrumSepolia, alchemy, baseSepolia, sepolia, mainnet, polygon, type AlchemyTransport } from "@account-kit/infra";
import { cookieStorage, createConfig, type AlchemyAccountsUIConfig } from "@account-kit/react";
import type { TransactionOptions } from "@centrifuge/centrifuge-js";
import { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import arbitrumLogo from "@centrifuge/fabric/assets/logos/arbitrum.svg";
import assetHubLogo from "@centrifuge/fabric/assets/logos/assethub.svg";
import baseLogo from "@centrifuge/fabric/assets/logos/base.svg";
import ethereumLogo from "@centrifuge/fabric/assets/logos/ethereum.svg";
import { SupportedChainId } from "./constant/addresses";
import type { Chain } from "viem";
import { ENV_CONFIG } from "./utils/env";

type EnvironmentConfig = {
  name: string;
  network: "altair" | "centrifuge";
  baseCurrency: "USD";
  assetClasses: Record<"Public credit" | "Private credit", string[]>;
  poolCreationType: TransactionOptions["createType"];
};

const poolCreationType = (process.env.NEXT_PUBLIC_POOL_CREATION_TYPE || "immediate") as
  | "immediate"
  | "propose"
  | "notePreimage";
// export const isTestEnv =
//   (window.location.hostname.endsWith("k-f.dev") &&
//     !window.location.hostname.includes("production")) ||
//   window.location.hostname === "localhost";

const CENTRIFUGE: EnvironmentConfig = {
  name: "Centrifuge App",
  network: "centrifuge",

  baseCurrency: "USD",
  assetClasses: {
    "Private credit": [
      "Consumer credit",
      "Corporate credit",
      "Commercial real estate",
      "Residential real estate",
      "Project finance",
      "Trade finance",
      "Digital assets",
    ],
    "Public credit": ["Corporate bonds", "US treasuries"],
  },
  poolCreationType,
};

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
const onfinalityKey = process.env.NEXT_PUBLIC_ONFINALITY_KEY;
const tenderlyKey = process.env.NEXT_PUBLIC_TENDERLY_KEY;

export const ethConfig = {
  rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  chainId: 1,
  poolRegistryAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  poolsHash: "QmXJZjBMvW8Qgqt82zAbAKYSBV5u91JsC8uHfF2eR2uAZA", // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: "https://etherscan.io",
  network: "mainnet",
  multicallContractAddress: "0xcA11bde05977b3631167028862bE2a173976CA11", // Same for all networks
  remarkerAddress: "0x3E39db43035981c2C31F7Ffa4392f25231bE4477", // Same for all networks
};
interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface ChainConfig {
  name: string;
  nativeCurrency: NativeCurrency;
  blockExplorerUrl: string;
  urls: string[];
  network: string;
  iconUrl: string;
  isTestnet: boolean;
}
type EVMChains = Record<number, ChainConfig>;

export const evmChains: EVMChains  = {
  1: {
    name: "Ethereum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://etherscan.io/",
    urls: [
      `https://mainnet.gateway.tenderly.co/${tenderlyKey}`,
      `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      `https://eth.api.onfinality.io/rpc?apikey=${onfinalityKey}`,
    ],
    network: "mainnet",
    iconUrl: ethereumLogo,
    isTestnet: false,
  },
  11155111: {
    name: "Ethereum Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "sepETH", decimals: 18 },
    blockExplorerUrl: "https://sepolia.etherscan.io/",
    urls: [
      `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`,
      `https://eth-sepolia.api.onfinality.io/rpc?apikey=${onfinalityKey}`,
    ],
    network: "sepolia",
    iconUrl: ethereumLogo,
    isTestnet: true,
  },
  8453: {
    name: "Base",
    nativeCurrency: { name: "Base Ether", symbol: "bETH", decimals: 18 },
    blockExplorerUrl: "https://basescan.org/",
    urls: ["https://mainnet.base.org"],
    iconUrl: baseLogo,
    network: "base-mainnet",
    isTestnet: false,
  },
  84532: {
    name: "Base Sepolia",
    nativeCurrency: { name: "Base Sepolia Ether", symbol: "sbETH", decimals: 18 },
    blockExplorerUrl: "https://sepolia.basescan.org/",
    urls: [`https://sepolia.base.org`],
    iconUrl: baseLogo,
    network: "base-sepolia",
    isTestnet: true,
  },
  42161: {
    name: "Arbitrum One",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://arbiscan.io/",
    urls: ["https://arb1.arbitrum.io/rpc"],
    iconUrl: arbitrumLogo,
    network: "arbitrum-mainnet",
    isTestnet: false,
  },
  42220: {
    name: "Celo",
    nativeCurrency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    blockExplorerUrl: "https://celoscan.io/",
    urls: ["https://forno.celo.org"],
    iconUrl: ethereumLogo,
    isTestnet: false,
    network: "celo-mainnet",
  },
  44787: {
    name: "Celo Alfajores",
    nativeCurrency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    blockExplorerUrl: "https://alfajores.celoscan.io/",
    urls: ["https://alfajores-forno.celo-testnet.org"],
    iconUrl: ethereumLogo,
    isTestnet: true,
    network: "celo-alfajores",
  },
};

export const centrifuge_config = CENTRIFUGE;

const assetHubChainId = process.env.NEXT_PUBLIC_IS_DEMO ? 1001 : 1000;

export const parachainNames: Record<number, string> = {
  [assetHubChainId]: "Asset Hub",
};

const uiConfig: AlchemyAccountsUIConfig = {
  // illustrationStyle: "filled",
  auth: {
    sections: [
      [{ type: "email", emailMode: "otp" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "apple", mode: "popup" },
      ],
      [
        {
          type: "external_wallets",
          walletConnect: { projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}` },
        },
      ],
    ],
    addPasskeyOnSignup: false,
    // header: <img src="path/to/logo.svg" />,
  },
};

export function getAlchemyRpcUrl(chain: SupportedChainId): string {
  switch (chain) {
    case SupportedChainId.Polygon_Mainnet:
      return "https://arb-sepolia.g.alchemy.com/v2/1dUe6zHAjXocqykmyQks8EmNvFiPJ0p3";
    case SupportedChainId.Testnet:
      return "https://base-sepolia.g.alchemy.com/v2/1dUe6zHAjXocqykmyQks8EmNvFiPJ0p3";
    case SupportedChainId.Mainnet:
      return "https://eth-sepolia.g.alchemy.com/v2/1dUe6zHAjXocqykmyQks8EmNvFiPJ0p3";
    default:
      throw new Error(`Unsupported chain ID: ${chain}`);
  }
}

export function getGasManagerPolicyId(chainId: number): string | undefined {
  switch (chainId) {
    case baseSepolia.id: // Base Sepolia (84532)
      return process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID;
    case sepolia.id: // Ethereum Sepolia (11155111)
      return process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID;
    case arbitrumSepolia.id: // Arbitrum Sepolia (421614)
      return process.env.NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID;
    case polygon.id: // Polygon Mainnet (137)
      return process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID;
    case mainnet.id: // Ethereum Mainnet (1)
      return process.env.NEXT_PUBLIC_MAINNET_GAS_MANAGER_POLICY_ID;
    // Legacy support for your existing chain IDs
    case SupportedChainId.Testnet: // Base Sepolia
      return process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID;
    case SupportedChainId.Mainnet: // Ethereum Sepolia
      return process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID;
    case SupportedChainId.Polygon_Mainnet: // Polygon
      return process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID;
    default:
      console.warn(`No gas manager policy configured for chain ID: ${chainId}`);
      return undefined;
  }
}
// [!region create-accounts-config]
// NOTE: feel free to change the chain here!


export const alchemy_config = createConfig({
  // Global transport for all chains - use environment variable
  transport: alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "1dUe6zHAjXocqykmyQks8EmNvFiPJ0p3"
  }),
  // Default chain
  chain: baseSepolia,
  // Chain specific configurations with gas manager policies
  chains: [
    {
      chain: arbitrumSepolia,
      policyId: process.env.NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID || undefined,
    },
    {
      chain: baseSepolia,
      policyId: process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID || undefined,
    },
    {
      chain: sepolia,
      policyId: process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID || undefined,
    },
    {
      chain: polygon,
      policyId: process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID || undefined,
    },
    {
      chain: mainnet,
      policyId: process.env.NEXT_PUBLIC_MAINNET_GAS_MANAGER_POLICY_ID || undefined,
    }
  ],
  // Signer connection config
  signerConnection: {
    rpcUrl: "/api/rpc/",
  },
  // Additional config options
  ssr: true,
  storage: cookieStorage,
  enablePopupOauth: true,
});


// [!endregion create-accounts-config]

// [!region other-config-vars]
// provide a query client for use by the alchemy accounts provider
export const queryClient = new QueryClient();
// configure the account type we wish to use once
export const accountType: SupportedAccountTypes = "LightAccount";

// additional options for our account client
type SmartAccountClientOptions = z.infer<typeof SmartAccountClientOptsSchema>;
export const accountClientOptions: Partial<SmartAccountClientOptions> = {
  txMaxRetries: 20,
  
};
// [!endregion other-config-vars]
