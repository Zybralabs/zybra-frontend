import { useCallback, useState, useEffect } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { useERC20TokenContract } from "./useContract";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";
import { WalletType } from "@/constant/account/enum";
import { useUserAccount } from "@/context/UserAccountContext";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import erc20ABI from "@/abis/ERC20.json";
import { useSingleCallResult } from "@/lib/hooks/multicall";
import type { TransactionData } from "@/types";
import { accountType, accountClientOptions as opts } from "@/config";
import { TransactionStatus } from "@/constant/transactionStatus";

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

/**
 * Enhanced hook to check and approve ERC20 token allowances for both Web3 and minimal wallets.
 */
export function useApproveCallback(
  amountToApprove: BigNumber,
  owner: string | undefined,
  spender: string | undefined,
  tokenAddress: string | undefined,
  walletType: WalletType | null,
  tokenSymbol : string
) {
  // State management
  const [approvalState, setApprovalState] = useState<ApprovalState>(ApprovalState.UNKNOWN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<{ message?: string; hash?: string } | null>(null);

  // Hooks
  const chainId = useChainId();
  const erc20Contract = useERC20TokenContract(tokenAddress, true);
  const { address,addTransaction } = useUserAccount();

  // Wagmi hooks for Web3 transactions
  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending,
    isError: isWriteError,
    isSuccess,
  } = useWriteContract();

  const {
    data: txReceipt,
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({
    chainId: chainId,
    hash: hash as `0x${string}` | undefined,
    confirmations: 2,
  });
  // Use centralized smart account client with gas sponsorship (safe version)
  const {
    client,
    isGasSponsored,
    isClientReady,
    executeTransaction,
    executeSponsoredTransaction,
    sendUserOperationResult,
    isSendingUserOperation,
    sendUserOperationError: isSendUserOperationError,
  } = useSmartAccountClientSafe();

  // Check current allowance
  //@ts-ignore
  const allowanceResult = useSingleCallResult(erc20Contract, "allowance", [owner, spender]);

  useEffect(() => {
    if (allowanceResult?.result?.[0] && amountToApprove) {
      const currentAllowance = allowanceResult.result[0];
      setApprovalState(
        currentAllowance.gte(amountToApprove)
          ? ApprovalState.APPROVED
          : ApprovalState.NOT_APPROVED
      );
    }
  }, [allowanceResult, amountToApprove]);

  // Main approval callback
  const approveCallback = useCallback(async (): Promise<void> => {
    if (!spender || !tokenAddress || !amountToApprove) {
      throw new Error("Missing required parameters for approval");
    }

    setLoading(true);
    setError(null);
    setReceipt(null);
    let transactionData: TransactionData = {
      type: 'zybra',
      amount: Number(amountToApprove),
      status: TransactionStatus.APPROVAL,
      metadata: {
        spender,
        assetAddress: tokenAddress,
        owner: owner || address,
        assetType: "assets",
        assetSymbol: tokenSymbol || 'Unknown Token'
      }
    };
    try {
      if (walletType === WalletType.WEB3) {
        // Web3 wallet approval using wagmi
       const tx =  await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: 'approve',
          args: [spender, amountToApprove],

        },
      );
        if (tx) {
          // Set state to pending while waiting for confirmation
          setApprovalState(ApprovalState.PENDING);

          transactionData = {
            ...transactionData,
            tx_hash: tx
          };

          await addTransaction(transactionData);

          // Store the transaction hash for receipt tracking
          setReceipt({ hash: tx });

          // The receipt will be tracked by the useWaitForTransactionReceipt hook
          // We'll update the approval state when the receipt is available
        }

      } else if (walletType === WalletType.MINIMAL) {
        // Check if client is ready first
        if (!isClientReady) {
          throw new Error("Smart account client is not ready. Please ensure your wallet is connected and try again.");
        }

        if (!executeTransaction) {
          throw new Error("Transaction execution function is not available. Please try again.");
        }

        // Minimal wallet approval using Account Kit
        if (!erc20Contract) {
          throw new Error("ERC20 contract not initialized");
        }

        const data = erc20Contract.interface.encodeFunctionData("approve", [
          spender,
          amountToApprove,
        ]) as `0x${string}`;

        const target = tokenAddress as `0x${string}`;
        const value = 0n;

        // Set state to pending while processing
        setApprovalState(ApprovalState.PENDING);

        // Use the new executeTransaction method with proper gas estimation
        const userOpResult = await executeTransaction({
          target,
          data,
          value,
        });

        console.log("Approval user operation result:", userOpResult);

        // The userOpResult should contain the transaction hash
        if (userOpResult && userOpResult.hash) {
          transactionData = {
            ...transactionData,
            tx_hash: userOpResult.hash
          };

          // Add transaction to API
          await addTransaction(transactionData);

          // Set receipt with hash for UI updates
          setReceipt({
            hash: userOpResult.hash,
            message: userOpResult.hash
          });

          // Set approval state to approved
          setApprovalState(ApprovalState.APPROVED);
        } else {
          throw new Error("User operation failed - no transaction hash received");
        }
      }
    } catch (err) {
      console.error("Approval transaction failed:", err);
      setApprovalState(ApprovalState.NOT_APPROVED);

      const errorMessage = (err as Error).message || "Approval failed";

      // Create error with enhanced message for Account Kit gas issues
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setError(new Error(errorMessage)); // Keep the original gas fee message
      } else {
        setError(err instanceof Error ? err : new Error("Approval failed"));
      }
    } finally {
      setLoading(false);
    }
  }, [spender, tokenAddress, amountToApprove, tokenSymbol, owner, address, walletType, writeContractAsync, addTransaction, erc20Contract, executeTransaction, isClientReady]);

  // Effect to handle Account Kit transaction results (backup)
  useEffect(() => {
    if (sendUserOperationResult && sendUserOperationResult.hash && walletType === WalletType.MINIMAL) {
      console.log("Account Kit approval transaction completed:", sendUserOperationResult);
      // Update receipt with the final transaction hash if not already set
      if (!receipt || receipt.hash !== sendUserOperationResult.hash) {
        setReceipt({
          hash: sendUserOperationResult.hash,
          message: sendUserOperationResult.hash
        });
        setApprovalState(ApprovalState.APPROVED);
      }
    }
  }, [sendUserOperationResult, walletType, receipt]);

  // Effect to update approval state when Web3 transaction receipt is available
  useEffect(() => {
    if (txReceipt && hash) {
      // Transaction confirmed successfully
      setApprovalState(ApprovalState.APPROVED);
      setReceipt({ hash: hash, message: hash });
    }
  }, [txReceipt, hash]);

  // Effect to handle transaction errors
  useEffect(() => {
    if (isReceiptError && receiptError) {
      setError(receiptError instanceof Error ? receiptError : new Error("Transaction failed"));
      setApprovalState(ApprovalState.NOT_APPROVED);
    }
  }, [isReceiptError, receiptError]);

  // Combine all loading and error states
  const isLoading = loading || isPending || isSendingUserOperation;
  const finalError = error || writeError || isSendUserOperationError || receiptError;

  return {
    approvalState,
    approveCallback,
    loading: isLoading,
    error: finalError,
    receipt: receipt,
  };
}