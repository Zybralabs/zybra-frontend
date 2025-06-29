"use client";

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import {
  useSendUserOperation,
  useAccount as useAlchemyAccount,
  useSignerStatus,
  useWaitForUserOperationTransaction
} from '@account-kit/react';
import {
  createAlchemySmartAccountClient,
  alchemy,
  type AlchemySmartAccountClient,
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  polygon,
  mainnet
} from '@account-kit/infra';
import type { UseSmartAccountClientResult } from '@account-kit/react';
import { AlchemySignerStatus } from '@account-kit/signer';
import { useChainId } from 'wagmi';
import { getGasManagerPolicyId } from '@/config';
import { useUserAccount } from './UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import type { RealTransactionData } from '@/services/gasManager';

interface UserOperationParams {
  account: any; // SmartContractAccount type
  uo: {
    target: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  };
}

interface TransactionResult {
  hash?: string;
  isSponsored?: boolean;
  userAddress?: string;
  target?: string;
  [key: string]: unknown;
}

interface SmartAccountClientContextType {
  // Client and basic info
  client: AlchemySmartAccountClient | null;
  isGasSponsored: boolean;
  policyId: string | undefined;
  chainId: number;
  isClientReady: boolean;

  // Transaction functions
  sendUserOperationAsync: ((params: UserOperationParams) => Promise<TransactionResult>) | null;
  sendUserOperationResult: TransactionResult | null;
  isSendingUserOperation: boolean;
  sendUserOperationError: Error | null;

  // Enhanced transaction functions with built-in gas sponsorship
  executeTransaction: (
    transactionData: RealTransactionData,
    options?: { waitForTxn?: boolean }
  ) => Promise<TransactionResult>;

  executeSponsoredTransaction: (
    transactionData: RealTransactionData,
    options?: { waitForTxn?: boolean }
  ) => Promise<TransactionResult>;

  // Gas sponsorship utilities
  canSponsorTransaction: (
    transactionData: RealTransactionData
  ) => Promise<boolean>;
}

const SmartAccountClientContext = createContext<SmartAccountClientContextType | null>(null);

interface SmartAccountClientProviderProps {
  children: React.ReactNode;
}

// Internal component that creates the client when conditions are met
const SmartAccountClientProviderInternal: React.FC<SmartAccountClientProviderProps> = ({
  children
}) => {
  const chainId = useChainId();
  console.log("chainId", chainId);
  const { walletType, address } = useUserAccount();

  // Get authenticated user's account from Alchemy Account Kit
  const { address: alchemyAddress, account: alchemyAccount } = useAlchemyAccount({ type: "LightAccount" });
  const signerStatus = useSignerStatus();

  // Get the gas manager policy ID for the current chain
  const policyId = useMemo(() => {
    return getGasManagerPolicyId(chainId);
  }, [chainId]);

  // Determine if gas sponsorship should be enabled
  const shouldSponsorGas = useMemo(() => {
    // Only sponsor gas for abstraction wallet users (email, Google, Apple OAuth)
    return walletType === WalletType.MINIMAL && !!policyId;
  }, [walletType, policyId]);

  // Check if user is properly authenticated with Alchemy
  const isAlchemyAuthenticated = useMemo(() => {
    return signerStatus.status === AlchemySignerStatus.CONNECTED && !!alchemyAddress && !!alchemyAccount;
  }, [signerStatus.status, alchemyAddress, alchemyAccount]);

  // Get chain configuration
  const getChainConfig = useCallback((chainId: number) => {
    switch (chainId) {
      case baseSepolia.id:
        return baseSepolia;
      case sepolia.id:
        return sepolia;
      case arbitrumSepolia.id:
        return arbitrumSepolia;
      case polygon.id:
        return polygon;
      case mainnet.id:
        return mainnet;
      default:
        return baseSepolia; // Default fallback
    }
  }, []);

  // Create a stable key for client creation to prevent redundant calls
  const clientKey = useMemo(() => {
    if (!shouldSponsorGas || !policyId || !address) {
      return null;
    }
    return `${chainId}-${policyId}-${address}-${shouldSponsorGas}`;
  }, [shouldSponsorGas, policyId, chainId, address]);

  // State to track the Alchemy client
  const [alchemyClient, setAlchemyClient] = useState<AlchemySmartAccountClient | null>(null);
  const [lastClientKey, setLastClientKey] = useState<string | null>(null);

  useEffect(() => {
    // Only create client if the key has changed (prevents redundant calls)
    if (!clientKey || clientKey === lastClientKey) {
      return;
    }

    const createAlchemyClient = async () => {
      try {
        // Ensure user is authenticated before creating client
        if (!isAlchemyAuthenticated || !alchemyAccount) {
          console.log("User not authenticated with Alchemy, skipping client creation");
          return;
        }

        const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
        if (!alchemyApiKey) {
          console.error("Alchemy API key not found");
          return;
        }

        // Get current chain
        const currentChain = getChainConfig(chainId);
        // Create Alchemy transport
        const alchemyTransport = alchemy({
          apiKey: alchemyApiKey,
        });

        console.log("Creating Alchemy smart account client with authenticated user's account:", {
          chainId,
          policyId,
          chain: currentChain.name,
          userAddress: alchemyAddress,
          isAuthenticated: isAlchemyAuthenticated,
        });

        // ✅ KEY FIX: Use the authenticated user's account instead of random signer
        // The alchemyAccount already contains the authenticated user's signer
        const client = createAlchemySmartAccountClient({
          transport: alchemyTransport,
          chain: currentChain,
          policyId: policyId!, // This automatically enables gas sponsorship middleware
          account: alchemyAccount, // ✅ Use authenticated user's account directly
          // Let Alchemy handle gas estimation automatically without custom multipliers
          opts: {
            txMaxRetries: 3,
            txRetryIntervalMs: 2000,
            // Remove custom gas multipliers - let Alchemy's RPC handle optimal gas estimation
          }
        });

        setAlchemyClient(client);
        setLastClientKey(clientKey);
        console.log("Successfully created Alchemy smart account client with authenticated user's account:", {
          clientAddress: client.account?.address,
          userAddress: alchemyAddress,
        });
      } catch (error) {
        console.error("Failed to create Alchemy smart account client:", error);
        setAlchemyClient(null);
      }
    };

    createAlchemyClient();
  }, [clientKey, lastClientKey, chainId, policyId, getChainConfig, isAlchemyAuthenticated, alchemyAccount, alchemyAddress]);

  // Use the Alchemy client with authenticated user's account
  const finalClient = alchemyClient;

  // Use the proper useSendUserOperation hook for correct transaction handling
  const {
    sendUserOperationAsync: rawSendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    error: sendUserOperationError,
  } = useSendUserOperation({
    client: finalClient as any, // Type assertion to avoid compatibility issues
    waitForTxn: true
  });

  // Debug logging to understand the state (only in browser) - reduce frequency
  if (typeof window !== 'undefined' && Math.random() < 0.1) { // Only log 10% of the time
    console.log("SmartAccountClient Debug:", {
      finalClient: !!finalClient,
      alchemyClient: !!alchemyClient,
      address: !!address,
      alchemyAddress,
      walletType,
      shouldSponsorGas,
      policyId,
      isAlchemyAuthenticated,
      rawSendUserOperationAsync: !!rawSendUserOperationAsync,
      clientAccount: finalClient?.account?.address || "none",
      clientChain: finalClient?.chain?.id || "no chain"
    });
  }

  // Check if we have all the necessary components for Account Kit
  const isAccountKitReady = useMemo(() => {
    if (walletType !== WalletType.MINIMAL) {
      return true; // For non-Account Kit wallets, we don't need these checks
    }

    // For Account Kit (MINIMAL wallet), we need:
    // 1. Client object exists with authenticated user's account
    // 2. User is properly authenticated with Alchemy
    // 3. Send user operation function is available
    const hasClient = !!finalClient;
    const hasAccount = !!finalClient?.account;
    const hasAddress = !!address;
    const hasSendFunction = typeof rawSendUserOperationAsync === 'function';

    // Reduce logging frequency to prevent spam
    if (typeof window !== 'undefined' && Math.random() < 0.05) { // Only log 5% of the time
      console.log("Account Kit readiness check:", {
        hasClient,
        hasAccount,
        hasAddress,
        hasSendFunction,
        isAlchemyAuthenticated,
        clientType: finalClient?.constructor?.name || 'unknown',
        accountAddress: finalClient?.account?.address || 'none',
        alchemyAccountAddress: alchemyAccount?.address || 'none',
      });
    }

    return hasClient && hasAccount && hasAddress && hasSendFunction && isAlchemyAuthenticated;
  }, [finalClient, address, walletType, rawSendUserOperationAsync, isAlchemyAuthenticated, alchemyAccount]);

  // Only expose the function if everything is ready
  const sendUserOperationAsync = isAccountKitReady ? rawSendUserOperationAsync : null;

  // Enhanced transaction function with Alchemy gas sponsorship integration
  const executeTransaction = useCallback(async (
    transactionData: RealTransactionData,
    options: { waitForTxn?: boolean } = { waitForTxn: true }
  ) => {
    if (!finalClient) {
      throw new Error("Smart account client not available. Please ensure wallet is connected.");
    }

    if (!sendUserOperationAsync) {
      throw new Error("Send user operation function not available. Please try again.");
    }

    // For MINIMAL wallet type, ensure user is properly authenticated
    if (walletType === WalletType.MINIMAL && !isAlchemyAuthenticated) {
      throw new Error("Please complete authentication to perform transactions.");
    }

    try {
      console.log("Executing transaction with authenticated user's account:", {
        isGasSponsored: shouldSponsorGas,
        policyId,
        walletType,
        target: transactionData.target,
        hasGasPolicy: !!policyId,
        userAddress: address,
        clientAddress: finalClient?.account?.address,
        isAlchemyAuthenticated,
        waitForTxn: options.waitForTxn,
      });

      // Use sendUserOperationAsync for proper transaction handling and hash extraction
      const result = await rawSendUserOperationAsync({
        account: finalClient.account,
        uo: {
          target: transactionData.target,
          data: transactionData.data,
          value: transactionData.value || 0n,
        },
      });

      console.log("Transaction submitted successfully:", {
        hash: result?.hash,
        result: result,
        isSponsored: shouldSponsorGas,
        userAddress: address,
      });

      // Extract the correct transaction hash from the result
      let extractedTxHash: string | undefined;

      // Method 1: Direct hash from result
      if (result?.hash) {
        extractedTxHash = result.hash;
        console.log("Transaction hash from result:", extractedTxHash);
      }
      // Method 2: Hash from sendUserOperationResult state
      else if (sendUserOperationResult?.hash) {
        extractedTxHash = sendUserOperationResult.hash;
        console.log("Transaction hash from sendUserOperationResult:", extractedTxHash);
      }
      // Method 3: Check if result has txHash property
      else if (result && 'txHash' in result && result.txHash) {
        extractedTxHash = result.txHash as string;
        console.log("Transaction hash from txHash property:", extractedTxHash);
      }
      // Method 4: Check if result has transactionHash property
      else if (result && 'transactionHash' in result && result.transactionHash) {
        extractedTxHash = result.transactionHash as string;
        console.log("Transaction hash from transactionHash property:", extractedTxHash);
      }
      // Method 5: If result is a string, use it as hash
      else if (typeof result === 'string') {
        extractedTxHash = result;
        console.log("Transaction hash from string result:", extractedTxHash);
      }

      if (!extractedTxHash) {
        console.warn("No transaction hash found in user operation result:", result);
        throw new Error("Transaction was sent but no transaction hash was returned. The transaction may still be processing.");
      }

      return {
        ...result,
        hash: extractedTxHash,
        isSponsored: shouldSponsorGas,
        userAddress: address,
        target: transactionData.target,
      };
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }, [
    finalClient,
    sendUserOperationAsync,
    shouldSponsorGas,
    policyId,
    walletType,
    address,
    isAlchemyAuthenticated,
  ]);

  // Dedicated sponsored transaction function
  const executeSponsoredTransaction = useCallback(async (
    transactionData: RealTransactionData,
    options: { waitForTxn?: boolean } = {}
  ) => {
    if (!shouldSponsorGas || !policyId) {
      throw new Error("Gas sponsorship is not available for this wallet type or chain.");
    }

    // Use the same executeTransaction - Alchemy handles sponsorship automatically
    return executeTransaction(transactionData, options);
  }, [shouldSponsorGas, policyId, executeTransaction]);

  // Check if transaction can be sponsored
  const canSponsorTransaction = useCallback(async (
    _transactionData: RealTransactionData
  ): Promise<boolean> => {
    // With Alchemy's built-in middleware, sponsorship is determined by policy configuration
    // and user authentication status
    return shouldSponsorGas && !!policyId && !!finalClient && isAlchemyAuthenticated;
  }, [shouldSponsorGas, policyId, finalClient, isAlchemyAuthenticated]);

  // Check if client is ready - use the Account Kit ready check
  const isClientReady = useMemo(() => {
    if (walletType === WalletType.MINIMAL) {
      return isAccountKitReady;
    }
    // For other wallet types, just check if client exists
    return !!finalClient;
  }, [finalClient, walletType, isAccountKitReady]);

  const contextValue = useMemo(() => ({
    // Client and basic info
    client: finalClient,
    isGasSponsored: shouldSponsorGas,
    policyId,
    chainId,
    isClientReady,

    // Transaction functions
    sendUserOperationAsync: sendUserOperationAsync || null,
    sendUserOperationResult: sendUserOperationResult || null,
    isSendingUserOperation: isSendingUserOperation || false,
    sendUserOperationError: sendUserOperationError || null,

    // Enhanced transaction functions
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  }), [
    finalClient,
    shouldSponsorGas,
    policyId,
    chainId,
    isClientReady,
    sendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    sendUserOperationError,
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  ]);

  return (
    <SmartAccountClientContext.Provider value={contextValue}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};

// Main provider that conditionally creates the client
export const SmartAccountClientProvider: React.FC<SmartAccountClientProviderProps> = ({
  children
}) => {
  const { walletType, address } = useUserAccount();

  // Only create smart account client if we have a connected wallet
  const shouldCreateClient = useMemo(() => {
    return !!address && !!walletType && (walletType === WalletType.MINIMAL || walletType === WalletType.WEB3);
  }, [address, walletType]);

  // If we should create a client, use the internal provider
  if (shouldCreateClient) {
    return (
      <SmartAccountClientProviderInternal>
        {children}
      </SmartAccountClientProviderInternal>
    );
  }

  // Otherwise, provide a default context with null values
  const defaultContextValue: SmartAccountClientContextType = {
    client: null,
    isGasSponsored: false,
    policyId: undefined,
    chainId: 0,
    isClientReady: false,
    sendUserOperationAsync: null,
    sendUserOperationResult: null,
    isSendingUserOperation: false,
    sendUserOperationError: null,
    executeTransaction: async () => {
      throw new Error("Smart account client not available. Please connect your wallet.");
    },
    executeSponsoredTransaction: async () => {
      throw new Error("Smart account client not available. Please connect your wallet.");
    },
    canSponsorTransaction: async () => {
      return false;
    },
  };

  return (
    <SmartAccountClientContext.Provider value={defaultContextValue}>
      {children}
    </SmartAccountClientContext.Provider>
  );
};

/**
 * Hook to use the centralized smart account client
 */
export const useSmartAccountClientContext = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return safe defaults for SSR
    return {
      client: null,
      isGasSponsored: false,
      policyId: undefined,
      chainId: 0,
      isClientReady: false,
      sendUserOperationAsync: null,
      sendUserOperationResult: null,
      isSendingUserOperation: false,
      sendUserOperationError: null,
      executeTransaction: async () => {
        throw new Error("Smart account client not available during server-side rendering.");
      },
      executeSponsoredTransaction: async () => {
        throw new Error("Smart account client not available during server-side rendering.");
      },
      canSponsorTransaction: async () => {
        return false;
      },
    };
  }

  const context = useContext(SmartAccountClientContext);

  if (!context) {
    throw new Error(
      'useSmartAccountClientContext must be used within a SmartAccountClientProvider'
    );
  }

  return context;
};

/**
 * Safe hook that only returns client when it's ready
 */
export const useSmartAccountClientSafe = () => {
  const context = useSmartAccountClientContext();

  // Return safe defaults if context is not ready
  const safeExecuteTransaction = context.isClientReady && context.executeTransaction
    ? context.executeTransaction
    : async () => {
        throw new Error("Smart account client is not ready. Please ensure your wallet is connected and try again.");
      };

  const safeSendUserOperationAsync = context.isClientReady && context.sendUserOperationAsync
    ? context.sendUserOperationAsync
    : null;

  const safeExecuteSponsoredTransaction = context.isClientReady && context.executeSponsoredTransaction
    ? context.executeSponsoredTransaction
    : async () => {
        throw new Error("Smart account client is not ready. Please ensure your wallet is connected and try again.");
      };

  const safeCanSponsorTransaction = context.isClientReady && context.canSponsorTransaction
    ? context.canSponsorTransaction
    : async () => false;

  return {
    ...context,
    // Override functions to be safe
    sendUserOperationAsync: safeSendUserOperationAsync,
    executeTransaction: safeExecuteTransaction,
    executeSponsoredTransaction: safeExecuteSponsoredTransaction,
    canSponsorTransaction: safeCanSponsorTransaction,
    // Ensure isClientReady is always a boolean
    isClientReady: Boolean(context.isClientReady),
  };
};

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSmartAccountClientContext instead
 */
export const useGasSponsoredClient = () => {
  const context = useSmartAccountClientContext();
  
  return {
    client: context.client,
    isGasSponsored: context.isGasSponsored,
    policyId: context.policyId,
    chainId: context.chainId,
  };
};

/**
 * Hook for transaction operations
 */
export const useSmartAccountTransactions = () => {
  const context = useSmartAccountClientContext();

  return {
    sendUserOperationAsync: context.sendUserOperationAsync,
    sendUserOperationResult: context.sendUserOperationResult,
    isSendingUserOperation: context.isSendingUserOperation,
    sendUserOperationError: context.sendUserOperationError,
    executeTransaction: context.executeTransaction,
    executeSponsoredTransaction: context.executeSponsoredTransaction,
    canSponsorTransaction: context.canSponsorTransaction,
    isGasSponsored: context.isGasSponsored,
    client: context.client,
  };
};
