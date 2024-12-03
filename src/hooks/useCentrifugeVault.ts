import { useCallback } from "react";

import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";

import { useCentrifugeVaultContract } from "./useContract";

/**
 * Hook to interact with the Centrifuge Vault contract.
 * @param vaultAddress The address of the Centrifuge Vault.
 * @param chainId The chain ID to connect to.
 */
export function useCentrifugeVault(vaultAddress: string, chainId: number) {
  const centrifugeVaultContract = useCentrifugeVaultContract(vaultAddress, true, chainId);

  if (!centrifugeVaultContract) {
    console.error("CentrifugeVault contract is not connected.");
    return {};
  }

  const handleTransaction = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      if (!centrifugeVaultContract) {
        console.error("CentrifugeVault contract is not connected.");
        return null;
      }

      try {
        const tx = await centrifugeVaultContract[methodName](...args, overrides);
        console.log(`Transaction ${methodName} sent:`, tx.hash);

        const receipt = await tx.wait();
        console.log(`Transaction ${methodName} confirmed:`, receipt);
        return receipt;
      } catch (error) {
        console.error(`Error sending transaction ${methodName}:`, error);
        return null;
      }
    },
    [centrifugeVaultContract],
  );

  // --- State-Changing Functions ---
  const requestDeposit = useCallback(
    async (assetAmount: number) => handleTransaction("requestDeposit", [assetAmount, vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const deposit = useCallback(
    async (mintAmount: number) => handleTransaction("deposit", [vaultAddress, mintAmount]),
    [handleTransaction, vaultAddress],
  );

  const requestWithdraw = useCallback(
    async (trancheAmount: number, onBehalfOf: string) =>
      handleTransaction("requestWithdraw", [trancheAmount, onBehalfOf, vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const withdraw = useCallback(
    async () => handleTransaction("withdraw", [vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const cancelDepositRequest = useCallback(
    async () => handleTransaction("cancelDepositRequest", [vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const cancelWithdrawRequest = useCallback(
    async () => handleTransaction("cancelWithdrawRequest", [vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const claimCancelDepositRequest = useCallback(
    async () => handleTransaction("ClaimcancelDepositRequest", [vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const addVault = useCallback(
    async (vault: string) => handleTransaction("addVault", [vault]),
    [handleTransaction],
  );

  const removeVault = useCallback(
    async (vault: string) => handleTransaction("removeVault", [vault]),
    [handleTransaction],
  );

  const liquidation = useCallback(
    async (provider: string, onBehalfOf: string, assetAmount: number) =>
      handleTransaction("liquidation", [provider, vaultAddress, onBehalfOf, assetAmount]),
    [handleTransaction, vaultAddress],
  );

  const repayingDebt = useCallback(
    async (provider: string, lzybraAmount: number) =>
      handleTransaction("repayingDebt", [provider, vaultAddress, lzybraAmount]),
    [handleTransaction, vaultAddress],
  );

  // --- Read Functions (Single Call) ---

  const maxDeposit = useCallback(
    async (controller: string) => useSingleCallResult(vaultAddress, "maxDeposit", [controller]),
    [vaultAddress],
  );

  const maxRedeem = useCallback(
    async (controller: string) => useSingleCallResult(vaultAddress, "maxRedeem", [controller]),
    [vaultAddress],
  );

  const getCollateralAssetPrice = useCallback(
    async () => useSingleCallResult(vaultAddress, "getCollateralAssetPrice", []),
    [vaultAddress],
  );

  const getTrancheAssetPrice = useCallback(
    async () => useSingleCallResult(vaultAddress, "getTrancheAssetPrice", [vaultAddress]),
    [vaultAddress],
  );

  const isVault = useCallback(
    async () => useSingleCallResult(vaultAddress, "isVault", [vaultAddress]),
    [vaultAddress],
  );

  const getPoolTotalCirculation = useCallback(
    async () => useSingleCallResult(vaultAddress, "getPoolTotalCirculation", []),
    [vaultAddress],
  );

  const getUserTrancheAsset = useCallback(
    async (user: string) =>
      useSingleCallResult(vaultAddress, "getUserTrancheAsset", [vaultAddress, user]),
    [vaultAddress],
  );

  const getBorrowed = useCallback(
    async (user: string) => useSingleCallResult(vaultAddress, "getBorrowed", [vaultAddress, user]),
    [vaultAddress],
  );

  // --- Batch Read Function ---
  const batchReadData = useCallback(
    async (userAddress?: string, controller?: string) => {
      const methods = [
        { method: "maxDeposit", args: [controller || vaultAddress] },
        { method: "maxRedeem", args: [controller || vaultAddress] },
        { method: "getCollateralAssetPrice", args: [] },
        { method: "getTrancheAssetPrice", args: [vaultAddress] },
        { method: "isVault", args: [vaultAddress] },
        { method: "getPoolTotalCirculation", args: [] },
        {
          method: "getUserTrancheAsset",
          args: [vaultAddress, userAddress || "0x0000000000000000000000000000000000000000"],
        },
        {
          method: "getBorrowed",
          args: [vaultAddress, userAddress || "0x0000000000000000000000000000000000000000"],
        },
      ];

      return useSingleContractMultipleData(
        vaultAddress,
        methods.map((m) => m.method),
        methods.map((m) => m.args),
      );
    },
    [vaultAddress],
  );

  return {
    // State-Changing Functions
    requestDeposit,
    deposit,
    requestWithdraw,
    withdraw,
    cancelDepositRequest,
    cancelWithdrawRequest,
    claimCancelDepositRequest,
    addVault,
    removeVault,
    liquidation,
    repayingDebt,

    // Read Functions
    maxDeposit,
    maxRedeem,
    getCollateralAssetPrice,
    getTrancheAssetPrice,
    isVault,
    getPoolTotalCirculation,
    getUserTrancheAsset,
    getBorrowed,

    // Batch Read Function
    batchReadData,
  };
}
