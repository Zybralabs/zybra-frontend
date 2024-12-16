import { useSingleCallResult, useSingleContractMultipleCalls, useSingleContractMultipleData } from "@/lib/hooks/multicall";

import { useCentrifugeVaultContract } from "./useContract";

/**
 * Hook to interact with the Centrifuge Vault contract.
 * @param vaultAddress The address of the Centrifuge Vault.
 * @param chainId The chain ID to connect to.
 */
export function useCentrifugeVault(vaultAddress: string, chainId: number) {
  // Ensure the contract is initialized
  const centrifugeVaultContract = useCentrifugeVaultContract(true, chainId);

  // Placeholder contract to ensure hooks are always called
  const safeContract = centrifugeVaultContract;

  // --- Read Functions (Single Call) ---
  
  const maxDepositResult = useSingleCallResult(safeContract, "maxDeposit", [vaultAddress]);
  
  
  const maxRedeemResult = useSingleCallResult(safeContract, "maxRedeem", [vaultAddress]);
  const collateralAssetPriceResult = useSingleCallResult(
  
    
    safeContract,
    "getCollateralAssetPrice",
    [],
  );
  

  const trancheAssetPriceResult = useSingleCallResult(safeContract, "getTrancheAssetPrice", [
    vaultAddress,
  ]);
  

  const isVaultResult = useSingleCallResult(safeContract, "isVault", [vaultAddress]);
  const poolTotalCirculationResult = useSingleCallResult(
  
    
    safeContract,
    "getPoolTotalCirculation",
    [],
  );
  

  const userTrancheAssetResult = useSingleCallResult(safeContract, "getUserTrancheAsset", [
    vaultAddress,
    "0x0000000000000000000000000000000000000000", // Placeholder user address
  ]);
  

  const borrowedResult = useSingleCallResult(safeContract, "getBorrowed", [
    vaultAddress,
    "0x0000000000000000000000000000000000000000", // Placeholder user address
  ]);

  // --- Batch Read Function ---

  // Batch Call Example
  const batchDataResults = useSingleContractMultipleCalls(
    safeContract,
    [
      "maxDeposit",
      "maxRedeem",
      "getCollateralAssetPrice",
      "getTrancheAssetPrice",
      "isVault",
      "getPoolTotalCirculation",
      "getUserTrancheAsset",
      "getBorrowed",
    ],
    [
      [vaultAddress], // For maxDeposit
      [vaultAddress], // For maxRedeem
      [], // No arguments for getCollateralAssetPrice
      [vaultAddress], // For getTrancheAssetPrice
      [vaultAddress], // For isVault
      [], // No arguments for getPoolTotalCirculation
      [vaultAddress, "0x0000000000000000000000000000000000000000"], // Placeholder user address for getUserTrancheAsset
      [vaultAddress, "0x0000000000000000000000000000000000000000"], // Placeholder user address for getBorrowed
    ],
  );
  

  const handleTransaction = async (methodName: string, args: any[] = [], overrides: any = {}) => {
    try {
      if (!centrifugeVaultContract) throw new Error("CentrifugeVault contract is not connected.");

      const tx = await centrifugeVaultContract[methodName](...args, overrides);
      console.log(`Transaction ${methodName} sent:`, tx.hash);

      const receipt = await tx.wait();
      console.log(`Transaction ${methodName} confirmed:`, receipt);
      return receipt;
    } catch (error) {
      console.error(`Error in transaction ${methodName}:`, error);
      return null;
    }
  };

  const requestDeposit = async (assetAmount: number) =>
    handleTransaction("requestDeposit", [assetAmount, vaultAddress]);

  const deposit = async (mintAmount: number) =>
    handleTransaction("deposit", [vaultAddress, mintAmount]);

  const requestWithdraw = async (trancheAmount: number, onBehalfOf: string) =>
    handleTransaction("requestWithdraw", [trancheAmount, onBehalfOf, vaultAddress]);

  const withdraw = async () => handleTransaction("withdraw", [vaultAddress]);

  const cancelDepositRequest = async () =>
    handleTransaction("cancelDepositRequest", [vaultAddress]);

  const cancelWithdrawRequest = async () =>
    handleTransaction("cancelWithdrawRequest", [vaultAddress]);

  const claimCancelDepositRequest = async () =>
    handleTransaction("ClaimcancelDepositRequest", [vaultAddress]);

  const addVault = async (vault: string) => handleTransaction("addVault", [vault]);

  const removeVault = async (vault: string) => handleTransaction("removeVault", [vault]);

  const liquidation = async (provider: string, onBehalfOf: string, assetAmount: number) =>
    handleTransaction("liquidation", [provider, vaultAddress, onBehalfOf, assetAmount]);

  const repayingDebt = async (provider: string, lzybraAmount: number) =>
    handleTransaction("repayingDebt", [provider, vaultAddress, lzybraAmount]);

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
    maxDepositResult,
    maxRedeemResult,
    collateralAssetPriceResult,
    trancheAssetPriceResult,
    isVaultResult,
    poolTotalCirculationResult,
    userTrancheAssetResult,
    borrowedResult,

    // Batch Read Data
    batchDataResults,
  };
}
