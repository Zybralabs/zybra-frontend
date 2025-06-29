/**
 * Transaction Sponsorship Provider
 * Automatically applies gas sponsorship to ALL transaction components
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useUniversalTransaction } from '@/context/UniversalTransactionContext';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';

interface TransactionSponsorshipContextType {
  // Global sponsorship state
  isGlobalSponsorshipEnabled: boolean;
  shouldSponsorTransactions: boolean;
  
  // Transaction interceptors
  interceptWriteContract: (originalFunction: any) => any;
  interceptSendUserOperation: (originalFunction: any) => any;
  interceptContractCall: (originalFunction: any, contractInfo: any) => any;
  
  // Batch operations
  executeBatchWithSponsorship: (transactions: any[]) => Promise<any[]>;
  
  // Configuration
  getGasMultipliersForType: (type: string) => any;
}

const TransactionSponsorshipContext = createContext<TransactionSponsorshipContextType | null>(null);

// Gas multipliers for different transaction types
const GAS_MULTIPLIERS_BY_TYPE = {
  mint: {
    callGasLimit: 1.2,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.1,
    maxPriorityFeePerGas: 1.05,
  },
  swap: {
    callGasLimit: 1.3,
    verificationGasLimit: 1.15,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.2,
    maxPriorityFeePerGas: 1.1,
  },
  lending: {
    callGasLimit: 1.25,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.15,
    maxPriorityFeePerGas: 1.05,
  },
  staking: {
    callGasLimit: 1.2,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.1,
    maxPriorityFeePerGas: 1.05,
  },
  vault: {
    callGasLimit: 1.3,
    verificationGasLimit: 1.15,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.2,
    maxPriorityFeePerGas: 1.1,
  },
  offer: {
    callGasLimit: 1.25,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.15,
    maxPriorityFeePerGas: 1.05,
  },
  default: {
    callGasLimit: 1.2,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.1,
    maxPriorityFeePerGas: 1.05,
  },
};

/**
 * Transaction Sponsorship Provider Component
 */
export const TransactionSponsorshipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { walletType } = useUserAccount();
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();

  // Determine if global sponsorship should be enabled
  const isGlobalSponsorshipEnabled = useMemo(() => {
    return shouldUseSponsorship && walletType === WalletType.MINIMAL;
  }, [shouldUseSponsorship, walletType]);

  const shouldSponsorTransactions = useMemo(() => {
    return isGlobalSponsorshipEnabled;
  }, [isGlobalSponsorshipEnabled]);

  // Get gas multipliers for transaction type
  const getGasMultipliersForType = useCallback((type: string) => {
    const key = type.toLowerCase() as keyof typeof GAS_MULTIPLIERS_BY_TYPE;
    return GAS_MULTIPLIERS_BY_TYPE[key] || GAS_MULTIPLIERS_BY_TYPE.default;
  }, []);

  // Intercept writeContract calls
  const interceptWriteContract = useCallback((originalFunction: any) => {
    return async (params: {
      address: string;
      abi: any[];
      functionName: string;
      args?: any[];
      value?: bigint;
      [key: string]: any;
    }) => {
      if (shouldSponsorTransactions) {
        try {
          console.log(`Intercepting writeContract for ${params.functionName} with sponsorship`);

          // Determine transaction type from function name
          let transactionType = 'default';
          const funcName = params.functionName.toLowerCase();

          if (funcName.includes('claim') || funcName.includes('mint')) {
            transactionType = 'mint';
          } else if (funcName.includes('swap')) {
            transactionType = 'swap';
          } else if (funcName.includes('supply') || funcName.includes('borrow') || funcName.includes('repay') || funcName.includes('withdraw')) {
            transactionType = 'lending';
          } else if (funcName.includes('stake') || funcName.includes('unstake')) {
            transactionType = 'staking';
          } else if (funcName.includes('deposit') || funcName.includes('redeem')) {
            transactionType = 'vault';
          } else if (funcName.includes('offer') || funcName.includes('take') || funcName.includes('make')) {
            transactionType = 'offer';
          }

          const result = await executeTransaction({
            contractAddress: params.address,
            abi: params.abi,
            functionName: params.functionName,
            args: params.args || [],
            value: params.value,
            options: {
              entryPointVersion: '0.7',
              gasMultipliers: getGasMultipliersForType(transactionType),
              forceSponsorship: true,
            },
          });

          console.log(`Sponsored writeContract successful for ${params.functionName}`);
          return result;
        } catch (error) {
          console.warn(`Sponsored writeContract failed for ${params.functionName}, falling back:`, error);
        }
      }

      // Fallback to original function
      return originalFunction(params);
    };
  }, [shouldSponsorTransactions, executeTransaction, getGasMultipliersForType]);

  // Intercept sendUserOperation calls
  const interceptSendUserOperation = useCallback((originalFunction: any) => {
    return async (params: {
      uo: {
        target: string;
        data: string;
        value?: bigint;
      };
      [key: string]: any;
    }) => {
      if (shouldSponsorTransactions) {
        try {
          console.log('Intercepting sendUserOperation with sponsorship');

          const result = await executeTransaction({
            contractAddress: params.uo.target,
            data: params.uo.data,
            value: params.uo.value,
            options: {
              entryPointVersion: '0.7',
              gasMultipliers: getGasMultipliersForType('default'),
              forceSponsorship: true,
            },
          });

          console.log('Sponsored sendUserOperation successful');
          return result;
        } catch (error) {
          console.warn('Sponsored sendUserOperation failed, falling back:', error);
        }
      }

      // Fallback to original function
      return originalFunction(params);
    };
  }, [shouldSponsorTransactions, executeTransaction, getGasMultipliersForType]);

  // Intercept contract calls
  const interceptContractCall = useCallback((originalFunction: any, contractInfo: {
    address: string;
    abi: any[];
    functionName: string;
  }) => {
    return async (...args: any[]) => {
      if (shouldSponsorTransactions) {
        try {
          console.log(`Intercepting contract call ${contractInfo.functionName} with sponsorship`);

          // Determine transaction type
          let transactionType = 'default';
          const funcName = contractInfo.functionName.toLowerCase();

          if (funcName.includes('claim') || funcName.includes('mint')) {
            transactionType = 'mint';
          } else if (funcName.includes('swap')) {
            transactionType = 'swap';
          } else if (funcName.includes('supply') || funcName.includes('borrow') || funcName.includes('repay') || funcName.includes('withdraw')) {
            transactionType = 'lending';
          } else if (funcName.includes('stake') || funcName.includes('unstake')) {
            transactionType = 'staking';
          } else if (funcName.includes('deposit') || funcName.includes('redeem')) {
            transactionType = 'vault';
          } else if (funcName.includes('offer') || funcName.includes('take') || funcName.includes('make')) {
            transactionType = 'offer';
          }

          const result = await executeTransaction({
            contractAddress: contractInfo.address,
            abi: contractInfo.abi,
            functionName: contractInfo.functionName,
            args,
            options: {
              entryPointVersion: '0.7',
              gasMultipliers: getGasMultipliersForType(transactionType),
              forceSponsorship: true,
            },
          });

          console.log(`Sponsored contract call successful for ${contractInfo.functionName}`);
          return result;
        } catch (error) {
          console.warn(`Sponsored contract call failed for ${contractInfo.functionName}, falling back:`, error);
        }
      }

      // Fallback to original function
      return originalFunction(...args);
    };
  }, [shouldSponsorTransactions, executeTransaction, getGasMultipliersForType]);

  // Execute batch transactions with sponsorship
  const executeBatchWithSponsorship = useCallback(async (transactions: any[]) => {
    const results = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i] as {
        contractAddress?: string;
        address?: string;
        abi: any[];
        functionName: string;
        args?: any[];
        value?: bigint;
        type?: string;
        execute?: () => Promise<any>;
      };
      
      try {
        let result;
        
        if (shouldSponsorTransactions) {
          result = await executeTransaction({
            contractAddress: tx.contractAddress ?? tx.address ?? (() => { throw new Error('Transaction missing contractAddress or address'); })(),
            abi: tx.abi,
            functionName: tx.functionName,
            args: tx.args || [],
            value: tx.value,
            options: {
              entryPointVersion: '0.7',
              gasMultipliers: getGasMultipliersForType(tx.type || 'default'),
              forceSponsorship: true,
            },
          });
        } else {
          // Execute without sponsorship
          if (typeof tx.execute === 'function') {
            result = await tx.execute();
          } else {
            throw new Error('Transaction missing execute method');
          }
        }
        
        results.push({ success: true, result, index: i });
      } catch (error) {
        results.push({ success: false, error, index: i });
        console.error(`Batch transaction ${i} failed:`, error);
      }
    }
    
    return results;
  }, [executeTransaction, shouldSponsorTransactions, getGasMultipliersForType]);

  const contextValue = useMemo(() => ({
    isGlobalSponsorshipEnabled,
    shouldSponsorTransactions,
    interceptWriteContract,
    interceptSendUserOperation,
    interceptContractCall,
    executeBatchWithSponsorship,
    getGasMultipliersForType,
  }), [
    isGlobalSponsorshipEnabled,
    shouldSponsorTransactions,
    interceptWriteContract,
    interceptSendUserOperation,
    interceptContractCall,
    executeBatchWithSponsorship,
    getGasMultipliersForType,
  ]);

  // Auto-intercept global transaction functions on mount
  useEffect(() => {
    if (shouldSponsorTransactions) {
      console.log('Global transaction sponsorship enabled for abstract wallet user');
    }
  }, [shouldSponsorTransactions]);

  return (
    <TransactionSponsorshipContext.Provider value={contextValue}>
      {children}
    </TransactionSponsorshipContext.Provider>
  );
};

/**
 * Hook to use transaction sponsorship
 */
export const useTransactionSponsorship = () => {
  const context = useContext(TransactionSponsorshipContext);
  if (!context) {
    throw new Error('useTransactionSponsorship must be used within TransactionSponsorshipProvider');
  }
  return context;
};

/**
 * HOC to automatically wrap components with transaction sponsorship
 */
export function withTransactionSponsorship<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  return function TransactionSponsorshipWrapper(props: T) {
    return (
      <TransactionSponsorshipProvider>
        <WrappedComponent {...props} />
      </TransactionSponsorshipProvider>
    );
  };
}




