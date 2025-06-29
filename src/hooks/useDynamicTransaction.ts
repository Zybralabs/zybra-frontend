/**
 * Dynamic Transaction Hook - Universal Transaction Handler
 * Drop-in replacement for existing transaction hooks with automatic gas sponsorship
 */

import { useCallback, useState } from 'react';
import { useSmartTransaction, type SmartTransactionOptions } from './useSmartTransaction';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { ethers } from 'ethers';

export interface DynamicTransactionConfig {
  // Contract configuration
  contractAddress?: string;
  abi?: any[];
  
  // Default options
  defaultGasMultipliers?: {
    callGasLimit?: number;
    verificationGasLimit?: number;
    preVerificationGas?: number;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
  };
  
  // Behavior configuration
  autoRetry?: boolean;
  maxRetries?: number;
  enableSponsorship?: boolean;
  fallbackToRegular?: boolean;
  
  // Callbacks
  onTransactionStart?: () => void;
  onTransactionSuccess?: (result: any) => void;
  onTransactionError?: (error: any) => void;
  onSponsorshipApplied?: (data: any) => void;
}

/**
 * Universal transaction hook that works with any contract or raw transaction
 */
export function useDynamicTransaction(config: DynamicTransactionConfig = {}) {
  const { walletType } = useUserAccount();
  // const { addTransaction } = useTransactionManager(); // TODO: Implement transaction manager
  const {
    executeContractCall,
    executeRawTransaction,
    checkSponsorship,
    shouldAttemptSponsorship,
    isGasSponsorshipAvailable,
  } = useSmartTransaction();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  // Default configuration
  const {
    defaultGasMultipliers = {
      callGasLimit: 1.2,
      verificationGasLimit: 1.1,
      preVerificationGas: 1.1,
      maxFeePerGas: 1.1,
      maxPriorityFeePerGas: 1.05,
    },
    autoRetry = true,
    maxRetries = 2,
    enableSponsorship = true,
    fallbackToRegular = true,
    onTransactionStart,
    onTransactionSuccess,
    onTransactionError,
    onSponsorshipApplied,
  } = config;

  /**
   * Execute a contract function with dynamic sponsorship
   */
  const executeFunction = useCallback(async (
    functionName: string,
    args: any[] = [],
    options: Partial<SmartTransactionOptions> = {}
  ) => {
    if (!config.contractAddress || !config.abi) {
      throw new Error('Contract address and ABI must be provided in config for contract calls');
    }

    setIsLoading(true);
    setError(null);
    onTransactionStart?.();

    try {
      const mergedOptions: SmartTransactionOptions = {
        // Default options
        retryOnFailure: autoRetry,
        maxRetries,
        skipSponsorship: !enableSponsorship,
        gasMultipliers: { ...defaultGasMultipliers, ...options.gasMultipliers },
        
        // Callbacks
        onSponsorshipApplied: (data) => {
          onSponsorshipApplied?.(data);
          options.onSponsorshipApplied?.(data);
        },
        onFallback: (reason) => {
          console.log(`Transaction fallback: ${reason}`);
          options.onFallback?.(reason);
        },
        onSuccess: (result) => {
          setLastResult(result);
          onTransactionSuccess?.(result);
          options.onSuccess?.(result);
        },
        onError: (error) => {
          setError(error.message);
          onTransactionError?.(error);
          options.onError?.(error);
        },
        
        // Override with provided options
        ...options,
      };

      const result = await executeContractCall({
        contractAddress: config.contractAddress,
        abi: config.abi,
        functionName,
        args,
        options: mergedOptions,
      });

      // TODO: Add to transaction manager for tracking when available
      // if (result?.hash) {
      //   addTransaction({
      //     hash: result.hash,
      //     type: 'contract_call',
      //     status: 'pending',
      //     description: `${functionName} call`,
      //     timestamp: Date.now(),
      //   });
      // }

      return result;
    } catch (error) {
      console.error(`Function execution failed (${functionName}):`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    config.contractAddress,
    config.abi,
    executeContractCall,
    // addTransaction, // TODO: Add when transaction manager is available
    autoRetry,
    maxRetries,
    enableSponsorship,
    defaultGasMultipliers,
    onTransactionStart,
    onTransactionSuccess,
    onTransactionError,
    onSponsorshipApplied,
  ]);

  /**
   * Execute a raw transaction with dynamic sponsorship
   */
  const executeRaw = useCallback(async (
    target: string,
    data: string,
    options: Partial<SmartTransactionOptions> = {}
  ) => {
    setIsLoading(true);
    setError(null);
    onTransactionStart?.();

    try {
      const mergedOptions: SmartTransactionOptions = {
        retryOnFailure: autoRetry,
        maxRetries,
        skipSponsorship: !enableSponsorship,
        gasMultipliers: { ...defaultGasMultipliers, ...options.gasMultipliers },
        
        onSponsorshipApplied: (data) => {
          onSponsorshipApplied?.(data);
          options.onSponsorshipApplied?.(data);
        },
        onSuccess: (result) => {
          setLastResult(result);
          onTransactionSuccess?.(result);
          options.onSuccess?.(result);
        },
        onError: (error) => {
          setError(error.message);
          onTransactionError?.(error);
          options.onError?.(error);
        },
        
        ...options,
      };

      const result = await executeRawTransaction({
        target,
        data,
        options: mergedOptions,
      });

      // TODO: Add to transaction manager when available
      // if (result?.hash) {
      //   addTransaction({
      //     hash: result.hash,
      //     type: 'raw_transaction',
      //     status: 'pending',
      //     description: 'Raw transaction',
      //     timestamp: Date.now(),
      //   });
      // }

      return result;
    } catch (error) {
      console.error('Raw transaction execution failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    executeRawTransaction,
    // addTransaction, // TODO: Add when transaction manager is available
    autoRetry,
    maxRetries,
    enableSponsorship,
    defaultGasMultipliers,
    onTransactionStart,
    onTransactionSuccess,
    onTransactionError,
    onSponsorshipApplied,
  ]);

  /**
   * Create a function executor for a specific function
   */
  const createFunctionExecutor = useCallback((
    functionName: string,
    defaultArgs: any[] = [],
    defaultOptions: Partial<SmartTransactionOptions> = {}
  ) => {
    return async (
      args: any[] = defaultArgs,
      options: Partial<SmartTransactionOptions> = {}
    ) => {
      return executeFunction(functionName, args, { ...defaultOptions, ...options });
    };
  }, [executeFunction]);

  /**
   * Check if a specific function call can be sponsored
   */
  const checkFunctionSponsorship = useCallback(async (
    functionName: string,
    args: any[] = []
  ) => {
    if (!config.contractAddress || !config.abi) {
      return { canSponsor: false, reason: 'Contract not configured' };
    }

    try {
      const iface = new ethers.Interface(config.abi);
      const data = iface.encodeFunctionData(functionName, args);

      return await checkSponsorship({
        target: config.contractAddress,
        data,
        value: 0n,
      });
    } catch (error) {
      return { canSponsor: false, reason: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }, [config.contractAddress, config.abi, checkSponsorship]);

  /**
   * Batch execute multiple functions
   */
  const executeBatch = useCallback(async (
    calls: Array<{
      functionName: string;
      args?: any[];
      options?: Partial<SmartTransactionOptions>;
    }>,
    globalOptions: Partial<SmartTransactionOptions> = {}
  ) => {
    if (!config.contractAddress || !config.abi) {
      throw new Error('Contract address and ABI must be provided for batch calls');
    }

    setIsLoading(true);
    setError(null);
    onTransactionStart?.();

    try {
      const results = [];
      
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        const mergedOptions = { ...globalOptions, ...call.options };
        
        try {
          const result = await executeFunction(
            call.functionName,
            call.args || [],
            mergedOptions
          );
          results.push({ success: true, result, index: i, functionName: call.functionName });
        } catch (error) {
          results.push({ 
            success: false, 
            error, 
            index: i, 
            functionName: call.functionName 
          });
          
          // Stop on first failure unless configured otherwise
          if (!autoRetry) {
            break;
          }
        }
      }
      
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [config.contractAddress, config.abi, executeFunction, autoRetry, onTransactionStart]);

  return {
    // Main execution functions
    executeFunction,
    executeRaw,
    executeBatch,
    createFunctionExecutor,
    
    // Utility functions
    checkFunctionSponsorship,
    
    // State
    isLoading,
    error,
    lastResult,
    
    // Configuration state
    shouldAttemptSponsorship,
    isGasSponsorshipAvailable,
    enableSponsorship,
    walletType,
    
    // Helpers
    clearError: () => setError(null),
    clearResult: () => setLastResult(null),
  };
}

/**
 * Factory function to create configured transaction hooks
 */
export function createTransactionHook(config: DynamicTransactionConfig) {
  return () => useDynamicTransaction(config);
}

/**
 * Pre-configured hooks for common patterns
 */

// ERC20 Token Hook
export function useERC20Transaction(tokenAddress: string) {
  return useDynamicTransaction({
    contractAddress: tokenAddress,
    abi: [
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    ],
    defaultGasMultipliers: {
      callGasLimit: 1.1,
      verificationGasLimit: 1.05,
    },
    enableSponsorship: true,
    autoRetry: true,
  });
}

// Faucet Transaction Hook
export function useFaucetTransaction(faucetAddress: string) {
  return useDynamicTransaction({
    contractAddress: faucetAddress,
    abi: [
      "function claimTokens(uint256 tokenIndex) external",
      "function getClaimableTokens(address user) external view returns (uint256[])",
      "function getLastClaimTime(address user, uint256 tokenIndex) external view returns (uint256)",
    ],
    defaultGasMultipliers: {
      callGasLimit: 1.2,
      verificationGasLimit: 1.1,
      preVerificationGas: 1.1,
    },
    enableSponsorship: true,
    autoRetry: true,
    maxRetries: 3,
  });
}
