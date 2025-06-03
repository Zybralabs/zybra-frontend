import { useMemo, useCallback, useState } from "react";
import { useDotVc2, useSwarmVaultContract } from "./useContract";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { Contract, ethers } from "ethers";
import { WalletType } from "@/constant/account/enum";
import { useUserAccount } from "@/context/UserAccountContext";
import { useSingleCallResult, useSingleContractMultipleData } from "@/lib/hooks/multicall";
import SwarmVaultBaseABI from "../abis/SwarmZybraVault.json";
import { BigNumber } from "@ethersproject/bignumber";

import {
  AssetType,
  OfferPricingType,
  PercentageType,
  TakingOfferType,
  type AbstractTransactionResponse,
  type Asset,
  type AssetPrice,
  type OfferPrice,
  type OfferStruct,
  type TransactionData,
} from "@/types";
import {
  STOCK_PRICE_FEED_ID,
  SupportedChainId,
  SWARM_VAULT_ADDRESS,
  USDC_ADDRESS,
} from "@/constant/addresses";
import { useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { fromWei, toWei } from "./formatting";
import { TakingOfferTypeEnum, type TradingPair } from "@/components/MainOffer/types/trading";
import { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import { accountType, accountClientOptions as opts } from "@/config";

// ====== HELPER FUNCTIONS (Extracted from main hook) ======

/**
 * Creates an asset object with standard parameters
 */
export function createAsset({
  assetType = AssetType.ERC20,
  assetAddress,
  amount,
  tokenId = 0,
  priceFeedAddress = "0x0000000000000000000000000000000000000000",
  maxPrice = 0,
  minPrice = 0,
}: {
  assetType?: AssetType;
  assetAddress: string;
  amount: BigNumber;
  tokenId?: number;
  priceFeedAddress?: string;
  maxPrice?: number;
  minPrice?: number;
}): Asset {
  return {
    assetType,
    assetAddress,
    amount,
    tokenId,
    assetPrice: {
      priceFeedAddress: priceFeedAddress || "0x0000000000000000000000000000000000000000",
      offerMaximumPrice: maxPrice || 0,
      offerMinimumPrice: minPrice || 0,
    },
  };
}

/**
 * Creates an offer structure with standard parameters
 */
export function createOfferStruct({
  takingOfferType = TakingOfferType.PartialOffer,
  unitPrice,
  percentage = "0",
  percentageType = PercentageType.NoType,
  specialAddresses = [],
  authorizationAddresses = [],
  expiryTimestamp,
  timelockPeriod = "0",
  terms = "",
  commsLink = "",
}: {
  takingOfferType?: TakingOfferType;
  unitPrice: string;
  percentage?: string;
  percentageType?: PercentageType;
  specialAddresses?: string[];
  authorizationAddresses?: string[];
  expiryTimestamp: string;
  timelockPeriod?: string;
  terms?: string;
  commsLink?: string;
}): OfferStruct {
  return {
    takingOfferType,
    offerPrice: {
      offerPricingType: OfferPricingType.FixedPricing,
      unitPrice,
      percentage,
      percentageType,
    },
    specialAddresses,
    authorizationAddresses,
    expiryTimestamp,
    timelockPeriod,
    terms,
    commsLink,
  };
}

/**
 * Maps method names to transaction parameter objects
 */
function getTransactionParams(methodName: string, args: any[]) {
  switch (methodName) {
    case "deposit":
      const [depositAssetAmount, depositWithdrawalAsset, depositOffer, depositLzybraDebt] = args;
      return {
        depositAssetAmount,
        depositWithdrawalAsset,
        depositOffer,
        depositLzybraDebt,
      };

    case "depositWithOfferId":
      const [amount, offerId, mintAmount, isDynamic, maximumRate] = args;
      return {
        assetAmount: amount,
        offerId,
        mintAmount,
        isDynamic,
        maximumDepositToWithdrawalRate: maximumRate,
      };

    case "withdraw":
      const [withdrawAmount, withdrawOfferId, maxRate, dynamic, affiliate] = args;
      return {
        assetAmount: withdrawAmount,
        offerId: withdrawOfferId,
        maxRate,
        isDynamic: dynamic,
        affiliate,
      };

    case "withdrawWithAsset":
      const [assetAmount, withdrawalAsset, offer, withdrawZrusdDebt] = args;
      return {
        assetAmount,
        withdrawalAsset,
        offer,
        zrusdDebt: withdrawZrusdDebt,
      };

    case "claimOffer":
      const [claimOfferId, zrusdDebt] = args;
      return {
        offerId: claimOfferId,
        zrusdDebt,
      };

    case "cancelOffer":
      const [cancelOfferId, cancelLzybraDebt] = args;
      return {
        offerId: cancelOfferId,
        zrusdDebt: cancelLzybraDebt,
      };

    default:
      return args[0];
  }
}

/**
 * Gets borrowed ZRUSD amount based on method name and parameters
 */
function getZRUSDBorrowed(methodName: string, params: any) {
  switch (methodName) {
    case "deposit":
      return Number(params.depositLzybraDebt || 0);
    case "depositWithOfferId":
      return Number(params.mintAmount || 0);
    case "withdraw":
      return Number(1);
    case "withdrawWithAsset":
    case "claimOffer":
    case "cancelOffer":
      return Number(params.zrusdDebt || 0);
    default:
      return undefined;
  }
}

/**
 * Main Swarm Vault Hook
 */
export function useSwarmVault(chainId: number) {
  // ====== CONTRACT INSTANCES ======
  const swarmVaultContract = useSwarmVaultContract(true, chainId) as Contract | null;
  const dotVc2Contract = useDotVc2(true, chainId);
  
  // ====== USER ACCOUNT CONTEXT ======
  const {
    address,
    walletType,
    addTransaction,
    addOffer,
    updateOffer,
    cancelOffer: cancOffer,
  } = useUserAccount();

  // ====== LOCAL STATE ======
  const [transactionState, setTransactionState] = useState({
    loading: false,
    error: null as Error | null,
    receipt: null as any,
  });

  // ====== TRANSACTION HOOKS ======
  const { sendTransactionAsync } = useSendTransaction();
  
  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();

  const {
    data: txReceipt,
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2,
  });

  // ====== ACCOUNT KIT HOOKS ======
  const { client } = useSmartAccountClient({
    type: accountType,
    opts,
  });

  const {
    sendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    error: sendUserOperationError,
  } = useSendUserOperation({ client: undefined, waitForTxn: true });

  // ====== CONSOLIDATED ERROR AND LOADING STATE ======
  const isLoading = transactionState.loading || isPending || isSendingUserOperation;
  const error = useMemo(() => {
    return transactionState.error?.message || 
           writeError?.message || 
           sendUserOperationError?.message || 
           null;
  }, [transactionState.error, writeError, sendUserOperationError]);

  const receipt = useMemo(() => 
    hash || transactionState.receipt, 
    [hash, transactionState.receipt]
  );

  // ====== CORE TRANSACTION HANDLER ======
  const handleTransaction = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      if (!swarmVaultContract) {
        const err = new Error("SwarmVault contract is not connected");
        setTransactionState(prev => ({ ...prev, error: err }));
        return null;
      }

      setTransactionState({ loading: true, error: null, receipt: null });
      
      // Extract parameters and prepare transaction data
      const params = getTransactionParams(methodName, args);
      const contractArgs = args.slice(0, -1); // Remove symbol from args
      const assetSymbol = args[args.length - 1]; // Last arg is asset symbol
      
      // Prepare transaction data
      const transactionData: TransactionData = {
        type: "stock",
        amount: Number(args[0]),
        status: methodName === "withdrawWithAsset" 
          ? "withdraw" 
          : methodName === "cancelOffer" 
            ? "cancel-offer" 
            : methodName,
        metadata: {
          chainId,
          assetAddress: SWARM_VAULT_ADDRESS[chainId as SupportedChainId],
          assetType: "Asset",
          assetSymbol: assetSymbol || "ZrUSD",
        },
      };

      try {
        let txHash: string | undefined;
        
        // WEB3 WALLET TRANSACTION FLOW
        if (walletType === WalletType.WEB3) {
          const tx = await writeContractAsync({
            address: SWARM_VAULT_ADDRESS[chainId as SupportedChainId] as `0x${string}`,
            abi: SwarmVaultBaseABI,
            functionName: methodName,
            args: contractArgs,
          });
          
          txHash = tx;
        } 
        // MINIMAL WALLET (ACCOUNT ABSTRACTION) TRANSACTION FLOW
        else if (walletType === WalletType.MINIMAL) {
          if (!swarmVaultContract.interface) {
            throw new Error("Contract interface not available");
          }
          
          const data = swarmVaultContract.interface.encodeFunctionData(
            methodName, contractArgs
          ) as `0x${string}`;
          
          const target = (await swarmVaultContract.getAddress()) as `0x${string}`;
          const value = overrides.value ? BigInt(overrides.value) : 0n;

          const userOp = await sendUserOperationAsync({
            uo: { target, data, value },
          });
          
          if (sendUserOperationResult && userOp.hash) {
            txHash = sendUserOperationResult.hash;
          }
        }

        // If transaction was successful, process it
        if (txHash) {
          // Update transaction data with success info and add to history
          const updatedTransactionData = {
            ...transactionData,
            tx_hash: txHash,
            ZRUSD_borrowed: getZRUSDBorrowed(methodName, params),
          };
          
          await addTransaction(updatedTransactionData);
          
          // Update transaction state
          setTransactionState(prev => ({ 
            ...prev, 
            loading: false, 
            receipt: txHash 
          }));
          
          // Process post-transaction actions
          await handlePostTransaction(
            methodName, 
            args, 
            assetSymbol, 
            txHash
          );
        }
      } catch (err) {
        console.error(`Error in ${methodName}:`, err);
        setTransactionState(prev => ({ 
          ...prev, 
          loading: false, 
          error: err as Error 
        }));
      }
    },
    [
      chainId, 
      walletType, 
      swarmVaultContract, 
      writeContractAsync, 
      sendUserOperationAsync, 
      sendUserOperationResult, 
      addTransaction
    ],
  );

  // ====== POST-TRANSACTION HANDLER ======
  const handlePostTransaction = useCallback(
    async (methodName: string, args: any[], assetSymbol: string, txHash: string) => {
      // Handle offer cancellation
      if (methodName === "cancelOffer") {
        cancOffer(args[0].toString());
        return;
      }
      
      // Handle offer creation (for deposit and withdraw methods)
      if (methodName === "deposit" || (methodName === "withdraw" && args.length < 3)) {
        const offerId = await dotVc2Contract?.currentOfferId();
        if (!offerId) return;
        
        // Extract parameters based on method type
        let sellAmount, sellCurrency, buyAmount, buyCurrency, 
            depositAssetAddress, withdrawalAssetAddress, offerParams;
            
        if (methodName === "deposit") {
          sellAmount = fromWei(Number(args[0]), 6); // USDC amount
          sellCurrency = "USDC";
          buyAmount = args[1]?.amount ? fromWei(Number(args[1].amount)) : 0;
          buyCurrency = assetSymbol;
          depositAssetAddress = USDC_ADDRESS[chainId] || "";
          withdrawalAssetAddress = args[1]?.assetAddress;
          offerParams = args[2];
        } else if (methodName === "withdraw") {
          sellAmount = fromWei(args[0]);
          sellCurrency = assetSymbol;
          buyAmount = args[1]?.amount ? fromWei(Number(args[1].amount)) : 0;
          buyCurrency = "USDC";
          depositAssetAddress = args[1]?.assetAddress;
          withdrawalAssetAddress = USDC_ADDRESS[chainId] || "";
          offerParams = args[3];
        } else {
          return; // Unsupported method for offer creation
        }
        
        // Extract offer parameters
        let expiryTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // Default 1 week
        let specialAddresses: string[] = [];
        let authorizationAddresses: string[] = [];
        
        if (offerParams) {
          if (offerParams.expiryTimestamp) {
            expiryTimestamp = Number(offerParams.expiryTimestamp);
          }
          if (offerParams.specialAddresses) {
            specialAddresses = offerParams.specialAddresses;
          }
          if (offerParams.authorizationAddresses) {
            authorizationAddresses = offerParams.authorizationAddresses;
          }
        }
        
        // Calculate rate and create offer data
        const rate = buyAmount && sellAmount ? buyAmount / sellAmount : 0;
        
        const offerData: TradingPair = {
          id: offerId.toString(),
          sellAmount,
          sellCurrency,
          buyAmount,
          buyCurrency,
          rate,
          status: StatusEnum["Not Filled"],
          type: "all",
          maker: address || "",
          expiryTimestamp,
          depositAssetAddress,
          withdrawalAssetAddress,
          takingOfferType: TakingOfferTypeEnum.PartialOffer,
          specialAddresses,
          authorizationAddresses,
          availableAmount: sellAmount,
          cancelled: false,
        };
        
        addOffer(offerData);
      } 
      // Handle offer updates for partial fills
      else if (methodName === "depositWithOfferId" || methodName === "withdraw") {
        const offerData = {
          id: args[1],
          sellAmount: args[0],
          status: StatusEnum["Partially Filled"],
        };
        
        updateOffer(offerData);
      }
    },
    [chainId, dotVc2Contract, address, cancOffer, addOffer, updateOffer]
  );

  // ====== CONTRACT READ OPERATIONS ======
  const contractReads = useMemo(() => ({
    getBorrowed: (asset: string) => 
      useSingleCallResult(swarmVaultContract, "borrowed", [address, asset]),
      
    getBorrowedMultiAsset: (assets: string[]) => {
      if (!assets?.length) return;
      
      const callParams = assets.map((asset) => [address, asset]);
      const results = useSingleContractMultipleData(
        swarmVaultContract, 
        "borrowed", 
        callParams
      );

      // Calculate total borrowed amount
      const totalBorrowed = (() => {
        if (!results || 
            results.some(result => result.loading) || 
            results.some(result => result.error)) {
          return {
            loading: results.some(result => result.loading),
            error: results.some(result => result.error),
            value: BigNumber.from(0),
          };
        }

        const total = results.reduce((sum, result) => {
          const amount = result.result?.[0] || BigNumber.from(0);
          return sum.add(amount);
        }, BigNumber.from(0));

        return {
          loading: false,
          error: false,
          value: total,
        };
      })();

      return {
        individualResults: results,
        totalBorrowed,
      };
    },
    
    getUserAssets: (asset: string) => 
      useSingleCallResult(swarmVaultContract, "userAssets", [address, asset]),
      
    getPoolTotalCirculation: () => 
      useSingleCallResult(swarmVaultContract, "getPoolTotalCirculation", []),
      
    getAllOffers: (offerId: any) =>
      useSingleCallResult(dotVc2Contract as Contract | null, "allOffers", [offerId]),
      
    getCollateralRatioAndLiquidationInfo: (user: string, asset: string, priceUpdate: string[]) =>
      useSingleCallResult(swarmVaultContract, "getCollateralRatioAndLiquidationInfo", [
        user,
        asset,
        priceUpdate,
      ]),
      
    getAssetPrice: (depositAsset: any, withdrawalAsset: any, offerPrice: any) =>
      useSingleCallResult(swarmVaultContract, "getAssetPrice", [
        depositAsset,
        withdrawalAsset,
        offerPrice,
      ]),
      
    getAssetPriceOracle: (asset: string, priceUpdate: string[]) =>
      useSingleCallResult(swarmVaultContract, "getAssetPriceOracle", [asset, priceUpdate]),
  }), [swarmVaultContract, dotVc2Contract, address]);

  // ====== CONTRACT WRITE OPERATIONS ======
  const contractWrites = useMemo(() => ({
    // Deposit operations
    depositWithAsset: async (
      assetAddress: string,
      assetAmount: number,
      depositzrusdDebt: number,
      withdrawalAmount?: number,
      withdrawalSymbol?: string,
      minPrice?: number,
      maxPrice?: number,
      offerParams?: {
        takingOfferType?: TakingOfferType;
        unitPrice: string;
        percentage?: string;
        percentageType?: PercentageType;
        specialAddresses?: string[];
        authorizationAddresses?: string[];
        expiryTimestamp: string;
        timelockPeriod?: string;
        terms?: string;
        commsLink?: string;
      }
    ) => {
      const withdrawPriceFeed = withdrawalSymbol
        ? STOCK_PRICE_FEED_ID[withdrawalSymbol]
        : "0x0000000000000000000000000000000000000000";

      // Create withdrawal asset if needed
      const withdrawalAsset = withdrawalAmount
        ? createAsset({
            assetType: AssetType.ERC20,
            assetAddress,
            amount: toWei(withdrawalAmount),
            priceFeedAddress: withdrawPriceFeed,
            maxPrice: maxPrice || 0,
            minPrice: minPrice || 0,
          })
        : undefined;

      // Create offer if params provided
      const offer = offerParams ? createOfferStruct(offerParams) : undefined;

      return handleTransaction("deposit", [
        ethers.parseUnits(assetAmount.toString(), 6).toString(),
        withdrawalAsset,
        offer || {},
        toWei(depositzrusdDebt),
        withdrawalSymbol,
      ]);
    },

    depositWithOfferId: async (
      assetAddress: string,
      assetAmount: string,
      assetSymbol: string,
      offerId: number,
      mintAmount?: string,
      isDynamic = false,
      maxRate?: string,
    ) => {
      return handleTransaction("depositWithOfferId", [
        toWei(Number(assetAmount)),
        offerId,
        toWei(Number(mintAmount)) || 0,
        isDynamic,
        toWei(Number(maxRate)) || 0,
        assetSymbol,
      ]);
    },

    // Withdraw operations
    withdrawWithAsset: async (
      assetAddress: string,
      assetAmount: number,
      zrusdDebt: number,
      withdrawalAmount: number,
      withdrawalSymbol?: string,
      minPrice?: number,
      maxPrice?: number,
      offerParams?: {
        takingOfferType?: TakingOfferType;
        unitPrice: string;
        percentage?: string;
        percentageType?: PercentageType;
        specialAddresses?: string[];
        authorizationAddresses?: string[];
        expiryTimestamp: string;
        timelockPeriod?: string;
        terms?: string;
        commsLink?: string;
      },
    ) => {
      const withdrawPriceFeed = withdrawalSymbol
        ? STOCK_PRICE_FEED_ID[withdrawalSymbol]
        : "0x0000000000000000000000000000000000000000";

      // Create withdrawal asset if needed
      const withdrawalAsset = withdrawalAmount
        ? createAsset({
            assetType: AssetType.ERC20,
            assetAddress,
            amount: toWei(withdrawalAmount),
            priceFeedAddress: withdrawPriceFeed,
            maxPrice: maxPrice || 0,
            minPrice: minPrice || 0,
          })
        : undefined;

      // Create offer if params provided
      const offer = offerParams ? createOfferStruct(offerParams) : undefined;

      return handleTransaction("withdraw", [
        toWei(assetAmount),
        withdrawalAsset,
        offer || {},
        withdrawalSymbol,
      ]);
    },

    withdraw: async (
      offerId: number,
      assetAddress: string,
      assetAmount: number,
      assetSymbol: string,
      maxRate?: string,
      isDynamic = false,
      affiliate?: string,
    ) => {
      return handleTransaction("withdrawWithOfferId", [
        offerId,
        toWei(assetAmount),
        0,
        0,
        isDynamic,
        assetSymbol,
      ]);
    },

    // Other operations
    withdrawWithSpecificLogic: async (assetAmount: number, specificLogic: boolean) =>
      handleTransaction("withdrawWithSpecificLogic", [assetAmount, specificLogic]),
      
    liquidation: async (
      provider: string,
      onBehalfOf: string,
      assetAmount: number,
      asset: any,
      priceUpdate: string[],
    ) => handleTransaction("liquidation", [provider, onBehalfOf, assetAmount, asset, priceUpdate]),
    
    repayingDebt: async (provider: string, asset: string, ZRUSDAmount: number, priceUpdate: string[]) =>
      handleTransaction("repayingDebt", [provider, asset, ZRUSDAmount, priceUpdate]),
    
    claimOffer: async (offerId: number, zrusdDebt: number, assetSymbol: string) =>
      handleTransaction("claimOffer", [offerId, zrusdDebt, assetSymbol]),
    
    cancelOffer: async (offerId: number, zrusdDebt: number, assetSymbol: string) =>
      handleTransaction("cancelOffer", [offerId, zrusdDebt, assetSymbol]),
    
    addPriceFeed: async (asset: string, pythPriceId: string, chainlinkAggregator: string) =>
      handleTransaction("addPriceFeed", [asset, pythPriceId, chainlinkAggregator]),
  }), [handleTransaction]);

  // Return combined API
  return {
    ...contractWrites,
    ...contractReads,
    loading: isLoading,
    error,
    receipt,
    setError: (err: Error | null) => 
      setTransactionState(prev => ({ ...prev, error: err })),
  };
}