import { ChainId } from "@/constant/addresses";
import { useBlockContext } from "@/context/BlockContext";
import type { SkipFirst } from "@/types/tuple";

import multicall from "../state/multicall";
import type { Contract } from "ethers";
import { useMemo } from "react";

export { NEVER_RELOAD } from "@uniswap/redux-multicall"; // Re-export for convenience
export type { CallStateResult } from "@uniswap/redux-multicall"; // Re-export for convenience

// Utility to skip the first two parameters of a function
type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>;

/**
 * Hook to call multiple contracts for a single method using multicall.
 */
export function useMultipleContractSingleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useMultipleContractSingleData>
) {
  const { chainId, latestBlock } = useBlockContext();
  return multicall.hooks.useMultipleContractSingleData(
    chainId ?? ChainId.Testnet,
    latestBlock,
    ...args,
  );
}

/**
 * Hook to call a single contract method using multicall.
 */
export function useSingleCallResult(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>
) {
  const { chainId, latestBlock } = useBlockContext();
  return multicall.hooks.useSingleCallResult(chainId ?? ChainId.Testnet, latestBlock, ...args);
}

/**
 * Hook to call multiple methods on a single contract using multicall.
 */
export function useSingleContractMultipleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractMultipleData>
) {
  const { chainId, latestBlock } = useBlockContext();
  return multicall.hooks.useSingleContractMultipleData(
    chainId ?? ChainId.Testnet,
    latestBlock,
    ...args
  );
}


export function useSingleContractMultipleCalls(
  contract: Contract | null,
  methods: string[],
  params: any[][],
) {
  const results = useMemo(() => {
    if (!contract || methods.length !== params.length) {
      console.error("Contract must be provided and methods/params must have matching lengths.");
      return [];
    }

    // Map over methods and parameters to call useSingleCallResult for each
    return methods.map((method, index) => {
      const methodParams = params[index] ?? [];
      return useSingleCallResult(contract, method, methodParams);
    });
  }, [contract, methods, params]);

  return results;
}



/**
 * Hook to call a single contract on Mainnet using multicall.
 */
export function useMainnetSingleCallResult(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>
) {
  const { latestMainnetBlock } = useBlockContext();
  return multicall.hooks.useSingleCallResult(ChainId.Mainnet, latestMainnetBlock, ...args);
}
