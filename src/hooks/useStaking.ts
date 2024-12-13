import { useMemo, useCallback } from "react";

import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";

import { useZFIStakingContract } from "./useContract"; // Hook for contract interaction

/**
 * Hook for interacting with the LzybraCentrifugeStaking contract.
 * @param contractAddress Address of the LzybraCentrifugeStaking contract.
 * @param chainId Chain ID for the network.
 */
export function useLzybraStaking(contractAddress: string, chainId: number) {
  const stakingContract = useZFIStakingContract(true, chainId);

  const safeContractAddress = useMemo(() => contractAddress, [contractAddress]);

  // Read Functions with `useSingleCallResult`
  const pendingReward = useSingleCallResult(stakingContract, "pendingReward", [
    safeContractAddress,
  ]);

  const totalStaked = useSingleCallResult(stakingContract, "totalStaked", []);

  const totalProfitDistributed = useSingleCallResult(
    stakingContract,
    "totalProfitDistributed",
    []
  );

  const getCollateralAssetPrice = useSingleCallResult(
    stakingContract,
    "getCollateralAssetPrice",
    []
  );

  // Batch Read Function
  const batchReadData = useSingleContractMultipleData(
    stakingContract,
    ["totalStaked", "totalProfitDistributed", "getCollateralAssetPrice"],
    [[], [], []]
  );

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

  return useMemo(
    () => ({
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
    }),
    [
      stake,
      unstake,
      triggerLiquidation,
      withdrawReward,
      pendingReward,
      totalStaked,
      totalProfitDistributed,
      getCollateralAssetPrice,
      batchReadData,
    ]
  );
}
