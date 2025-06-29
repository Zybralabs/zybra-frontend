/**
 * Universal Transaction Wrapper
 * Automatically wraps ANY transaction hook with gas sponsorship
 */

import { useCallback, useMemo } from 'react';
import { useUniversalTransaction } from '@/context/UniversalTransactionContext';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { ethers } from 'ethers';

export interface TransactionWrapperConfig {
  contractAddress?: string;
  abi?: any[];
  defaultGasMultipliers?: {
    callGasLimit?: number;
    verificationGasLimit?: number;
    preVerificationGas?: number;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
  };
  enableSponsorship?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

/**
 * Wraps any transaction function with automatic gas sponsorship
 */
export function useUniversalTransactionWrapper(config: TransactionWrapperConfig = {}) {
  const { walletType } = useUserAccount();
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();

  const {
    defaultGasMultipliers = {
      callGasLimit: 1.2,
      verificationGasLimit: 1.1,
      preVerificationGas: 1.1,
      maxFeePerGas: 1.1,
      maxPriorityFeePerGas: 1.05,
    },
    enableSponsorship = true,
    autoRetry = true,
    maxRetries = 2,
  } = config;

  // Determine if sponsorship should be used
  const shouldSponsor = useMemo(() => {
    return enableSponsorship && shouldUseSponsorship && walletType === WalletType.MINIMAL;
  }, [enableSponsorship, shouldUseSponsorship, walletType]);

  /**
   * Wrap a writeContract function with gas sponsorship
   */
  const wrapWriteContract = useCallback((originalWriteContract: any) => {
    return async (params: {
      address?: string;
      abi?: any[];
      functionName: string;
      args?: any[];
      value?: bigint;
      [key: string]: any;
    }) => {
      const contractAddress = params.address || config.contractAddress;
      const abi = params.abi || config.abi;

      if (!contractAddress || !abi) {
        // Fallback to original function if no contract info
        return originalWriteContract(params);
      }

      if (shouldSponsor) {
        try {
          console.log('Using sponsored transaction for writeContract');
          return await executeTransaction({
            contractAddress,
            abi,
            functionName: params.functionName,
            args: params.args || [],
            options: {
              value: params.value,
              gasMultipliers: defaultGasMultipliers,
              retryOnFailure: autoRetry,
              maxRetries,
              skipSponsorship: false,
            },
          });
        } catch (error) {
          console.warn('Sponsored transaction failed, falling back to original:', error);
        }
      }

      // Fallback to original function
      return originalWriteContract(params);
    };
  }, [executeTransaction, shouldSponsor, config, defaultGasMultipliers, autoRetry, maxRetries]);

  /**
   * Wrap a sendUserOperation function with gas sponsorship
   */
  const wrapSendUserOperation = useCallback((originalSendUserOperation: any) => {
    return async (params: {
      uo: {
        target: string;
        data: string;
        value?: bigint;
      };
      [key: string]: any;
    }) => {
      if (shouldSponsor) {
        try {
          console.log('Using sponsored transaction for sendUserOperation');
          return await executeTransaction({
            contractAddress: params.uo.target,
            data: params.uo.data,
            options: {
              value: params.uo.value,
              gasMultipliers: defaultGasMultipliers,
              retryOnFailure: autoRetry,
              maxRetries,
              skipSponsorship: false,
            },
          });
        } catch (error) {
          console.warn('Sponsored user operation failed, falling back to original:', error);
        }
      }

      // Fallback to original function
      return originalSendUserOperation(params);
    };
  }, [executeTransaction, shouldSponsor, defaultGasMultipliers, autoRetry, maxRetries]);

  /**
   * Wrap any contract function with gas sponsorship
   */
  const wrapContractFunction = useCallback((
    originalFunction: any,
    functionName: string,
    contractAddress?: string,
    abi?: any[]
  ) => {
    return async (...args: any[]) => {
      const targetAddress = contractAddress || config.contractAddress;
      const targetAbi = abi || config.abi;

      if (shouldSponsor && targetAddress && targetAbi) {
        try {
          console.log(`Using sponsored transaction for ${functionName}`);
          return await executeTransaction({
            contractAddress: targetAddress,
            abi: targetAbi,
            functionName,
            args,
            options: {
              gasMultipliers: defaultGasMultipliers,
              retryOnFailure: autoRetry,
              maxRetries,
              skipSponsorship: false,
            },
          });
        } catch (error) {
          console.warn(`Sponsored ${functionName} failed, falling back to original:`, error);
        }
      }

      // Fallback to original function
      return originalFunction(...args);
    };
  }, [executeTransaction, shouldSponsor, config, defaultGasMultipliers, autoRetry, maxRetries]);

  /**
   * Wrap an entire hook result with gas sponsorship
   */
  const wrapHookResult = useCallback((hookResult: any, contractInfo?: {
    address: string;
    abi: any[];
  }) => {
    const wrappedResult = { ...hookResult };

    // Wrap writeContractAsync if it exists
    if (hookResult.writeContractAsync) {
      wrappedResult.writeContractAsync = wrapWriteContract(hookResult.writeContractAsync);
    }

    // Wrap sendUserOperationAsync if it exists
    if (hookResult.sendUserOperationAsync) {
      wrappedResult.sendUserOperationAsync = wrapSendUserOperation(hookResult.sendUserOperationAsync);
    }

    // Wrap specific contract functions if contract info is provided
    if (contractInfo) {
      Object.keys(hookResult).forEach(key => {
        if (typeof hookResult[key] === 'function' && 
            !['writeContractAsync', 'sendUserOperationAsync'].includes(key)) {
          wrappedResult[key] = wrapContractFunction(
            hookResult[key],
            key,
            contractInfo.address,
            contractInfo.abi
          );
        }
      });
    }

    return wrappedResult;
  }, [wrapWriteContract, wrapSendUserOperation, wrapContractFunction]);

  return {
    // Wrapper functions
    wrapWriteContract,
    wrapSendUserOperation,
    wrapContractFunction,
    wrapHookResult,
    
    // State
    shouldSponsor,
    shouldUseSponsorship,
    walletType,
    
    // Direct execution (for new implementations)
    executeTransaction,
  };
}

/**
 * Higher-order function to create wrapped hooks
 */
export function createWrappedHook<T extends (...args: any[]) => any>(
  originalHook: T,
  config: TransactionWrapperConfig
) {
  return function WrappedHook(...args: Parameters<T>): ReturnType<T> {
    const originalResult = originalHook(...args);
    const { wrapHookResult } = useUniversalTransactionWrapper(config);
    
    return wrapHookResult(originalResult, config.contractAddress && config.abi ? {
      address: config.contractAddress,
      abi: config.abi,
    } : undefined);
  };
}

/**
 * Decorator function to automatically wrap transaction functions
 */
export function withGasSponsorship(config: TransactionWrapperConfig = {}) {
  return function decorator<T extends (...args: any[]) => any>(target: T): T {
    return ((...args: any[]) => {
      const { wrapContractFunction } = useUniversalTransactionWrapper(config);
      const originalFunction = target(...args);
      
      if (typeof originalFunction === 'function') {
        return wrapContractFunction(originalFunction, target.name, config.contractAddress, config.abi);
      }
      
      return originalFunction;
    }) as T;
  };
}

/**
 * Utility to wrap existing transaction hooks automatically
 */
export function autoWrapTransactionHooks() {
  const { wrapHookResult } = useUniversalTransactionWrapper();
  
  return {
    wrapHook: <T>(hookResult: T, contractInfo?: { address: string; abi: any[] }): T => {
      return wrapHookResult(hookResult, contractInfo) as T;
    },
  };
}
