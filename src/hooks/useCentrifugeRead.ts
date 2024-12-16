import { useMemo, useCallback } from "react";
import { useSingleCallResult, useSingleContractMultipleCalls, useSingleContractMultipleData } from "@/lib/hooks/multicall";
import { useERC7540VaultContract } from "./useContract";

/**
 * Hook to interact with the read functions of the ERC7540Vault contract.
 * @param vaultAddress Address of the ERC7540Vault contract
 */
export function useERC7540VaultRead(vaultAddress: string, chainId: number) {
  const contract = useERC7540VaultContract(vaultAddress, false);

  // --- Individual Function Calls ---
  const poolId = useSingleCallResult(contract, "poolId", []);
  const trancheId = useSingleCallResult(contract, "trancheId", []);
  const asset = useSingleCallResult(contract, "asset", []);
  const share = useSingleCallResult(contract, "share", []);
  const pricePerShare = useSingleCallResult(contract, "pricePerShare", []);
  const priceLastUpdated = useSingleCallResult(contract, "priceLastUpdated", []);
  const totalAssets = useSingleCallResult(contract, "totalAssets", []);

  // --- Batch Fetch using Single Contract Multiple Data ---
  const fetchBatchData = useSingleContractMultipleCalls(
    contract,
    ["poolId", "trancheId", "asset", "share", "pricePerShare", "priceLastUpdated", "totalAssets"],
    []
  );

  // --- Dynamic Functions Wrapped with useCallback ---
  const convertToShares = useCallback(
    (assets: string) => useSingleCallResult(contract, "convertToShares", [assets]),
    [contract]
  );

  const convertToAssets = useCallback(
    (shares: string) => useSingleCallResult(contract, "convertToAssets", [shares]),
    [contract]
  );

  const maxDeposit = useCallback(
    (controller: string) => useSingleCallResult(contract, "maxDeposit", [controller]),
    [contract]
  );

  const maxMint = useCallback(
    (controller: string) => useSingleCallResult(contract, "maxMint", [controller]),
    [contract]
  );

  const maxWithdraw = useCallback(
    (controller: string) => useSingleCallResult(contract, "maxWithdraw", [controller]),
    [contract]
  );

  const maxRedeem = useCallback(
    (controller: string) => useSingleCallResult(contract, "maxRedeem", [controller]),
    [contract]
  );

  const isPermissioned = useCallback(
    (controller: string) => useSingleCallResult(contract, "isPermissioned", [controller]),
    [contract]
  );

  const pendingDepositRequest = useCallback(
    (controller: string) => useSingleCallResult(contract, "pendingDepositRequest", [0, controller]),
    [contract]
  );

  const claimableDepositRequest = useCallback(
    (controller: string) => useSingleCallResult(contract, "claimableDepositRequest", [0, controller]),
    [contract]
  );

  const pendingRedeemRequest = useCallback(
    (controller: string) => useSingleCallResult(contract, "pendingRedeemRequest", [0, controller]),
    [contract]
  );

  const claimableRedeemRequest = useCallback(
    (controller: string) => useSingleCallResult(contract, "claimableRedeemRequest", [0, controller]),
    [contract]
  );

  const pendingCancelDepositRequest = useCallback(
    (controller: string) =>
      useSingleCallResult(contract, "pendingCancelDepositRequest", [0, controller]),
    [contract]
  );

  const claimableCancelDepositRequest = useCallback(
    (controller: string) =>
      useSingleCallResult(contract, "claimableCancelDepositRequest", [0, controller]),
    [contract]
  );

  const pendingCancelRedeemRequest = useCallback(
    (controller: string) =>
      useSingleCallResult(contract, "pendingCancelRedeemRequest", [0, controller]),
    [contract]
  );

  const claimableCancelRedeemRequest = useCallback(
    (controller: string) =>
      useSingleCallResult(contract, "claimableCancelRedeemRequest", [0, controller]),
    [contract]
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
      fetchBatchData,
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
    ]
  );
}
