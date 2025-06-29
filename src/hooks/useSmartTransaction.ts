/**
 * Smart Transaction Hook - Dynamic Gas Sponsorship Integration
 * Automatically handles gas sponsorship for all transactions without component changes
 */

import { useCallback, useMemo } from 'react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { useGasSponsorship } from '@/hooks/useGasSponsorship';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { ethers } from 'ethers';

export interface SmartTransactionOptions {
  // Gas sponsorship options
  forceSponsorship?: boolean;
  skipSponsorship?: boolean;
  entryPointVersion?: '0.6' | '0.7';
  gasMultipliers?: {
    callGasLimit?: number;
    verificationGasLimit?: number;
    preVerificationGas?: number;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
  };
  
  // Transaction options
  value?: bigint;
  retryOnFailure?: boolean;
  maxRetries?: number;
  
  // Callback options
  onSponsorshipCheck?: (canSponsor: boolean) => void;
  onSponsorshipApplied?: (sponsorshipData: any) => void;
  onFallback?: (reason: string) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export interface ContractCallParams {
  contractAddress: string;
  abi: any[];
  functionName: string;
  args?: any[];
  options?: SmartTransactionOptions;
}

export interface RawTransactionParams {
  target: string;
  data: string;
  options?: SmartTransactionOptions;
}

/**
 * Smart Transaction Hook - Handles all transaction types with automatic gas sponsorship
 */
export function useSmartTransaction() {
  const { walletType, address } = useUserAccount();
  const {
    client,
    isGasSponsored,
    isClientReady,
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  } = useSmartAccountClientSafe();

  const {
    shouldSponsorGas,
    isGasSponsorshipAvailable,
    getGasSponsorshipData,
  } = useGasSponsorship();

  // Determine if we should attempt gas sponsorship
  const shouldAttemptSponsorship = useMemo(() => {
    return (
      walletType === WalletType.MINIMAL &&
      isGasSponsored &&
      shouldSponsorGas &&
      isGasSponsorshipAvailable &&
      isClientReady
    );
  }, [walletType, isGasSponsored, shouldSponsorGas, isGasSponsorshipAvailable, isClientReady]);

  /**
   * Execute a contract function call with automatic gas sponsorship
   */
  const executeContractCall = useCallback(async ({
    contractAddress,
    abi,
    functionName,
    args = [],
    options = {},
  }: ContractCallParams) => {
    if (!isClientReady || !address) {
      throw new Error('Wallet not connected or client not ready');
    }

    try {
      // Encode the function call
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData(functionName, args) as `0x${string}`;

      // Prepare transaction data
      const transactionData = {
        target: contractAddress as `0x${string}`,
        data,
        value: options.value || 0n,
      };

      // Execute with smart sponsorship logic
      return await executeSmartTransaction(transactionData, options);
    } catch (error) {
      console.error(`Contract call failed (${functionName}):`, error);
      options.onError?.(error);
      throw error;
    }
  }, [isClientReady, address]);

  /**
   * Execute a raw transaction with automatic gas sponsorship
   */
  const executeRawTransaction = useCallback(async ({
    target,
    data,
    options = {},
  }: RawTransactionParams) => {
    if (!isClientReady || !address) {
      throw new Error('Wallet not connected or client not ready');
    }

    try {
      const transactionData = {
        target: target as `0x${string}`,
        data: data as `0x${string}`,
        value: options.value || 0n,
      };

      return await executeSmartTransaction(transactionData, options);
    } catch (error) {
      console.error('Raw transaction failed:', error);
      options.onError?.(error);
      throw error;
    }
  }, [isClientReady, address]);

  /**
   * Core smart transaction execution logic
   */
  const executeSmartTransaction = useCallback(async (
    transactionData: {
      target: `0x${string}`;
      data: `0x${string}`;
      value: bigint;
    },
    options: SmartTransactionOptions = {}
  ) => {
    const {
      forceSponsorship = false,
      skipSponsorship = false,
      entryPointVersion = '0.7',
      gasMultipliers = {},
      retryOnFailure = true,
      maxRetries = 2,
      onSponsorshipCheck,
      onSponsorshipApplied,
      onFallback,
      onSuccess,
    } = options;

    let attempt = 0;
    let lastError: any;

    while (attempt <= maxRetries) {
      try {
        // Determine sponsorship strategy
        const shouldTrySponsorship = !skipSponsorship && (
          forceSponsorship || shouldAttemptSponsorship
        );

        if (shouldTrySponsorship) {
          // Check if transaction can be sponsored
          const canSponsor = await canSponsorTransaction(transactionData);
          onSponsorshipCheck?.(canSponsor);

          if (canSponsor) {
            try {
              console.log(`Attempting sponsored transaction (attempt ${attempt + 1})`);
              
              // Prepare sponsorship options
              const sponsorshipOptions = {
                entryPointVersion,
                overrides: {
                  ...(gasMultipliers.callGasLimit && {
                    callGasLimit: { multiplier: gasMultipliers.callGasLimit }
                  }),
                  ...(gasMultipliers.verificationGasLimit && {
                    verificationGasLimit: { multiplier: gasMultipliers.verificationGasLimit }
                  }),
                  ...(gasMultipliers.preVerificationGas && {
                    preVerificationGas: { multiplier: gasMultipliers.preVerificationGas }
                  }),
                  ...(gasMultipliers.maxFeePerGas && {
                    maxFeePerGas: { multiplier: gasMultipliers.maxFeePerGas }
                  }),
                  ...(gasMultipliers.maxPriorityFeePerGas && {
                    maxPriorityFeePerGas: { multiplier: gasMultipliers.maxPriorityFeePerGas }
                  }),
                },
              };

              // Get detailed sponsorship data for callback
              if (onSponsorshipApplied) {
                const sponsorshipData = await getGasSponsorshipData(
                  transactionData,
                  address!,
                  sponsorshipOptions
                );
                onSponsorshipApplied(sponsorshipData);
              }

              // Execute sponsored transaction
              const result = await executeSponsoredTransaction(transactionData, { waitForTxn: true });
              
              console.log('Sponsored transaction successful:', result);
              onSuccess?.(result);
              return result;
            } catch (sponsorshipError) {
              console.warn(`Sponsored transaction failed (attempt ${attempt + 1}):`, sponsorshipError);
              
              // If forced sponsorship fails, throw error
              if (forceSponsorship) {
                throw sponsorshipError;
              }
              
              // Otherwise, fall back to regular transaction
              onFallback?.(`Sponsorship failed: ${sponsorshipError instanceof Error ? sponsorshipError.message : 'Unknown error'}`);
            }
          } else {
            console.log('Transaction cannot be sponsored, using regular transaction');
            onFallback?.('Transaction not eligible for sponsorship');
          }
        }

        // Execute regular transaction (fallback or non-sponsored)
        console.log(`Executing regular transaction (attempt ${attempt + 1})`);
        const result = await executeTransaction(transactionData, {
          waitForTxn: true,
        });

        console.log('Regular transaction successful:', result);
        onSuccess?.(result);
        return result;

      } catch (error) {
        lastError = error;
        attempt++;
        
        console.error(`Transaction attempt ${attempt} failed:`, error);
        
        if (attempt > maxRetries || !retryOnFailure) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // All attempts failed
    console.error('All transaction attempts failed:', lastError);
    throw lastError;
  }, [
    shouldAttemptSponsorship,
    canSponsorTransaction,
    executeSponsoredTransaction,
    executeTransaction,
    getGasSponsorshipData,
    address,
  ]);

  /**
   * Batch execute multiple transactions with sponsorship
   */
  const executeBatchTransactions = useCallback(async (
    transactions: Array<ContractCallParams | RawTransactionParams>,
    globalOptions: SmartTransactionOptions = {}
  ) => {
    const results = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const options = { ...globalOptions, ...tx.options };
      
      try {
        let result;
        if ('contractAddress' in tx) {
          result = await executeContractCall(tx);
        } else {
          result = await executeRawTransaction(tx);
        }
        results.push({ success: true, result, index: i });
      } catch (error) {
        results.push({ success: false, error, index: i });
        
        // Stop on first failure unless configured otherwise
        if (!globalOptions.retryOnFailure) {
          break;
        }
      }
    }
    
    return results;
  }, [executeContractCall, executeRawTransaction]);

  /**
   * Check if a transaction can be sponsored (utility function)
   */
  const checkSponsorship = useCallback(async (
    transactionData: {
      target: string;
      data: string;
      value?: bigint;
    }
  ) => {
    if (!shouldAttemptSponsorship || !address) {
      return { canSponsor: false, reason: 'Sponsorship not available' };
    }

    try {
      const canSponsor = await canSponsorTransaction({
        target: transactionData.target as `0x${string}`,
        data: transactionData.data as `0x${string}`,
        value: transactionData.value || 0n,
      });

      return { canSponsor, reason: canSponsor ? 'Eligible for sponsorship' : 'Not eligible' };
    } catch (error) {
      return { canSponsor: false, reason: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }, [shouldAttemptSponsorship, canSponsorTransaction, address]);

  return {
    // Main execution functions
    executeContractCall,
    executeRawTransaction,
    executeBatchTransactions,
    
    // Utility functions
    checkSponsorship,
    
    // State
    shouldAttemptSponsorship,
    isGasSponsorshipAvailable,
    isClientReady,
    walletType,
    
    // Direct access to underlying functions (for advanced usage)
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  };
}
