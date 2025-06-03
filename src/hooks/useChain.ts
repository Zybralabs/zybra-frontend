import { useMemo } from "react";

import type { SupportedChainId } from "@/constant/addresses";

type ChainInfo = {
  name: string;
  blockPerMainnetEpochForChainId: number;
};

const CHAIN_INFO: { [key: number]: ChainInfo } = {
  1: {
    name: "Ethereum Base_Mainnet",
    blockPerMainnetEpochForChainId: 1,
  },
  11155111: {
    name: "Sepolia Testnet",
    blockPerMainnetEpochForChainId: 1,
  },
  137: {
    name: "Polygon",
    blockPerMainnetEpochForChainId: 1,
  },
  84532: {
    name: "Base_Testnet",
    blockPerMainnetEpochForChainId: 1,
  },
  8453: {
    name: "Base_Mainnet",
    blockPerMainnetEpochForChainId: 1,
  },
};

export function getChainInfo(chainId: number): ChainInfo {
  return CHAIN_INFO[chainId] || { name: "Unknown", blockPerMainnetEpochForChainId: 1 };
}


export function useSupportedChainId(chainId: number | undefined): SupportedChainId | undefined {
  // Define a list of supported Chain IDs
  const SUPPORTED_CHAIN_IDS: number[] = [
    1, // Ethereum Base_Mainnet
    4, // Rinkeby Testnet
    5, // Goerli Testnet
    137, // Polygon Base_Mainnet
    10, // Optimism
    8453, // Base Base_Mainnet (example)
  ];

  if (chainId && SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId)) {
    return chainId as SupportedChainId;
    
    return chainId;
  }
  else{

    return undefined;
  }
  
}