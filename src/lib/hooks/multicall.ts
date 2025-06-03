import { useWeb3React } from '@web3-react/core'
import multicall from '../state/multicall'
import { useBlockNumber, useChainId } from 'wagmi'
import { SupportedChainId } from '@/constant/addresses'
import type { SkipFirst } from '@/types/tuple'
import { useBlockContext } from '@/context/BlockContext'
import { useMemo, useEffect, useRef } from 'react'
import type { Contract } from 'ethers'
import type { CallState } from '@/types'

export type { CallStateResult } from '@uniswap/redux-multicall' // re-export for convenience
export { NEVER_RELOAD } from '@uniswap/redux-multicall' // re-export for convenience

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useMultipleContractSingleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useMultipleContractSingleData>
) {
  const { chainId, latestBlock } = useCallContext();

  try {
    if (!chainId || latestBlock === undefined) {
      console.warn('Missing chainId or latestBlock in useMultipleContractSingleData');
      return [];
    }

    return multicall.hooks.useMultipleContractSingleData(chainId, Number(latestBlock), ...args);
  } catch (error) {
    console.error('Error in useMultipleContractSingleData:', error);
    return [];
  }
}

export function useSingleCallResult(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>) {
  const { chainId, latestBlock } = useCallContext();

  try {
    if (!chainId || latestBlock === undefined) {
      console.warn('Missing chainId or latestBlock in useSingleCallResult');
      return { loading: false, error: true, result: undefined, syncing: false, valid: false };
    }

    return multicall.hooks.useSingleCallResult(chainId, Number(latestBlock), ...args);
  } catch (error) {
    console.error('Error in useSingleCallResult:', error);
    return { loading: false, error: true, result: undefined, syncing: false, valid: false };
  }
}

export function useSingleContractMultipleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractMultipleData>
) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useSingleContractMultipleData(chainId, Number(latestBlock), ...args)
}

export function useSingleContractWithCallData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractWithCallData>
) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useSingleContractWithCallData(chainId, Number(latestBlock), ...args)
}

// IMPORTANT: This hook must ONLY be called at the component level, never inside other hooks
function useCallContext() {
  const chainId = useChainId()
  const { latestBlock } = useBlockContext()
  // Don't use useMemo here as it can cause hook rule violations
  return { chainId, latestBlock }
}

export function useSingleContractMultipleCalls(
  contract: Contract | null,
  methods: string[],
  params: any[][],
) {
  // Call hooks at the top level - we don't need to use the values directly
  // but we need to call the hook to ensure it's called at the component level
  useCallContext();

  // Create individual call results for each method/param pair
  // This is the key fix - we're calling hooks at the top level of the component
  // instead of inside useMemo
  const callResults = [];

  if (!contract || !methods || !params || methods.length !== params.length) {
    console.warn("Invalid parameters in useSingleContractMultipleCalls", {
      contractAvailable: !!contract,
      methodsLength: methods?.length,
      paramsLength: params?.length
    });

    // Return empty results with error state
    return Array(methods?.length || 0).fill({
      loading: false,
      error: true,
      result: undefined,
      syncing: false,
      valid: false
    });
  }

  // Call each method individually at the top level
  for (let i = 0; i < methods.length; i++) {
    try {
      const method = methods[i];
      const methodParams = params[i] ?? [];
      // This is now called at the top level of the component
      const result = useSingleCallResult(contract, method, methodParams);
      callResults.push(result);
    } catch (error) {
      console.error(`Error in useSingleContractMultipleCalls for method at index ${i}:`, error);
      callResults.push({
        loading: false,
        error: true,
        result: undefined,
        syncing: false,
        valid: false
      });
    }
  }

  return callResults;
}

export function useMultiContractWithMultiData(
  contractsWithMethods: Array<{
    contract: Contract | null,
    methodName: string,
    params: any[]
  }>
): CallState[] {
  // Call hooks at the top level - we don't need to use the values directly
  // but we need to call the hook to ensure it's called at the component level
  useCallContext()

  // Filter out invalid entries
  const validContractsWithMethods = contractsWithMethods.filter(
    ({ contract, methodName }) => contract != null && methodName != null
  )

  // Create individual call results for each contract/method pair
  const results: CallState[] = Array(contractsWithMethods.length).fill({
    loading: false,
    error: false,
    result: undefined,
    syncing: false,
    valid: false
  });

  // Process each valid contract/method pair individually
  validContractsWithMethods.forEach((item, originalIndex) => {
    const { contract, methodName, params } = item;

    if (!contract) return;

    try {
      // Call the contract method directly using useSingleCallResult
      // This is now called at the top level of the component
      const result = useSingleCallResult(contract, methodName, params);

      // Store the result in the original position
      results[originalIndex] = result;
    } catch (error) {
      console.error(`Error in useMultiContractWithMultiData for method ${methodName}:`, error);
      results[originalIndex] = {
        loading: false,
        error: true,
        result: undefined,
        syncing: false,
        valid: false
      };
    }
  });

  return results;
}


// /**
//  * Hook to call a single contract on Base_Mainnet using multicall.
//  */
export function useMainnetSingleCallResult
  (...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>) {
  const { latestMainnetBlock } = useBlockContext()
  return multicall.hooks.useSingleCallResult(SupportedChainId.Base_Mainnet, latestMainnetBlock, ...args);
}