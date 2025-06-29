/**
 * Transaction Migration Utilities
 * Automatic migration helpers for existing transaction hooks to use gas sponsorship
 */

import React, { useCallback } from 'react';
import { useUniversalTransaction } from '@/context/UniversalTransactionContext';
import type { SmartTransactionOptions } from '@/hooks/useSmartTransaction';
import { ethers } from 'ethers';

/**
 * Migration wrapper for existing writeContract calls
 */
export function useMigratedWriteContract() {
  const { executeTransaction } = useUniversalTransaction();

  const writeContractAsync = useCallback(async ({
    address,
    abi,
    functionName,
    args = [],
    value,
    ...options
  }: {
    address: string;
    abi: any[];
    functionName: string;
    args?: any[];
    value?: bigint;
    [key: string]: any;
  }) => {
    return await executeTransaction({
      contractAddress: address,
      abi,
      functionName,
      args,
      value,
      options: {
        gasMultipliers: {
          callGasLimit: 1.2,
          verificationGasLimit: 1.1,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  }, [executeTransaction]);

  return { writeContractAsync };
}

/**
 * Migration wrapper for existing sendUserOperation calls
 */
export function useMigratedSendUserOperation() {
  const { executeTransaction } = useUniversalTransaction();

  const sendUserOperationAsync = useCallback(async ({
    uo,
    ...options
  }: {
    uo: {
      target: string;
      data: string;
      value?: bigint;
    };
    [key: string]: any;
  }) => {
    return await executeTransaction({
      contractAddress: uo.target,
      data: uo.data,
      value: uo.value,
      options: {
        gasMultipliers: {
          callGasLimit: 1.2,
          verificationGasLimit: 1.1,
          preVerificationGas: 1.1,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  }, [executeTransaction]);

  return { sendUserOperationAsync };
}

/**
 * Create a migration wrapper for any existing transaction hook
 */
export function createMigrationWrapper<T extends (...args: any[]) => any>(
  originalHook: T,
  contractConfig: {
    address: string;
    abi: any[];
    defaultOptions?: Partial<SmartTransactionOptions>;
  }
) {
  return function MigratedHook(...args: Parameters<T>) {
    const originalResult = originalHook(...args);
    const { executeContractFunction } = useUniversalTransaction();

    // Wrap the original transaction functions
    const wrappedResult = {
      ...originalResult,
    };

    // If the original hook has writeContractAsync, wrap it
    if (originalResult.writeContractAsync) {
      wrappedResult.writeContractAsync = useCallback(async (params: any) => {
        return await executeContractFunction({
          contractAddress: contractConfig.address,
          abi: contractConfig.abi,
          functionName: params.functionName,
          args: params.args || [],
          options: {
            value: params.value,
            ...contractConfig.defaultOptions,
          },
        });
      }, [executeContractFunction]);
    }

    // If the original hook has sendUserOperationAsync, wrap it
    if (originalResult.sendUserOperationAsync) {
      wrappedResult.sendUserOperationAsync = useCallback(async (params: any) => {
        return await executeContractFunction({
          contractAddress: contractConfig.address,
          abi: contractConfig.abi,
          functionName: params.functionName || 'unknown',
          args: params.args || [],
          options: {
            value: params.uo?.value,
            ...contractConfig.defaultOptions,
          },
        });
      }, [executeContractFunction]);
    }

    return wrappedResult;
  };
}

/**
 * Automatic transaction function wrapper
 */
export function wrapTransactionFunction(
  originalFunction: (...args: any[]) => Promise<any>,
  contractAddress: string,
  abi: any[],
  functionName: string
) {
  return async (...args: any[]) => {
    const { executeTransaction } = useUniversalTransaction();
    
    return await executeTransaction({
      contractAddress,
      abi,
      functionName,
      args,
      options: {
        gasMultipliers: {
          callGasLimit: 1.2,
          verificationGasLimit: 1.1,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  };
}

/**
 * Migration helper for mint transactions
 */
export function useMigratedMintTransaction(contractAddress: string) {
  const { executeContractFunction } = useUniversalTransaction();

  const claimTokens = useCallback(async (tokenIndex: number) => {
    const abi = [
      "function claimTokens(uint256 tokenIndex) external",
    ];

    return await executeContractFunction({
      contractAddress,
      abi,
      functionName: 'claimTokens',
      args: [tokenIndex],
      options: {
        gasMultipliers: {
          callGasLimit: 1.2,
          verificationGasLimit: 1.1,
          preVerificationGas: 1.1,
        },
        retryOnFailure: true,
        maxRetries: 3,
      },
    });
  }, [executeContractFunction, contractAddress]);

  return { claimTokens };
}

/**
 * Migration helper for ERC20 transactions
 */
export function useMigratedERC20Transaction(tokenAddress: string) {
  const { executeContractFunction } = useUniversalTransaction();

  const erc20Abi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  ];

  const transfer = useCallback(async (to: string, amount: bigint) => {
    return await executeContractFunction({
      contractAddress: tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
      options: {
        gasMultipliers: {
          callGasLimit: 1.1,
          verificationGasLimit: 1.05,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  }, [executeContractFunction, tokenAddress]);

  const approve = useCallback(async (spender: string, amount: bigint) => {
    return await executeContractFunction({
      contractAddress: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
      options: {
        gasMultipliers: {
          callGasLimit: 1.1,
          verificationGasLimit: 1.05,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  }, [executeContractFunction, tokenAddress]);

  const transferFrom = useCallback(async (from: string, to: string, amount: bigint) => {
    return await executeContractFunction({
      contractAddress: tokenAddress,
      abi: erc20Abi,
      functionName: 'transferFrom',
      args: [from, to, amount],
      options: {
        gasMultipliers: {
          callGasLimit: 1.1,
          verificationGasLimit: 1.05,
        },
        retryOnFailure: true,
        maxRetries: 2,
      },
    });
  }, [executeContractFunction, tokenAddress]);

  return { transfer, approve, transferFrom };
}

/**
 * Quick migration function for existing components
 */
export function quickMigrateComponent<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  contractConfigs: Array<{
    hookName: string;
    address: string;
    abi: any[];
    defaultOptions?: Partial<SmartTransactionOptions>;
  }>
) {
  return function MigratedComponent(props: P) {
    // This would need to be implemented based on specific component structure
    // For now, just return the original component
    return React.createElement(Component, props);
  };
}

/**
 * Utility to check if a component needs migration
 */
export function checkMigrationNeeded(componentCode: string): {
  needsMigration: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let needsMigration = false;

  // Check for patterns that indicate migration is needed
  if (componentCode.includes('writeContractAsync')) {
    needsMigration = true;
    suggestions.push('Replace writeContractAsync with useMigratedWriteContract or useUniversalTransaction');
  }

  if (componentCode.includes('sendUserOperationAsync')) {
    needsMigration = true;
    suggestions.push('Replace sendUserOperationAsync with useMigratedSendUserOperation or useUniversalTransaction');
  }

  if (componentCode.includes('useMintTransactions')) {
    needsMigration = true;
    suggestions.push('Consider using useMigratedMintTransaction or useUniversalFaucet');
  }

  if (componentCode.includes('useSmartAccountClient')) {
    suggestions.push('Consider wrapping component with UniversalTransactionProvider for automatic gas sponsorship');
  }

  return { needsMigration, suggestions };
}

/**
 * Generate migration code for a component
 */
export function generateMigrationCode(
  originalCode: string,
  contractAddress: string,
  abi: any[]
): string {
  let migratedCode = originalCode;

  // Replace common patterns
  migratedCode = migratedCode.replace(
    /const\s+{\s*writeContractAsync\s*}\s*=\s*useWriteContract\(\)/g,
    'const { writeContractAsync } = useMigratedWriteContract()'
  );

  migratedCode = migratedCode.replace(
    /const\s+{\s*sendUserOperationAsync\s*}\s*=\s*useSendUserOperation\(\)/g,
    'const { sendUserOperationAsync } = useMigratedSendUserOperation()'
  );

  // Add import for migration utilities
  if (!migratedCode.includes('useMigratedWriteContract')) {
    migratedCode = `import { useMigratedWriteContract, useMigratedSendUserOperation } from '@/utils/transactionMigration';\n${migratedCode}`;
  }

  return migratedCode;
}
