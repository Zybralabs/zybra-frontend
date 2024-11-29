import type { ChainId } from '@/constant/addresses';
import { useMemo } from 'react'


export function getChainInfo(chainId: number) {
    const CHAIN_INFO = {
      1: {
        name: 'Ethereum Mainnet',
        blockPerMainnetEpochForChainId: 1,
      },
      4: {
        name: 'Rinkeby Testnet',
        blockPerMainnetEpochForChainId: 1,
      },
      137: {
        name: 'Polygon Mainnet',
        blockPerMainnetEpochForChainId: 1,
      },
      // Add other chains as needed
    };
  
    return CHAIN_INFO[chainId] || { name: 'Unknown', blockPerMainnetEpochForChainId: 1 };
  }
  

  export function useSupportedChainId(chainId: number | undefined): ChainId | undefined {
    // Define a list of supported Chain IDs
    const SUPPORTED_CHAIN_IDS: number[] = [
      1,   // Ethereum Mainnet
      4,   // Rinkeby Testnet
      5,   // Goerli Testnet
      137, // Polygon Mainnet
      10,  // Optimism
      8453, // Base Mainnet (example)
    ];
  
    return useMemo(() => {
      if (chainId && SUPPORTED_CHAIN_IDS.includes(chainId as ChainId)) {
        return chainId as ChainId;
      }
      return undefined;
    }, [chainId]);
  }