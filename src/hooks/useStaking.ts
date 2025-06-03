import { useMemo, useCallback, useState, useEffect } from "react";
import { useSingleCallResult } from "@/lib/hooks/multicall";
import { Contract } from "ethers";
import { useZFIStakingContract } from "./useContract";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { useUserAccount } from "@/context/UserAccountContext";
import { WalletType } from "@/constant/account/enum";
import { useTransactionAdder } from "@/state/transactions/hooks";
import {
 TransactionType,
 type CollectFeesStakingTransactionInfo,
 type DepositLiquidStakingTransactionInfo,
 type TransactionInfo,
 type WithdrawLiquidStakingTransactionInfo
} from "@/state/transactions/types";
import type { AbstractTransactionResponse, TransactionData } from "@/types";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ZfiStakingABI from "../abis/ZfiStaking.json";
import { ZFI_STAKING_ADDRESS, SupportedChainId } from "@/constant/addresses";
import { toWei } from "./formatting";
import { accountType , accountClientOptions as opts } from "@/config";


export function useZRUSDStaking(user: string, chainId: number) {
 // State management
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<Error | null>(null);
 const [receipt, setReceipt] = useState<any>(null);

 // Context and contracts
 const { walletType, address ,addTransaction} = useUserAccount();
 const stakingContract = useZFIStakingContract(true, chainId) as Contract | null;


 // Wagmi hooks for Web3 transactions
 const {
  writeContractAsync,
   data: hash,
   error: writeError,
   isPending,
   isError: isWriteError ,
   isSuccess
 } = useWriteContract();

 const {
   data: txReceipt,
   isError: isReceiptError,
   error: receiptError
 } = useWaitForTransactionReceipt({
   hash
 });

   const { client } = useSmartAccountClient({
       type: accountType,
       opts,
     });


 // Account Kit hooks for minimal wallet
 const {
  sendUserOperationAsync,
   sendUserOperationResult,
   isSendingUserOperation,
   error: isSendUserOperationError,
 } = useSendUserOperation({ client: client, waitForTxn: true });

 // Read contract data using multicall
 const pendingRewardResult = useSingleCallResult(stakingContract, "totalStaked", [undefined]);
 const totalStakedResult = useSingleCallResult(stakingContract, "totalStaked", [undefined]);
 const totalProfitDistributedResult = useSingleCallResult(stakingContract, "totalProfitDistributed", [undefined]);
 const stakerResult = useSingleCallResult(
  stakingContract,
  'stakers',
  [address]
);

 // Handle Account Kit transaction results
 useEffect(() => {
   if (sendUserOperationResult && sendUserOperationResult.hash && walletType === WalletType.MINIMAL) {
     console.log("Account Kit transaction completed:", sendUserOperationResult);
     // Update receipt with the final transaction hash if not already set
     if (!receipt || receipt !== sendUserOperationResult.hash) {
       setReceipt(sendUserOperationResult.hash);
     }
   }
 }, [sendUserOperationResult, walletType, receipt]);

 // Handle Web3 transaction receipts
 useEffect(() => {
   if (txReceipt && walletType === WalletType.WEB3) {
     console.log("Web3 transaction receipt:", txReceipt);
     // Update receipt with the transaction hash from the receipt
     if (!receipt || receipt !== txReceipt.transactionHash) {
       setReceipt(txReceipt.transactionHash);
     }
   }
 }, [txReceipt, walletType, receipt]);
 // Transaction info constructors
 const transactionInfoConstructors = useMemo(() => ({
   stake: (amount: number) => ({
     type: TransactionType.DEPOSIT_STAKING,
     amount,
   } as DepositLiquidStakingTransactionInfo),
   unstake: (amount: number) => ({
     type: TransactionType.WITHDRAW_STAKING,
     amount,
   } as WithdrawLiquidStakingTransactionInfo),
   withdrawReward: (amount: number) => ({
     type: TransactionType.COLLECT_FEES_STAKING,
     amount,
   } as CollectFeesStakingTransactionInfo),
 }), []);

 // Main transaction handler
 const handleTransaction = useCallback(
   async (methodName: keyof typeof transactionInfoConstructors, args: any[] = [undefined], overrides: any = {}) => {
     if (!stakingContract) {
       throw new Error("Staking contract is not connected.");
     }

     setLoading(true);
     setError(null);
     setReceipt(null);

     const transactionInfoConstructor = transactionInfoConstructors[methodName];
     if (!transactionInfoConstructor) {
       throw new Error(`Unsupported transaction type: ${methodName}`);
     }

     const transactionInfo = transactionInfoConstructor(Number(args[0]));
     try {

      let transactionData: TransactionData = {
        type: "zybra",
        amount: Number(args[0]), // Convert Wei to normal number for API
        status: methodName,
        metadata: {
          chainId,
          assetType:"Asset",
          assetAddress: ZFI_STAKING_ADDRESS[chainId as SupportedChainId],
          assetSymbol:"ZFI"
        }
      };
       if (walletType === WalletType.WEB3) {
         // Write contract using wagmi
        const tx =  await writeContractAsync({
           address: ZFI_STAKING_ADDRESS[chainId as SupportedChainId] as `0x${string}`,
           abi: ZfiStakingABI,
           functionName: methodName,
           args,
           ...overrides
         });

         console.log("Web3 transaction hash:", tx);

         // For Web3, we set the transaction hash immediately
         // The receipt will be handled by useWaitForTransactionReceipt
         if (tx) {
          transactionData = {
            ...transactionData,
            tx_hash: tx,
            ZRUSD_borrowed: methodName === 'stake' ? Number(args[0]) : 0
          };

          // Add transaction to API
          await addTransaction(transactionData);

          // Set receipt with the transaction hash for immediate feedback
          setReceipt(tx);
          return { success: true, receipt: tx };
        }

         }

        else if (walletType === WalletType.MINIMAL) {
         // Encode function data for user operation
         const iface = stakingContract.interface;
         const data = iface.encodeFunctionData(methodName, args) as `0x${string}`;
         console.log({stakingContract})
         //@ts-ignore
         const target =  stakingContract?.address as `0x${string}`;
         const value = overrides.value || 0n;

         // Send user operation and wait for result
         const userOpResult = await sendUserOperationAsync({
           uo: {
             target,
             data: data as `0x${string}`,
             value: value ? BigInt(value) : 0n
           },
         });

         console.log("User operation result:", userOpResult);

         // The userOpResult should contain the transaction hash
         if (userOpResult && userOpResult.hash) {
          transactionData = {
            ...transactionData,
            tx_hash: userOpResult.hash,
            ZRUSD_borrowed: methodName === 'stake' ? Number(args[0]) : undefined
          };

          // Add transaction to API
          await addTransaction(transactionData);

          // Set receipt with the transaction hash
          setReceipt(userOpResult.hash);
          return { success: true, receipt: userOpResult.hash };
         } else {
           throw new Error("User operation failed - no transaction hash received");
         }
       }

     } catch (err) {
       console.error(`Error in transaction ${methodName}:`, err);
       setError(err instanceof Error ? err : new Error("Transaction failed"));
       return { success: false, error: err };
     } finally {
       setLoading(false);
     }
   },
   [
     stakingContract,
     walletType,
     chainId,
     transactionInfoConstructors,
     writeContractAsync,
     addTransaction,
     sendUserOperationAsync
   ]
 );

 // Convenience methods
 const stake = useCallback(
   async (amount: number) => handleTransaction("stake", [toWei(amount)]),
   [handleTransaction]
 );

 const unstake = useCallback(
   async (amount: number) => handleTransaction("unstake", [toWei(amount)]),
   [handleTransaction]
 );

 const withdrawReward = useCallback(
   async () => handleTransaction("withdrawReward"),
   [handleTransaction]
 );

 // Combine all loading and error states
 const isLoading = loading || isPending || isSendingUserOperation;
 const finalError = error || writeError  || isSendUserOperationError;

 return {
   // Action methods
   stake,
   unstake,
   withdrawReward,
   stakerResult: stakerResult.result,
   // Status
   loading: isLoading,
   error: finalError,
   receipt: hash || receipt || txReceipt?.transactionHash,
   setError,

   // Contract data
   pendingReward: pendingRewardResult.result,
   totalStaked: totalStakedResult.result,
   totalProfitDistributed: totalProfitDistributedResult.result,
 };
}