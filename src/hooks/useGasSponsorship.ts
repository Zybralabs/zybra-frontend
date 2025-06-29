/**
 * Enhanced Gas Sponsorship Hook
 * Integrates with Alchemy Gas Manager for complete gasless transactions
 */

import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import {
  createGasManagerService,
  isGasSponsorshipAvailable,
  AlchemyGasManagerService,
  type UserOperationV06,
  type UserOperationV07,
  type AlchemyGasManagerResponse,
  type AlchemyGasManagerRequest
} from '@/services/gasManager';
import { getGasManagerPolicyId } from '@/config';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';

export interface TransactionData {
  target: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export interface SponsoredTransactionOptions {
  entryPointVersion?: '0.6' | '0.7';
  overrides?: {
    maxFeePerGas?: string | { multiplier: number };
    maxPriorityFeePerGas?: string | { multiplier: number };
    callGasLimit?: string | { multiplier: number };
    verificationGasLimit?: string | { multiplier: number };
    preVerificationGas?: string | { multiplier: number };
  };
  webhookData?: string;
}

export interface GasSponsorshipResult {
  isSponsored: boolean;
  paymasterData?: string;
  paymasterAndData?: string;
  gasLimits?: {
    callGasLimit?: string;
    verificationGasLimit?: string;
    preVerificationGas?: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
  };
  feeData?: {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  paymaster?: string;
}

/**
 * Hook for managing gas sponsorship with Alchemy Gas Manager
 */
export function useGasSponsorship() {
  const chainId = useChainId();
  const { walletType, address } = useUserAccount();

  // Create Gas Manager Service instance
  const gasManagerService = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!apiKey) return null;
    return createGasManagerService(apiKey, chainId);
  }, [chainId]);

  // Get policy ID for current chain
  const policyId = useMemo(() => {
    return getGasManagerPolicyId(chainId);
  }, [chainId]);

  // Check if gas sponsorship should be enabled
  const shouldSponsorGas = useMemo(() => {
    return (
      walletType === WalletType.MINIMAL &&
      isGasSponsorshipAvailable(chainId) &&
      !!policyId &&
      !!gasManagerService
    );
  }, [walletType, chainId, policyId, gasManagerService]);

  /**
   * Prepare a user operation with gas sponsorship
   */
  const prepareUserOperation = useCallback(async (
    userOp: Partial<UserOperationV06 | UserOperationV07>,
    options: SponsoredTransactionOptions = {}
  ): Promise<UserOperationV06 | UserOperationV07> => {
    if (!shouldSponsorGas || !gasManagerService || !policyId) {
      // Return the user operation as-is if gas sponsorship is not available
      return userOp as UserOperationV06 | UserOperationV07;
    }

    try {
      const entryPointVersion = options.entryPointVersion || '0.7';
      const entryPoint = gasManagerService.getEntryPointAddress(entryPointVersion);
      const dummySignature = gasManagerService.getDummySignature();

      // Prepare the request parameters
      const requestParams = {
        policyId,
        entryPoint,
        dummySignature,
        userOperation: userOp as UserOperationV06 | UserOperationV07,
        overrides: options.overrides,
        webhookData: options.webhookData,
      };

      // Request gas and paymaster data from Alchemy
      const response = await gasManagerService.requestGasAndPaymasterAndData(requestParams);

      // Apply the response data to the user operation
      if (entryPointVersion === '0.6' && response.entrypointV06Response) {
        const v06Response = response.entrypointV06Response;
        return {
          ...userOp,
          paymasterAndData: v06Response.paymasterAndData || '0x',
          callGasLimit: v06Response.callGasLimit || userOp.callGasLimit,
          verificationGasLimit: v06Response.verificationGasLimit || userOp.verificationGasLimit,
          preVerificationGas: v06Response.preVerificationGas || userOp.preVerificationGas,
          maxFeePerGas: v06Response.maxFeePerGas || userOp.maxFeePerGas,
          maxPriorityFeePerGas: v06Response.maxPriorityFeePerGas || userOp.maxPriorityFeePerGas,
        } as UserOperationV06;
      } else if (entryPointVersion === '0.7' && response.entrypointV07Response) {
        const v07Response = response.entrypointV07Response;
        return {
          ...userOp,
          paymaster: v07Response.paymaster || undefined,
          paymasterData: v07Response.paymasterData || '0x',
          paymasterVerificationGasLimit: v07Response.paymasterVerificationGasLimit,
          paymasterPostOpGasLimit: v07Response.paymasterPostOpGasLimit,
          callGasLimit: v07Response.callGasLimit || userOp.callGasLimit,
          verificationGasLimit: v07Response.verificationGasLimit || userOp.verificationGasLimit,
          preVerificationGas: v07Response.preVerificationGas || userOp.preVerificationGas,
          maxFeePerGas: v07Response.maxFeePerGas || userOp.maxFeePerGas,
          maxPriorityFeePerGas: v07Response.maxPriorityFeePerGas || userOp.maxPriorityFeePerGas,
        } as UserOperationV07;
      }

      return userOp as UserOperationV06 | UserOperationV07;
    } catch (error) {
      console.error('Failed to prepare sponsored user operation:', error);
      // Return the original user operation if sponsorship fails
      return userOp as UserOperationV06 | UserOperationV07;
    }
  }, [shouldSponsorGas, gasManagerService, policyId, chainId]);

  /**
   * Get gas sponsorship data for a transaction
   */
  const getGasSponsorshipData = useCallback(async (
    transactionData: TransactionData,
    senderAddress: string,
    options: SponsoredTransactionOptions = {}
  ): Promise<GasSponsorshipResult> => {
    if (!shouldSponsorGas || !gasManagerService || !policyId) {
      return { isSponsored: false };
    }

    try {
      const entryPointVersion = options.entryPointVersion || '0.7';
      const entryPoint = gasManagerService.getEntryPointAddress(entryPointVersion);
      const dummySignature = gasManagerService.getDummySignature();

      // Create a basic user operation for gas estimation
      const userOp: Partial<UserOperationV06 | UserOperationV07> = {
        sender: senderAddress as `0x${string}`,
        nonce: '0x0', // This should be fetched from the smart account
        callData: transactionData.data,
        signature: dummySignature,
      };

      // Add value if specified
      if (transactionData.value && transactionData.value > 0n) {
        // For transactions with value, we need to handle it appropriately
        // This might require encoding the value into the callData depending on the implementation
      }

      const requestParams = {
        policyId,
        entryPoint,
        dummySignature,
        userOperation: userOp as UserOperationV06 | UserOperationV07,
        overrides: options.overrides,
        webhookData: options.webhookData,
      };

      const response = await gasManagerService.requestGasAndPaymasterAndData(requestParams);

      if (entryPointVersion === '0.6' && response.entrypointV06Response) {
        const v06Response = response.entrypointV06Response;
        return {
          isSponsored: true,
          paymasterAndData: v06Response.paymasterAndData,
          gasLimits: {
            callGasLimit: v06Response.callGasLimit,
            verificationGasLimit: v06Response.verificationGasLimit,
            preVerificationGas: v06Response.preVerificationGas,
          },
          feeData: {
            maxFeePerGas: v06Response.maxFeePerGas,
            maxPriorityFeePerGas: v06Response.maxPriorityFeePerGas,
          },
        };
      } else if (entryPointVersion === '0.7' && response.entrypointV07Response) {
        const v07Response = response.entrypointV07Response;
        return {
          isSponsored: true,
          paymaster: v07Response.paymaster,
          paymasterData: v07Response.paymasterData,
          gasLimits: {
            callGasLimit: v07Response.callGasLimit,
            verificationGasLimit: v07Response.verificationGasLimit,
            preVerificationGas: v07Response.preVerificationGas,
            paymasterVerificationGasLimit: v07Response.paymasterVerificationGasLimit,
            paymasterPostOpGasLimit: v07Response.paymasterPostOpGasLimit,
          },
          feeData: {
            maxFeePerGas: v07Response.maxFeePerGas,
            maxPriorityFeePerGas: v07Response.maxPriorityFeePerGas,
          },
        };
      }

      return { isSponsored: false };
    } catch (error) {
      console.error('Failed to get gas sponsorship data:', error);
      return { isSponsored: false };
    }
  }, [shouldSponsorGas, gasManagerService, policyId, chainId]);

  /**
   * Check if a transaction can be sponsored
   */
  const canSponsorTransaction = useCallback(async (
    transactionData: TransactionData,
    senderAddress: string,
    options: SponsoredTransactionOptions = {}
  ): Promise<boolean> => {
    const result = await getGasSponsorshipData(transactionData, senderAddress, options);
    return result.isSponsored;
  }, [getGasSponsorshipData]);

  return {
    // State
    shouldSponsorGas,
    isGasSponsorshipAvailable: !!gasManagerService && !!policyId,
    policyId,
    chainId,

    // Functions
    prepareUserOperation,
    getGasSponsorshipData,
    canSponsorTransaction,

    // Service instance (for advanced usage)
    gasManagerService,
  };
}
