/**
 * Universal Transaction Context - Automatic Gas Sponsorship for All Transactions
 * Provides a global transaction wrapper that automatically applies gas sponsorship
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { ethers } from 'ethers';
import type { AlchemyTransactionData, AlchemyGasSponsorshipOptions } from '@/hooks/useAlchemyGasSponsorship';
import type { SmartTransactionOptions } from '@/hooks/useSmartTransaction';

interface UniversalTransactionContextType {
  // Universal transaction executor
  executeTransaction: (params: TransactionParams) => Promise<any>;
  
  // Contract interaction helpers
  executeContractFunction: (params: ContractFunctionParams) => Promise<any>;
  
  // Batch operations
  executeBatchTransactions: (transactions: TransactionParams[]) => Promise<any[]>;
  
  // Utility functions
  checkTransactionSponsorship: (params: TransactionParams) => Promise<{ canSponsor: boolean; reason: string }>;
  
  // State
  isGasSponsorshipEnabled: boolean;
  shouldUseSponsorship: boolean;
}

interface TransactionParams {
  // Contract details
  contractAddress: string;
  abi?: any[];

  // Function details
  functionName?: string;
  args?: any[];

  // Raw transaction details
  data?: string;
  value?: bigint;

  // Options
  options?: SmartTransactionOptions;
}

interface ContractFunctionParams {
  contractAddress: string;
  abi: any[];
  functionName: string;
  args?: any[];
  options?: SmartTransactionOptions;
}

const UniversalTransactionContext = createContext<UniversalTransactionContextType | null>(null);

/**
 * Universal Transaction Provider
 */
export const UniversalTransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { walletType } = useUserAccount();
  const {
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
    isGasSponsored,
    isClientReady,
  } = useSmartAccountClientSafe();

  // Determine if gas sponsorship should be used
  const shouldUseSponsorship = useMemo(() => {
    return walletType === WalletType.MINIMAL && isGasSponsored && isClientReady;
  }, [walletType, isGasSponsored, isClientReady]);

  const isGasSponsorshipEnabled = useMemo(() => {
    return isGasSponsored && isClientReady;
  }, [isGasSponsored, isClientReady]);

  /**
   * Universal transaction executor that handles both contract calls and raw transactions
   */
  const executeTransactionUniversal = useCallback(async (params: TransactionParams) => {
    const {
      contractAddress,
      abi,
      functionName,
      args = [],
      data,
      value = 0n,
      options = {},
    } = params;

    // Prepare transaction data
    let transactionData: AlchemyTransactionData;

    if (functionName && abi) {
      // Encode contract function call
      const iface = new ethers.Interface(abi);
      const encodedData = iface.encodeFunctionData(functionName, args);
      transactionData = {
        target: contractAddress as `0x${string}`,
        data: encodedData as `0x${string}`,
        value,
      };
    } else if (data) {
      // Raw transaction
      transactionData = {
        target: contractAddress as `0x${string}`,
        data: data as `0x${string}`,
        value,
      };
    } else {
      throw new Error('Either functionName with abi or data must be provided');
    }

    // Convert SmartTransactionOptions to AlchemyGasSponsorshipOptions
    const alchemyOptions: AlchemyGasSponsorshipOptions = {
      entryPointVersion: options.entryPointVersion || '0.7',
      forceSponsorship: options.forceSponsorship,
      overrides: options.gasMultipliers ? {
        callGasLimit: options.gasMultipliers.callGasLimit ? { multiplier: options.gasMultipliers.callGasLimit } : { multiplier: 1.2 },
        verificationGasLimit: options.gasMultipliers.verificationGasLimit ? { multiplier: options.gasMultipliers.verificationGasLimit } : { multiplier: 1.1 },
        preVerificationGas: options.gasMultipliers.preVerificationGas ? { multiplier: options.gasMultipliers.preVerificationGas } : { multiplier: 1.1 },
        maxFeePerGas: options.gasMultipliers.maxFeePerGas ? { multiplier: options.gasMultipliers.maxFeePerGas } : { multiplier: 1.1 },
        maxPriorityFeePerGas: options.gasMultipliers.maxPriorityFeePerGas ? { multiplier: options.gasMultipliers.maxPriorityFeePerGas } : { multiplier: 1.05 },
      } : {
        callGasLimit: { multiplier: 1.2 },
        verificationGasLimit: { multiplier: 1.1 },
        preVerificationGas: { multiplier: 1.1 },
        maxFeePerGas: { multiplier: 1.1 },
        maxPriorityFeePerGas: { multiplier: 1.05 },
      },
    };

    // Use the SmartAccountClient's executeTransaction which handles sponsorship
    return await executeTransaction(transactionData, { waitForTxn: true });
  }, [executeTransaction]);

  /**
   * Contract function executor with automatic ABI handling
   */
  const executeContractFunction = useCallback(async (params: ContractFunctionParams) => {
    const { contractAddress, abi, functionName, args = [], options = {} } = params;

    return await executeTransactionUniversal({
      contractAddress,
      abi,
      functionName,
      args,
      options,
    });
  }, [executeTransactionUniversal]);

  /**
   * Batch transaction executor
   */
  const executeBatchTransactions = useCallback(async (transactions: TransactionParams[]) => {
    const results = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      try {
        const result = await executeTransactionUniversal(tx);
        results.push({ success: true, result, index: i });
      } catch (error) {
        results.push({ success: false, error, index: i });
        console.error(`Batch transaction ${i} failed:`, error);
      }
    }

    return results;
  }, [executeTransactionUniversal]);

  /**
   * Check if a transaction can be sponsored
   */
  const checkTransactionSponsorship = useCallback(async (params: TransactionParams) => {
    const { contractAddress, abi, functionName, args = [], data, value = 0n } = params;

    // Prepare transaction data
    let transactionData: AlchemyTransactionData;

    if (functionName && abi) {
      // Encode function call
      const iface = new ethers.Interface(abi);
      const encodedData = iface.encodeFunctionData(functionName, args);
      transactionData = {
        target: contractAddress as `0x${string}`,
        data: encodedData as `0x${string}`,
        value,
      };
    } else if (data) {
      transactionData = {
        target: contractAddress as `0x${string}`,
        data: data as `0x${string}`,
        value,
      };
    } else {
      return { canSponsor: false, reason: 'Invalid transaction parameters' };
    }

    // Convert SmartTransactionOptions to AlchemyGasSponsorshipOptions if needed
    const alchemyOptions: AlchemyGasSponsorshipOptions | undefined = params.options ? {
      entryPointVersion: params.options.entryPointVersion || '0.7',
      forceSponsorship: params.options.forceSponsorship,
      overrides: params.options.gasMultipliers ? {
        callGasLimit: params.options.gasMultipliers.callGasLimit ? { multiplier: params.options.gasMultipliers.callGasLimit } : undefined,
        verificationGasLimit: params.options.gasMultipliers.verificationGasLimit ? { multiplier: params.options.gasMultipliers.verificationGasLimit } : undefined,
        preVerificationGas: params.options.gasMultipliers.preVerificationGas ? { multiplier: params.options.gasMultipliers.preVerificationGas } : undefined,
        maxFeePerGas: params.options.gasMultipliers.maxFeePerGas ? { multiplier: params.options.gasMultipliers.maxFeePerGas } : undefined,
        maxPriorityFeePerGas: params.options.gasMultipliers.maxPriorityFeePerGas ? { multiplier: params.options.gasMultipliers.maxPriorityFeePerGas } : undefined,
      } : undefined,
    } : undefined;

    const canSponsor = await canSponsorTransaction(transactionData);
    return { canSponsor, reason: canSponsor ? 'Eligible for sponsorship' : 'Not eligible' };
  }, [canSponsorTransaction]);

  const contextValue = useMemo(() => ({
    executeTransaction: executeTransactionUniversal,
    executeContractFunction,
    executeBatchTransactions,
    checkTransactionSponsorship,
    isGasSponsorshipEnabled,
    shouldUseSponsorship,
  }), [
    executeTransactionUniversal,
    executeContractFunction,
    executeBatchTransactions,
    checkTransactionSponsorship,
    isGasSponsorshipEnabled,
    shouldUseSponsorship,
  ]);

  return (
    <UniversalTransactionContext.Provider value={contextValue}>
      {children}
    </UniversalTransactionContext.Provider>
  );
};

/**
 * Hook to use the Universal Transaction Context
 */
export const useUniversalTransaction = () => {
  const context = useContext(UniversalTransactionContext);
  if (!context) {
    throw new Error('useUniversalTransaction must be used within UniversalTransactionProvider');
  }
  return context;
};

/**
 * Higher-Order Component to wrap existing transaction hooks
 */
export function withUniversalTransaction<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  return function UniversalTransactionWrapper(props: T) {
    return (
      <UniversalTransactionProvider>
        <WrappedComponent {...props} />
      </UniversalTransactionProvider>
    );
  };
}

/**
 * Hook factory for creating transaction hooks with automatic sponsorship
 */
export function createUniversalTransactionHook(
  contractAddress: string,
  abi: any[],
  defaultOptions: Partial<SmartTransactionOptions> = {}
) {
  return function useUniversalContractTransaction() {
    const { executeContractFunction, checkTransactionSponsorship, shouldUseSponsorship } = useUniversalTransaction();

    const executeFunction = useCallback(async (
      functionName: string,
      args: any[] = [],
      options: Partial<SmartTransactionOptions> = {}
    ) => {
      return await executeContractFunction({
        contractAddress,
        abi,
        functionName,
        args,
        options: { ...defaultOptions, ...options },
      });
    }, [executeContractFunction]);

    const checkSponsorship = useCallback(async (
      functionName: string,
      args: any[] = []
    ) => {
      return await checkTransactionSponsorship({
        contractAddress,
        abi,
        functionName,
        args,
      });
    }, [checkTransactionSponsorship]);

    return {
      executeFunction,
      checkSponsorship,
      shouldUseSponsorship,
      contractAddress,
      abi,
    };
  };
}

/**
 * Pre-configured universal hooks for common contracts
 */

// Universal ERC20 Hook
export function useUniversalERC20(tokenAddress: string) {
  const erc20Abi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];

  return createUniversalTransactionHook(tokenAddress, erc20Abi, {
    gasMultipliers: {
      callGasLimit: 1.1,
      verificationGasLimit: 1.05,
    },
  })();
}

// Universal Faucet Hook
export function useUniversalFaucet(faucetAddress: string) {
  const faucetAbi = [
    "function claimTokens(uint256 tokenIndex) external",
    "function getClaimableTokens(address user) external view returns (uint256[])",
    "function getLastClaimTime(address user, uint256 tokenIndex) external view returns (uint256)",
  ];

  return createUniversalTransactionHook(faucetAddress, faucetAbi, {
    gasMultipliers: {
      callGasLimit: 1.2,
      verificationGasLimit: 1.1,
      preVerificationGas: 1.1,
    },
    retryOnFailure: true,
    maxRetries: 3,
  })();
}
