// import { useCallback, useMemo } from "react";

// import { MaxUint256 } from "@ethersproject/constants";
// import type { TransactionResponse } from "@ethersproject/providers";

// import { useERC20TokenContract } from "@/hooks/useContract";

// import { useTokenAllowance } from "../hooks/useTokenAllowance";
// import { useCalculateGasMargin } from "@/utils/calculateGasMargin";
// import { BigNumber } from "@ethersproject/bignumber";
// import { useAccount } from "@/hooks/useAccount";

// export enum ApprovalState {
//   UNKNOWN = "UNKNOWN",
//   NOT_APPROVED = "NOT_APPROVED",
//   PENDING = "PENDING",
//   APPROVED = "APPROVED",
// }


// function useApprovalStateForSpender(
//   amountToApprove: BigNumber | undefined,
//   spender: string | undefined,
//   tokenAddress: string | undefined,
//   useIsPendingApproval: (tokenAddress: string, spender?: string) => boolean,
// ): ApprovalState {
//   const { address: account } = useAccount();
// //@ts-expect-error
//   const { allowance, isFetching } = useTokenAllowance(tokenAddress, account, spender);
// //@ts-expect-error
  
//   const pendingApproval = useIsPendingApproval(tokenAddress, spender);

//   return useMemo(() => {
//     if (!amountToApprove || !spender || !tokenAddress) {
//       return ApprovalState.UNKNOWN;
//     }

//     if (isFetching || allowance === undefined) {
//       return ApprovalState.UNKNOWN;
//     }

//     return allowance.lt(amountToApprove)
//       ? pendingApproval
//         ? ApprovalState.PENDING
//         : ApprovalState.NOT_APPROVED
//       : ApprovalState.APPROVED;
//   }, [amountToApprove, pendingApproval, spender, allowance, tokenAddress, isFetching]);
// }

// export function useApproval(
//   amountToApprove: BigNumber,
//   spender: string,
//   tokenAddress: string,
//   useIsPendingApproval: (tokenAddress?: string, spender?: string) => boolean,
// ): [
//   ApprovalState,
//   () => Promise<
//     | {
//         response: TransactionResponse;
//         tokenAddress: string;
//         spenderAddress: string;
//         amount: BigNumber;
//       }
//     | undefined
//   >,
// ] {
//   const { chainId } = useAccount();

//   const approvalState = useApprovalStateForSpender(
//     amountToApprove,
//     spender,
//     tokenAddress,
//     useIsPendingApproval,
//   );

//   const tokenContract = useERC20TokenContract(tokenAddress, true);

//   const approve = useCallback(async () => {
//     function logFailure(error: Error | string): undefined {
//       // logger.error("useApproval", error, {
//       //   tokenAddress,
//       //   spender,
//       //   amountToApprove: amountToApprove?.toString(),
//       //   chainId,
//       // });
//       return;
//     }

//     if (approvalState !== ApprovalState.NOT_APPROVED) {
//       return logFailure("approve was called unnecessarily");
//     } else if (!chainId) {
//       return logFailure("no chainId");
//     } else if (!tokenAddress) {
//       return logFailure("no token address");
//     } else if (!tokenContract) {
//       return logFailure("token contract is null");
//     } else if (!amountToApprove) {
//       return logFailure("missing amount to approve");
//     } else if (!spender) {
//       return logFailure("no spender");
//     }

//     let useExact = false;
//     const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
//       useExact = true;
//       return tokenContract.estimateGas.approve(spender, amountToApprove);
//     });
//     const {calculateGasMargin} = useCalculateGasMargin()
//     return tokenContract
//       .approve(spender, useExact ? amountToApprove : MaxUint256, {
//         gasLimit: calculateGasMargin(new BigNumber(estimatedGas),10),
//       })
//       .then((response) => {
//         // logger.info("Approval transaction submitted", {
//         //   tokenAddress,
//         //   spender,
//         //   chainId,
//         // });

//         return {
//           response,
//           tokenAddress,
//           spenderAddress: spender,
//           amount: amountToApprove,
//         };
//       })
//       .catch((error: Error) => {
//         logFailure(error);
//         throw error;
//       });
//   }, [approvalState, tokenContract, tokenAddress, amountToApprove, spender, chainId]);

//   return [approvalState, approve];
// }
