import type { SupportedChainId } from "@/constant/addresses";
import { RPC_PROVIDERS } from "@/constant/constant";
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { usePublicClient, useChainId, useBlock } from "wagmi";

// Default block number - using a reasonable starting point
const DEFAULT_BLOCK_NUMBER = 0;

interface BlockContextProps {
  chainId: number;
  latestBlock: number;
  latestMainnetBlock: number;
  isLoading: boolean;
}

const BlockContext = createContext<BlockContextProps>({
  chainId: 1, // Default to mainnet
  latestBlock: DEFAULT_BLOCK_NUMBER,
  latestMainnetBlock: DEFAULT_BLOCK_NUMBER,
  isLoading: true
});

export const useBlockContext = () => useContext(BlockContext);

export const BlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get chain information from wagmi
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: blockData } = useBlock(); // Only extract the data we need

  // State for block numbers with safe defaults
  const [latestBlock, setLatestBlock] = useState<number>(DEFAULT_BLOCK_NUMBER);
  const [latestMainnetBlock, setLatestMainnetBlock] = useState<number>(DEFAULT_BLOCK_NUMBER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use refs to prevent stale closures in the interval
  const latestBlockRef = useRef<number>(DEFAULT_BLOCK_NUMBER);
  const chainIdRef = useRef<number>(chainId);

  // Update refs when values change
  useEffect(() => {
    latestBlockRef.current = latestBlock;
    chainIdRef.current = chainId;
  }, [latestBlock, chainId]);

  // Safe function to validate and set block numbers
  const safeSetBlockNumber = useCallback((blockNumber: bigint | number | undefined): number => {
    if (blockNumber === undefined || blockNumber === null) {
      return latestBlockRef.current; // Return previous value if undefined
    }

    const numericValue = Number(blockNumber);

    // Validate that it's a proper number and not NaN
    if (!Number.isFinite(numericValue) || Number.isNaN(numericValue)) {
      console.warn("Invalid block number received:", blockNumber);
      return latestBlockRef.current; // Return previous value if invalid
    }

    return numericValue;
  }, []);

  // Function to fetch block numbers
  const fetchBlockNumbers = useCallback(async () => {
    setIsLoading(true);

    try {
      // First try to get block from wagmi hook
      if (blockData && typeof blockData.number === 'bigint') {
        const validBlockNumber = safeSetBlockNumber(blockData.number);
        setLatestBlock(validBlockNumber);
        setLatestMainnetBlock(validBlockNumber);
        setIsLoading(false);
        return;
      }

      // Fallback to RPC provider
      if (chainId && RPC_PROVIDERS[chainId as SupportedChainId]) {
        try {
          // Use public client from wagmi if available
          if (publicClient) {
            const blockNumber = await publicClient.getBlockNumber();
            const validBlockNumber = safeSetBlockNumber(blockNumber);
            setLatestBlock(validBlockNumber);
            setLatestMainnetBlock(validBlockNumber);
          }
          // Fallback to direct RPC provider
          else {
            const blockNumber = await RPC_PROVIDERS[chainId as SupportedChainId].getBlockNumber();
            const validBlockNumber = safeSetBlockNumber(blockNumber);
            setLatestBlock(validBlockNumber);
            setLatestMainnetBlock(validBlockNumber);
          }
        } catch (error) {
          console.error("Error fetching block number from RPC:", error);
          // Don't update state on error - keep previous values
        }
      } else {
        console.warn("No RPC provider available for chainId:", chainId);
      }
    } catch (error) {
      console.error("Error in block fetching process:", error);
    } finally {
      setIsLoading(false);
    }
  }, [blockData, chainId, publicClient, safeSetBlockNumber]);

  // Effect to update block when chain changes or block data updates
  useEffect(() => {
    fetchBlockNumbers();
  }, [chainId, blockData, fetchBlockNumbers]);

  // Set up polling interval for regular updates
  useEffect(() => {
    // Initial fetch
    fetchBlockNumbers();

    // Set up interval for regular updates
    const interval = setInterval(fetchBlockNumbers, 12000); // 12 seconds for slightly less frequent polling

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchBlockNumbers]);

  // Provide context values
  return (
    <BlockContext.Provider
      value={{
        chainId,
        latestBlock,
        latestMainnetBlock,
        isLoading
      }}
    >
      {children}
    </BlockContext.Provider>
  );
};