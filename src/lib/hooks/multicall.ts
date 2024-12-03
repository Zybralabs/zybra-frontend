import { useCallback, useContext } from "react";

import { BigNumber, ethers } from "ethers";

import { BlockContext } from "./context/BlockContext"; // Replace with your custom context for block info
import { MulticallContract } from "./contracts/MulticallContract"; // Replace with your Multicall ABI and address
import { useEthersProvider } from "./useEthersProvider"; // Custom hook for provider

export type CallStateResult = {
  success: boolean;
  returnData: string | null;
};

export const NEVER_RELOAD = "NEVER_RELOAD"; // Exported for reusability

/**
 * Hook to call multiple contracts for a single piece of data.
 */
export function useMultipleContractSingleData(
  addresses: string[],
  methodName: string,
  callInputs: any[],
): CallStateResult[] {
  const { chainId, latestBlock } = useContext(BlockContext);
  const provider = useEthersProvider();

  return useCallback(async () => {
    if (!provider || !addresses.length || !methodName) return [];

    const multicall = MulticallContract(chainId, provider); // Multicall contract instance
    const calls = addresses.map((address) => ({
      target: address,
      callData: multicall.interface.encodeFunctionData(methodName, callInputs),
    }));

    const results = await multicall.aggregate(calls, { blockTag: latestBlock });

    return results.returnData.map((data: string) => ({
      success: data !== null,
      returnData: data,
    }));
  }, [addresses, methodName, callInputs, chainId, latestBlock, provider]);
}

/**
 * Hook to call a single contract for a specific method and inputs.
 */
export function useSingleCallResult(
  address: string,
  methodName: string,
  callInputs: any[],
): CallStateResult {
  const { chainId, latestBlock } = useContext(BlockContext);
  const provider = useEthersProvider();

  return useCallback(async () => {
    if (!provider || !address || !methodName) return { success: false, returnData: null };

    const multicall = MulticallContract(chainId, provider);
    const call = {
      target: address,
      callData: multicall.interface.encodeFunctionData(methodName, callInputs),
    };

    try {
      const result = await multicall.callStatic.aggregate([call], { blockTag: latestBlock });
      return {
        success: true,
        returnData: result.returnData[0],
      };
    } catch (error) {
      console.error("Single call failed:", error);
      return { success: false, returnData: null };
    }
  }, [address, methodName, callInputs, chainId, latestBlock, provider]);
}

/**
 * Hook to call multiple pieces of data from a single contract.
 */
export function useSingleContractMultipleData(
  address: string,
  methodNames: string[],
  inputs: any[][],
): CallStateResult[] {
  const { chainId, latestBlock } = useContext(BlockContext);
  const provider = useEthersProvider();

  return useCallback(async () => {
    if (!provider || !address || !methodNames.length) return [];

    const multicall = MulticallContract(chainId, provider);
    const calls = methodNames.map((methodName, index) => ({
      target: address,
      callData: multicall.interface.encodeFunctionData(methodName, inputs[index]),
    }));

    const results = await multicall.aggregate(calls, { blockTag: latestBlock });

    return results.returnData.map((data: string) => ({
      success: data !== null,
      returnData: data,
    }));
  }, [address, methodNames, inputs, chainId, latestBlock, provider]);
}

/**
 * Hook to call a single method on Mainnet.
 */
export function useMainnetSingleCallResult(
  address: string,
  methodName: string,
  callInputs: any[],
): CallStateResult {
  const { latestMainnetBlock } = useContext(BlockContext);
  const provider = useEthersProvider(1); // Mainnet chain ID (1)

  return useCallback(async () => {
    if (!provider || !address || !methodName) return { success: false, returnData: null };

    const multicall = MulticallContract(1, provider);
    const call = {
      target: address,
      callData: multicall.interface.encodeFunctionData(methodName, callInputs),
    };

    try {
      const result = await multicall.callStatic.aggregate([call], { blockTag: latestMainnetBlock });
      return {
        success: true,
        returnData: result.returnData[0],
      };
    } catch (error) {
      console.error("Mainnet single call failed:", error);
      return { success: false, returnData: null };
    }
  }, [address, methodName, callInputs, latestMainnetBlock, provider]);
}
