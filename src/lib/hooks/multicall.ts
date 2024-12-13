import { ChainId } from "@/constant/addresses";
import { useBlockContext } from "@/context/BlockContext";
import type { SkipFirst } from "@/types/tuple";

import multicall from "../state/multicall";

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
    ...args,
  );
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
