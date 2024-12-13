import { useCallback, useState } from "react";

import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import type { Web3Provider } from "@ethersproject/providers";

import { useERC20TokenContract } from "./useContract";

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

/**
 * Hook to check and approve ERC20 token allowances.
 * @param amountToApprove - Amount to be approved.
 * @param spender - Spender address.
 * @param tokenAddress - Token contract address.
 * @returns [approvalState, approveCallback]
 */
export function useApproveCallback(
  amountToApprove: BigNumber,
  spender: string,
  tokenAddress: string,
  provider: Web3Provider,
): [ApprovalState, () => Promise<void>] {
  const [approvalState, setApprovalState] = useState<ApprovalState>(ApprovalState.UNKNOWN);
  const erc20Contract = useERC20TokenContract(tokenAddress, true);
  // Function to check current allowance
  const checkAllowance = useCallback(async () => {
    if (!provider || !spender || !tokenAddress || !amountToApprove) {
      setApprovalState(ApprovalState.UNKNOWN);
      return;
    }

    try {
      const signer = provider.getSigner();

      const owner = await signer.getAddress();
      const currentAllowance: BigNumber = await erc20Contract.allowance(owner, spender);

      if (currentAllowance.gte(amountToApprove)) {
        setApprovalState(ApprovalState.APPROVED);
      } else {
        setApprovalState(ApprovalState.NOT_APPROVED);
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
      setApprovalState(ApprovalState.UNKNOWN);
    }
  }, []);

  // Function to send approval transaction
  const approveCallback = useCallback(async () => {
    if (!provider || !spender || !tokenAddress || !amountToApprove) {
      console.error("Missing required parameters for approval");
      return;
    }

    try {
      setApprovalState(ApprovalState.PENDING);

      const signer = provider.getSigner();
      const erc20Contract = new Contract(
        tokenAddress,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer,
      );

      const tx = await erc20Contract.approve(spender, amountToApprove);
      await tx.wait();

      setApprovalState(ApprovalState.APPROVED);
    } catch (error) {
      console.error("Approval transaction failed:", error);
      setApprovalState(ApprovalState.NOT_APPROVED);
    }
  }, [provider, spender, tokenAddress, amountToApprove]);

  // Automatically check allowance on mount/update
  useCallback(() => {
    checkAllowance();
  }, [checkAllowance]);

  return [approvalState, approveCallback];
}
