import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";
import { useMemo, useCallback } from "react";
import { useERC7540VaultContract } from "./useContract";

/**
 * Hook to interact with the read functions of the ERC7540Vault contract.
 * @param vaultAddress Address of the ERC7540Vault contract
 */
export function useERC7540VaultRead(vaultAddress: string,chainId: number) {

const contract = useERC7540VaultContract(vaultAddress, false, chainId); // Use the custom contract hook

    if (!contract) {
      console.error("Vault contract could not be initialized");
      return null;
    }
  if (!vaultAddress) {
    console.error("Vault address is required");
    return null;
  }

  // --- Batch Fetch using Single Contract Multiple Data ---
  const fetchBatchData = useSingleContractMultipleData(vaultAddress, [
    "poolId",
    "trancheId",
    "asset",
    "share",
    "pricePerShare",
    "priceLastUpdated",
    "totalAssets",
  ],[]);

  // --- Individual Function Calls ---
  const poolId = useSingleCallResult(vaultAddress, "poolId", []);
  const trancheId = useSingleCallResult(vaultAddress, "trancheId", []);
  const asset = useSingleCallResult(vaultAddress, "asset", []);
  const share = useSingleCallResult(vaultAddress, "share", []);
  const pricePerShare = useSingleCallResult(vaultAddress, "pricePerShare", []);
  const priceLastUpdated = useSingleCallResult(
    vaultAddress,
    "priceLastUpdated",
    []
  );
  const totalAssets = useSingleCallResult(vaultAddress, "totalAssets", []);

  const convertToShares = useCallback(
    async (assets: string) =>
      useSingleCallResult(vaultAddress, "convertToShares", [assets]),
    [vaultAddress]
  );

  const convertToAssets = useCallback(
    async (shares: string) =>
      useSingleCallResult(vaultAddress, "convertToAssets", [shares]),
    [vaultAddress]
  );

  const maxDeposit = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "maxDeposit", [controller]),
    [vaultAddress]
  );

  const maxMint = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "maxMint", [controller]),
    [vaultAddress]
  );

  const maxWithdraw = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "maxWithdraw", [controller]),
    [vaultAddress]
  );

  const maxRedeem = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "maxRedeem", [controller]),
    [vaultAddress]
  );

  const isPermissioned = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "isPermissioned", [controller]),
    [vaultAddress]
  );

  // --- Pending and Claimable Functions ---
  const pendingDepositRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "pendingDepositRequest", [0, controller]),
    [vaultAddress]
  );

  const claimableDepositRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "claimableDepositRequest", [0, controller]),
    [vaultAddress]
  );

  const pendingRedeemRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "pendingRedeemRequest", [0, controller]),
    [vaultAddress]
  );

  const claimableRedeemRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "claimableRedeemRequest", [0, controller]),
    [vaultAddress]
  );

  const pendingCancelDepositRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "pendingCancelDepositRequest", [0, controller]),
    [vaultAddress]
  );

  const claimableCancelDepositRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "claimableCancelDepositRequest", [0, controller]),
    [vaultAddress]
  );

  const pendingCancelRedeemRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "pendingCancelRedeemRequest", [0, controller]),
    [vaultAddress]
  );

  const claimableCancelRedeemRequest = useCallback(
    async (controller: string) =>
      useSingleCallResult(vaultAddress, "claimableCancelRedeemRequest", [0, controller]),
    [vaultAddress]
  );

  return useMemo(
    () => ({
      poolId,
      trancheId,
      asset,
      share,
      pricePerShare,
      priceLastUpdated,
      totalAssets,
      convertToShares,
      convertToAssets,
      maxDeposit,
      maxMint,
      maxWithdraw,
      maxRedeem,
      isPermissioned,
      pendingDepositRequest,
      claimableDepositRequest,
      pendingRedeemRequest,
      claimableRedeemRequest,
      pendingCancelDepositRequest,
      claimableCancelDepositRequest,
      pendingCancelRedeemRequest,
      claimableCancelRedeemRequest,
      fetchBatchData, // Expose batch fetch for convenience
    }),
    [
      poolId,
      trancheId,
      asset,
      share,
      pricePerShare,
      priceLastUpdated,
      totalAssets,
      convertToShares,
      convertToAssets,
      maxDeposit,
      maxMint,
      maxWithdraw,
      maxRedeem,
      isPermissioned,
      pendingDepositRequest,
      claimableDepositRequest,
      pendingRedeemRequest,
      claimableRedeemRequest,
      pendingCancelDepositRequest,
      claimableCancelDepositRequest,
      pendingCancelRedeemRequest,
      claimableCancelRedeemRequest,
      fetchBatchData,
    ]
  );
}
