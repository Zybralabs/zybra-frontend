// import { useMemo, useCallback } from "react";
// import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";
// import { useERC7540VaultContract } from "./useContract";

// /**
//  * Hook to interact with the read functions of the ERC7540Vault contract.
//  * @param vaultAddress Address of the ERC7540Vault contract
//  */
// export function useERC7540VaultRead(vaultAddress: string, chainId: number) {
//   const contract = useERC7540VaultContract(vaultAddress, false, chainId);

//   // Memoize the fallback contract
//   const safeContract = useMemo(() => contract || { callStatic: {}, estimateGas: {} }, [contract]);

//   // --- Individual Function Calls ---
//   const poolId = useSingleCallResult(safeContract, "poolId", []);
//   const trancheId = useSingleCallResult(safeContract, "trancheId", []);
//   const asset = useSingleCallResult(safeContract, "asset", []);
//   const share = useSingleCallResult(safeContract, "share", []);
//   const pricePerShare = useSingleCallResult(safeContract, "pricePerShare", []);
//   const priceLastUpdated = useSingleCallResult(safeContract, "priceLastUpdated", []);
//   const totalAssets = useSingleCallResult(safeContract, "totalAssets", []);

//   // --- Batch Fetch using Single Contract Multiple Data ---
//   const fetchBatchData = useSingleContractMultipleData(
//     safeContract,
//     ["poolId", "trancheId", "asset", "share", "pricePerShare", "priceLastUpdated", "totalAssets"],
//     []
//   );

//   // --- Dynamic Functions Wrapped with useCallback ---
//   const convertToShares = useCallback(
//     (assets: string) => useSingleCallResult(safeContract, "convertToShares", [assets]),
//     [safeContract]
//   );

//   const convertToAssets = useCallback(
//     (shares: string) => useSingleCallResult(safeContract, "convertToAssets", [shares]),
//     [safeContract]
//   );

//   const maxDeposit = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "maxDeposit", [controller]),
//     [safeContract]
//   );

//   const maxMint = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "maxMint", [controller]),
//     [safeContract]
//   );

//   const maxWithdraw = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "maxWithdraw", [controller]),
//     [safeContract]
//   );

//   const maxRedeem = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "maxRedeem", [controller]),
//     [safeContract]
//   );

//   const isPermissioned = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "isPermissioned", [controller]),
//     [safeContract]
//   );

//   const pendingDepositRequest = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "pendingDepositRequest", [0, controller]),
//     [safeContract]
//   );

//   const claimableDepositRequest = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "claimableDepositRequest", [0, controller]),
//     [safeContract]
//   );

//   const pendingRedeemRequest = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "pendingRedeemRequest", [0, controller]),
//     [safeContract]
//   );

//   const claimableRedeemRequest = useCallback(
//     (controller: string) => useSingleCallResult(safeContract, "claimableRedeemRequest", [0, controller]),
//     [safeContract]
//   );

//   const pendingCancelDepositRequest = useCallback(
//     (controller: string) =>
//       useSingleCallResult(safeContract, "pendingCancelDepositRequest", [0, controller]),
//     [safeContract]
//   );

//   const claimableCancelDepositRequest = useCallback(
//     (controller: string) =>
//       useSingleCallResult(safeContract, "claimableCancelDepositRequest", [0, controller]),
//     [safeContract]
//   );

//   const pendingCancelRedeemRequest = useCallback(
//     (controller: string) =>
//       useSingleCallResult(safeContract, "pendingCancelRedeemRequest", [0, controller]),
//     [safeContract]
//   );

//   const claimableCancelRedeemRequest = useCallback(
//     (controller: string) =>
//       useSingleCallResult(safeContract, "claimableCancelRedeemRequest", [0, controller]),
//     [safeContract]
//   );

//   return useMemo(
//     () => ({
//       poolId,
//       trancheId,
//       asset,
//       share,
//       pricePerShare,
//       priceLastUpdated,
//       totalAssets,
//       convertToShares,
//       convertToAssets,
//       maxDeposit,
//       maxMint,
//       maxWithdraw,
//       maxRedeem,
//       isPermissioned,
//       pendingDepositRequest,
//       claimableDepositRequest,
//       pendingRedeemRequest,
//       claimableRedeemRequest,
//       pendingCancelDepositRequest,
//       claimableCancelDepositRequest,
//       pendingCancelRedeemRequest,
//       claimableCancelRedeemRequest,
//       fetchBatchData, // Expose batch fetch for convenience
//     }),
//     [
//       poolId,
//       trancheId,
//       asset,
//       share,
//       pricePerShare,
//       priceLastUpdated,
//       totalAssets,
//       fetchBatchData,
//       convertToShares,
//       convertToAssets,
//       maxDeposit,
//       maxMint,
//       maxWithdraw,
//       maxRedeem,
//       isPermissioned,
//       pendingDepositRequest,
//       claimableDepositRequest,
//       pendingRedeemRequest,
//       claimableRedeemRequest,
//       pendingCancelDepositRequest,
//       claimableCancelDepositRequest,
//       pendingCancelRedeemRequest,
//       claimableCancelRedeemRequest,
//     ]
//   );
// }
