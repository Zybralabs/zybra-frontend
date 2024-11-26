import { useCallback } from "react";
import {  useZFIStakingContract } from "./useContract"; // Hook for contract interaction
import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";

/**
 * Hook for interacting with the LzybraCentrifugeStaking contract.
 * @param contractAddress Address of the LzybraCentrifugeStaking contract.
 * @param chainId Chain ID for the network.
 */
export function useLzybraStaking(contractAddress: string, chainId: number) {
  const stakingContract = useZFIStakingContract(true,chainId)

  const handleTransaction = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      if (!stakingContract) {
        console.error("Staking contract is not connected.");
        return null;
      }
      try {
        const tx = await stakingContract[methodName](...args, overrides);
        console.log(`Transaction ${methodName} sent:`, tx.hash);

        const receipt = await tx.wait();
        console.log(`Transaction ${methodName} confirmed:`, receipt);
        return receipt;
      } catch (error) {
        console.error(`Error in transaction ${methodName}:`, error);
        return null;
      }
    },
    [stakingContract]
  );

  // State-Changing Functions
  const stake = useCallback(
    async (amount: number) => handleTransaction("stake", [amount]),
    [handleTransaction]
  );

  const unstake = useCallback(
    async (amount: number) => handleTransaction("unstake", [amount]),
    [handleTransaction]
  );

  const triggerLiquidation = useCallback(
    async (vaultOwner: string, auctionId: number) =>
      handleTransaction("triggerLiquidation", [vaultOwner, auctionId]),
    [handleTransaction]
  );

  const withdrawReward = useCallback(
    async () => handleTransaction("withdrawReward"),
    [handleTransaction]
  );

  // Read Functions with `useSingleCallResult`
  const pendingReward = useCallback(
    (stakerAddress: string) =>
      useSingleCallResult(contractAddress, "pendingReward", [stakerAddress]),
    [contractAddress]
  );

  const totalStaked = useCallback(
    () => useSingleCallResult(contractAddress, "totalStaked", []),
    [contractAddress]
  );

  const totalProfitDistributed = useCallback(
    () => useSingleCallResult(contractAddress, "totalProfitDistributed", []),
    [contractAddress]
  );

  const getCollateralAssetPrice = useCallback(
    () => useSingleCallResult(contractAddress, "getCollateralAssetPrice", []),
    [contractAddress]
  );

  // Batch Read Function
  const batchReadData = useCallback(async () => {
    const methods = [
      { method: "totalStaked", args: [] },
      { method: "totalProfitDistributed", args: [] },
      { method: "getCollateralAssetPrice", args: [] },
    ];

    return useSingleContractMultipleData(
      contractAddress,
      methods.map((m) => m.method),
      methods.map((m) => m.args)
    );
  }, [contractAddress]);

  return {
    // State-Changing Functions
    stake,
    unstake,
    triggerLiquidation,
    withdrawReward,

    // Read Functions
    pendingReward,
    totalStaked,
    totalProfitDistributed,
    getCollateralAssetPrice,

    // Batch Read
    batchReadData,
  };
}
