import { useCallback, useMemo } from "react";
import { MaxUint256 } from "@ethersproject/constants";
import type { TransactionResponse } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";

import { useERC20TokenContract } from "@/hooks/useContract";
import { useAccount } from "@/hooks/useAccount";
import { useTokenAllowance } from "./useTokenAllowance";
import { useCalculateGasMargin } from "@/utils/calculateGasMargin";

export enum ApprovalState {
  UNKNOWN = "UNKNOWN",
  NOT_APPROVED = "NOT_APPROVED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
}

/**
 * Determines the approval state for a spender.
 */
function useApprovalStateForSpender(
  amountToApprove: BigNumber | undefined,
  spender: string | undefined,
  tokenAddress: string,
  useIsPendingApproval: (tokenAddress: string, spender?: string) => boolean,
): ApprovalState {
  const { address: account } = useAccount();
  const { allowance, isFetching } = useTokenAllowance(tokenAddress, account, spender);

  const pendingApproval = useIsPendingApproval(tokenAddress || "", spender);

  return useMemo(() => {
    if (!amountToApprove || !spender || !tokenAddress) {
      return ApprovalState.UNKNOWN;
    }

    if (isFetching || allowance === undefined) {
      return ApprovalState.UNKNOWN;
    }

    return allowance.lt(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED;
  }, [amountToApprove, pendingApproval, spender, allowance, tokenAddress, isFetching]);
}

/**
 * Hook for handling ERC20 approvals.
 */
export function useApproval(
    amountToApprove: BigNumber,
    spender: string,
    tokenAddress: string,
    useIsPendingApproval: (tokenAddress?: string, spender?: string) => boolean,
  ): [
    ApprovalState,
    () => Promise<{
      response: TransactionResponse;
      tokenAddress: string;
      spenderAddress: string;
      amount: BigNumber;
    } | undefined>,
  ] {
    const { chainId } = useAccount();
  
    const approvalState = useApprovalStateForSpender(
      amountToApprove,
      spender,
      tokenAddress,
      useIsPendingApproval,
    );
  
    const tokenContract = useERC20TokenContract(tokenAddress, true);
  
    const approve = useCallback(async () => {
      if (approvalState !== ApprovalState.NOT_APPROVED) {
        throw new Error("Approval is not needed.");
      }
      if (!chainId) {
        throw new Error("No chainId detected.");
      }
      if (!tokenAddress) {
        throw new Error("No token address provided.");
      }
      if (!tokenContract) {
        throw new Error("Token contract is not initialized.");
      }
      if (!amountToApprove) {
        throw new Error("No amount to approve.");
      }
      if (!spender) {
        throw new Error("No spender address provided.");
      }
  
      let useExact = false;
  
      try {
        const estimatedGas = await tokenContract.estimateGas
          .approve(spender, MaxUint256)
          .catch(() => {
            useExact = true;
            return tokenContract.estimateGas.approve(spender, amountToApprove);
          });
      
        // Ensure the utility function is called correctly
        const calculateGasMargin = useCalculateGasMargin(); // Get the calculateGasMargin function
        const gasLimitWithMargin = await calculateGasMargin(BigNumber.from(estimatedGas), 5);
      
        const response = await tokenContract.approve(spender, useExact ? amountToApprove : MaxUint256, {
          gasLimit: gasLimitWithMargin,
        });
      
        return {
          response,
          tokenAddress,
          spenderAddress: spender,
          amount: amountToApprove,
        };
      } catch (error) {
        console.error("Approval transaction failed:", error);
        throw error;
      }
      
    }, [approvalState, tokenContract, tokenAddress, amountToApprove, spender, chainId]);
  
    return [approvalState, approve];
  }
