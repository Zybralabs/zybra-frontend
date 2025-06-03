import { useMemo, useCallback, useState } from "react";
import {
  useSingleCallResult,
  useSingleContractMultipleCalls,
} from "@/lib/hooks/multicall";
import { useCentrifugeVaultContract, useContract, useERC7540VaultContract } from "./useContract";
import { useUserAccount } from "@/context/UserAccountContext";
import type { Contract } from "ethers";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { TransactionData } from "@/types";
import { WalletType } from "@/constant/account/enum";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { CENTRIFUGE_VAULT_ADDRESS } from "@/constant/addresses";
import ERC7540ABI from "../abis/ERC7540.json";
import CentrifugeVaultABI from "../abis/CentrifugeZybraVault.json";
import { accountType , accountClientOptions as opts } from "@/config";
import { toWei } from "./formatting";

export function useCentrifugeVault(chainId: number, vaultAddress: string = "0x87f925157B1F87accdE9C973DFdbC60D33aC2bBD") {
  const centrifugeVaultContract = useCentrifugeVaultContract(true, chainId) as Contract | null;
  const Erc7540Vault = useERC7540VaultContract(vaultAddress, false) as Contract | null;
  const { walletType, address, addTransaction } = useUserAccount();
  const { client } = useSmartAccountClient({
      type: accountType,
      opts,
    });
  
  const {
    sendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    error: isSendUserOperationError,
  } = useSendUserOperation({ client: client, waitForTxn: true });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending,
    isError: isWriteError,
    isSuccess
  } = useWriteContract();

  const {
    data: txReceipt,
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({
    chainId:chainId,
    hash
  });

  const handleTransaction = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      setLoading(true);
      setError(null);
      setReceipt(null);
      let transactionData: TransactionData = {
        type: "pools",
        amount: Number(args[0]), // Convert Wei to normal number for API
        status: methodName,
        metadata: {
          chainId,
          walletType,
          assetAddress:CENTRIFUGE_VAULT_ADDRESS[chainId],
          assetType: "pools",
          assetSymbol:"ZybraTRX1"
        }
      };
      const contractArgs = args.slice(0, -1);
      const getZRUSDBorrowed = () => {
        switch (methodName) {
          case 'deposit':
            return Number(args[1] || 0);

          case 'withdraw':
            return Number(args[2] || 0);

          case 'repyingDebt':
            return Number(args[3] || 0);


          default:
            return 0;
        }
      };
      try {
        if (walletType === WalletType.WEB3) {
          const tx = await writeContractAsync({
            address: CENTRIFUGE_VAULT_ADDRESS[chainId] as `0x${string}`,
            abi: CentrifugeVaultABI,
            functionName: methodName,
            args,
            ...overrides
          });
          console.log("____________testtest23232")
          console.log({ txReceipt }, tx)

          // Wait for transaction receipt
          if (tx) {
            transactionData = {
              ...transactionData,
              tx_hash: tx,
              
              ZRUSD_borrowed: getZRUSDBorrowed()
            };
            setReceipt(tx)
            // Add transaction to API
            await addTransaction(transactionData);
            return txReceipt;
          }
        } else if (walletType === WalletType.MINIMAL) {
          const iface = centrifugeVaultContract?.interface;
          const data = iface?.encodeFunctionData(methodName, contractArgs) as `0x${string}`;
          const target = await centrifugeVaultContract?.getAddress() as `0x${string}`;
          const value = overrides.value || 0n;

          const userOp = await sendUserOperationAsync({
            uo: { target, data, value: value ? BigInt(value) : 0n },
          });
          const result = sendUserOperationResult;
          if (sendUserOperationResult && userOp.hash) {
            if (!address) return;

            // Update transaction data with success info
            transactionData = {
              ...transactionData,

              tx_hash: sendUserOperationResult.hash,
              ZRUSD_borrowed: getZRUSDBorrowed()
            };

            // Add transaction to API
            await addTransaction(transactionData);
            if (result) {
              console.log(`User operation sent:`, result);
              setReceipt(result);
              setLoading(isSendingUserOperation);
              setError(isSendUserOperationError ? new Error(isSendUserOperationError.message) : null);
              return result;
            }

            throw new Error("User operation failed.");
          }
        }

      } catch (err) {
        console.error(`Error in transaction ${methodName}:`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [chainId, walletType, centrifugeVaultContract, writeContractAsync, txReceipt, hash, addTransaction, sendUserOperationResult, isSendingUserOperation, isSendUserOperationError],
  );


  
  const handleTransactionVault = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      setLoading(true);
      setError(null);
      setReceipt(null);
      let transactionData: TransactionData = {
        type: methodName,
        amount: Number(args[0]), // Convert Wei to normal number for API
        status: methodName,
        metadata: {
          chainId,
          walletType,
          assetAddress: vaultAddress as `0x${string}`,
          assetType:'pools',
          assetSymbol:"ZFI"
        }
      };
    
      try {
        if (walletType === WalletType.WEB3) {
          await writeContractAsync({
            address: vaultAddress as `0x${string}`,
            abi: ERC7540ABI,
            functionName: methodName,
            args,
            ...overrides
          });
          console.log("____________testtest23232",args)
          console.log({ txReceipt }, hash)

          // Wait for transaction receipt
          if (hash) {
            transactionData = {
              ...transactionData,
              tx_hash: hash,
              
              ZRUSD_borrowed: 0
            };

            // Add transaction to API
            await addTransaction(transactionData);
            return txReceipt;
          }
        } else if (walletType === WalletType.MINIMAL) {
          const iface = Erc7540Vault?.interface;
          const data = iface?.encodeFunctionData(methodName, args) as `0x${string}`;
          const target =  vaultAddress as `0x${string}`;
          const value = overrides.value || 0n;

          const userOp = await sendUserOperationAsync({
            uo: { target, data, value: value ? BigInt(value) : 0n },
          });
          const result = sendUserOperationResult;
          if (sendUserOperationResult && userOp.hash) {
            if (!address) return;

            // Update transaction data with success info
            transactionData = {
              ...transactionData,

              tx_hash: sendUserOperationResult.hash,
              ZRUSD_borrowed: 0
            };

            // Add transaction to API
            await addTransaction(transactionData);
            if (result) {
              console.log(`User operation sent:`, result);
              setReceipt(result);
              setLoading(isSendingUserOperation);
              setError(isSendUserOperationError ? new Error(isSendUserOperationError.message) : null);
              return result;
            }

            throw new Error("User operation failed.");
          }
        }

      } catch (err) {
        console.error(`Error in transaction ${methodName}:`, err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [chainId, walletType, vaultAddress, writeContractAsync, Erc7540Vault?.getFunction, Erc7540Vault?.interface, txReceipt, hash, addTransaction, sendUserOperationAsync, sendUserOperationResult, address, isSendingUserOperation, isSendUserOperationError],
  );

  const requestDeposit = useCallback(
    async (assetAmount: number, vaultAddress: any) => handleTransaction("requestDeposit", [toWei(assetAmount), vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const deposit = useCallback(
    async (vaultAddress: any,mintAmount: number) => handleTransaction("deposit", [vaultAddress, toWei(mintAmount)]),
    [handleTransaction, vaultAddress],
  );

  const requestWithdraw = useCallback(
    async (trancheAmount: number, onBehalfOf: string) =>
      handleTransaction("requestWithdraw", [toWei(trancheAmount), onBehalfOf, vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const withdraw = useCallback(
    async (vaultAddress: any) => handleTransaction("withdraw", [vaultAddress]),
    [handleTransaction, vaultAddress],
  );

  const setOperator = useCallback(
    async () => handleTransactionVault("setEndorsedOperator", [CENTRIFUGE_VAULT_ADDRESS[chainId], true]),
    [centrifugeVaultContract, handleTransaction],
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
    async (provider: string, ZRUSDAmount: number) =>
      handleTransaction("repayingDebt", [provider, vaultAddress, ZRUSDAmount]),
    [handleTransaction, vaultAddress],
  );


  // Converting the others to match:
  // const maxDepositResult = useSingleCallResult(centrifugeVaultContract, "maxDeposit", [vaultAddress]);
  // const maxRedeemResult = useSingleCallResult(centrifugeVaultContract, "maxRedeem", [vaultAddress]);
  // const collateralAssetPriceResult = useSingleCallResult(centrifugeVaultContract, "getCollateralAssetPrice", []);
  // const trancheAssetPriceResult = useSingleCallResult(centrifugeVaultContract, "getTrancheAssetPrice", [vaultAddress]);
  // const isVaultResult = useSingleCallResult(centrifugeVaultContract, "isVault", [vaultAddress]);
  const poolTotalCirculationResult = useSingleCallResult(centrifugeVaultContract, "getPoolTotalCirculation", []);
  // const getVaultTypeResult = useSingleCallResult(centrifugeVaultContract, 'getVaultType', []);
  const getAssetResult = useSingleCallResult(centrifugeVaultContract, 'getAsset', [vaultAddress]);



  // Price data
  const collateralAssetPriceResult = useSingleCallResult(centrifugeVaultContract, 'getCollateralAssetPrice', []);
  const trancheAssetPriceResult = useSingleCallResult(centrifugeVaultContract, 'getTrancheAssetPrice', [vaultAddress]);

  // Mapping data for deposits and assets
  const userDepReqVaultCollatAssetResult = useSingleCallResult(
    centrifugeVaultContract,
    'UserDepReqVaultCollatAsset',
    [vaultAddress, address]
  );
  const userVaultTrancheAssetResult = useSingleCallResult(
    centrifugeVaultContract,
    'UserVaultTrancheAsset',
    [vaultAddress, address]
  );


  const userTrancheAssetResult = useSingleCallResult(
    centrifugeVaultContract,
    "getUserTrancheAsset",
    address ? [vaultAddress, address] : [undefined]
  );
  const borrowedResult = useSingleCallResult(
    centrifugeVaultContract,
    "getBorrowed",
    [vaultAddress, address ]
  );


  const claimableDepositRequestResult = useSingleCallResult(
    Erc7540Vault,
    'claimableDepositRequest',
    address? [ 0 , address] : [undefined] // REQUEST_ID is always 0 in contract
  );

  const isOperator = useSingleCallResult(
    Erc7540Vault,
    'isOperator',
    address? [ CENTRIFUGE_VAULT_ADDRESS[chainId], address] : [undefined] // REQUEST_ID is always 0 in contract
  );

  const pendingDepositRequestResult = useSingleCallResult(
    Erc7540Vault,
    'pendingDepositRequest',
    address? [ 0 , address] : [undefined]
  );

  const pendingCancelDepositRequestResult = useSingleCallResult(
    Erc7540Vault,
    'pendingCancelDepositRequest',
    address? [ 0 , address] : [undefined]
  );

  // Fetch redeem request information
  const claimableRedeemRequestResult = useSingleCallResult(
    Erc7540Vault,
    'claimableRedeemRequest',
    address? [ 0 , address] : [undefined]
  );

  const onRedeemClaimableResult = useSingleCallResult(
    Erc7540Vault,
    'onRedeemClaimable',
    [address, 0, 0] // Assuming default values for assets and shares
  );


  // const batchDataResults = useSingleContractMultipleCalls(
  //   //@ts-ignore
  //   centrifugeVaultContract,
  //   [
  //     "maxDeposit",
  //     "maxRedeem",
  //     "getCollateralAssetPrice",
  //     "getTrancheAssetPrice",
  //     "isVault",
  //     "getPoolTotalCirculation",
  //     "getUserTrancheAsset",
  //     "getBorrowed",
  //   ],
  //   [
  //     [vaultAddress],
  //     [vaultAddress],
  //     [],
  //     [vaultAddress],
  //     [vaultAddress],
  //     [],
  //     [vaultAddress, address],
  //     [vaultAddress, address],
  //   ],
  // );
console.log({writeError},txReceipt)
  return {
    requestDeposit,
    deposit,
    setOperator,
    requestWithdraw,
    withdraw,
    cancelDepositRequest,
    cancelWithdrawRequest,
    claimCancelDepositRequest,
    addVault,
    removeVault,
    liquidation,
    repayingDebt,
    collateralAssetPriceResult:collateralAssetPriceResult?.result?.[0] ,
    trancheAssetPriceResult:trancheAssetPriceResult?.result?.[0] ,
    poolTotalCirculationResult:poolTotalCirculationResult?.result?.[0] ,
    userTrancheAssetResult:userTrancheAssetResult?.result?.[0] ,
    borrowedResult:borrowedResult?.result?.[0] ,
    // batchDataResults ,
    poolTotalCirculation: poolTotalCirculationResult?.result?.[0],
    // vaultType: getVaultTypeResult?.result?.[0],
    asset: getAssetResult?.result?.[0],

    // User data
    userTrancheAsset: userTrancheAssetResult?.result?.[0],
    borrowed: borrowedResult?.result?.[0],

    // Price data
    collateralAssetPrice: collateralAssetPriceResult?.result?.[0],
    trancheAssetPrice: trancheAssetPriceResult?.result?.[0],

    // Mapping data
    userDepReqVaultCollatAsset: userDepReqVaultCollatAssetResult?.result?.[0],
    userVaultTrancheAsset: userVaultTrancheAssetResult?.result?.[0],
    claimableDepositRequestResult: claimableDepositRequestResult?.result?.[0],
    pendingDepositRequestResult: pendingDepositRequestResult?.result?.[0],
    pendingCancelDepositRequestResult: pendingCancelDepositRequestResult?.result?.[0],
    claimableRedeemRequestResult: claimableRedeemRequestResult?.result?.[0],
    onRedeemClaimableResult: onRedeemClaimableResult?.result?.[0],
    isOperator:isOperator?.result?.[0],
    receipt :useMemo(()=> receipt || txReceipt,[receipt, txReceipt]) ,
    loading,
    error : useMemo(()=>writeError || error,[error, writeError]),
  };
}
