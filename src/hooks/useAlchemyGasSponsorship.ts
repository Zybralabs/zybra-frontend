/**
 * Alchemy Gas Sponsorship Hook - Official Implementation
 * Uses the exact Alchemy Gas Manager API flow from documentation
 * https://www.alchemy.com/docs/reference/how-to-sponsor-gas-on-evm
 */

import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { getGasManagerPolicyId } from '@/config';
import {
  createGasManagerService,
  AlchemyGasManagerService,
  type AlchemyGasManagerRequest,
  type AlchemyGasManagerResponse,
  type UserOperationV06,
  type UserOperationV07,
  type AlchemyGasOverrides
} from '@/services/gasManager';
import { ethers } from 'ethers';

export interface AlchemyTransactionData {
  target: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export interface AlchemyGasSponsorshipOptions {
  entryPointVersion?: '0.6' | '0.7';
  overrides?: AlchemyGasOverrides;
  webhookData?: string;
  forceSponsorship?: boolean;
}

export interface AlchemyGasSponsorshipResult {
  isSponsored: boolean;
  userOperation?: UserOperationV06 | UserOperationV07;
  gasManagerResponse?: AlchemyGasManagerResponse;
  entryPointAddress?: string;
  error?: string;
}

/**
 * Hook for Alchemy Gas Manager integration
 */
export function useAlchemyGasSponsorship() {
  const chainId = useChainId();
  const { walletType, address } = useUserAccount();

  // Get policy ID for current chain
  const policyId = useMemo(() => {
    return getGasManagerPolicyId(chainId);
  }, [chainId]);

  // Get Alchemy API key
  const alchemyApiKey = useMemo(() => {
    return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  }, []);

  // Determine if gas sponsorship should be attempted
  const shouldAttemptSponsorship = useMemo(() => {
    return (
      walletType === WalletType.MINIMAL &&
      !!policyId &&
      !!alchemyApiKey &&
      !!address
    );
  }, [walletType, policyId, alchemyApiKey, address]);

  // Create gas manager service instance
  const gasManagerService = useMemo(() => {
    if (!alchemyApiKey) {
      console.warn('Alchemy API key not found for gas sponsorship');
      return null;
    }

    try {
      return createGasManagerService(alchemyApiKey, chainId);
    } catch (error) {
      console.error('Failed to create Gas Manager service:', error);
      return null;
    }
  }, [alchemyApiKey, chainId]);

  /**
   * Get gas sponsorship for a transaction
   */
  const getGasSponsorship = useCallback(async (
    transactionData: AlchemyTransactionData,
    userAddress: string,
    options: AlchemyGasSponsorshipOptions = {}
  ): Promise<AlchemyGasSponsorshipResult> => {
    if (!shouldAttemptSponsorship || !gasManagerService || !policyId) {
      return {
        isSponsored: false,
        error: 'Gas sponsorship not available',
      };
    }

    const {
      entryPointVersion = '0.7',
      overrides,
      webhookData,
    } = options;

    try {
      console.log('Requesting gas sponsorship from Alchemy:', {
        policyId,
        entryPointVersion,
        userAddress,
        target: transactionData.target,
        chainId,
      });

      // Get EntryPoint address
      const entryPointAddress = gasManagerService.getEntryPointAddress(entryPointVersion);

      // Create UserOperation based on version
      let userOperation: UserOperationV06 | UserOperationV07;
      
      if (entryPointVersion === '0.6') {
        userOperation = gasManagerService.createUserOperationV06({
          sender: userAddress,
          nonce: '0x0', // This will be filled by the smart account client
          callData: transactionData.data,
        });
      } else {
        userOperation = gasManagerService.createUserOperationV07({
          sender: userAddress,
          nonce: '0x0', // This will be filled by the smart account client
          callData: transactionData.data,
        });
      }

      // Prepare request for Alchemy Gas Manager
      const gasManagerRequest: AlchemyGasManagerRequest = {
        policyId,
        entryPoint: entryPointAddress,
        dummySignature: gasManagerService.getDummySignature(),
        userOperation,
        ...(overrides && { overrides }),
        ...(webhookData && { webhookData }),
      };

      // Call Alchemy Gas Manager API
      const gasManagerResponse = await gasManagerService.requestGasAndPaymasterAndData(gasManagerRequest);

      // Apply sponsorship data to UserOperation
      let sponsoredUserOperation: UserOperationV06 | UserOperationV07;
      
      if (entryPointVersion === '0.6') {
        if (!gasManagerResponse.entrypointV06Response) {
          throw new Error('No EntryPoint v0.6 response from Alchemy Gas Manager');
        }
        sponsoredUserOperation = gasManagerService.applySponsorshipV06(
          userOperation as UserOperationV06,
          gasManagerResponse
        );
      } else {
        if (!gasManagerResponse.entrypointV07Response) {
          throw new Error('No EntryPoint v0.7 response from Alchemy Gas Manager');
        }
        sponsoredUserOperation = gasManagerService.applySponsorshipV07(
          userOperation as UserOperationV07,
          gasManagerResponse
        );
      }

      console.log('Gas sponsorship successful:', {
        entryPointVersion,
        hasPaymaster: entryPointVersion === '0.6' 
          ? !!gasManagerResponse.entrypointV06Response?.paymasterAndData
          : !!gasManagerResponse.entrypointV07Response?.paymaster,
        gasLimits: entryPointVersion === '0.6'
          ? {
              callGasLimit: gasManagerResponse.entrypointV06Response?.callGasLimit,
              verificationGasLimit: gasManagerResponse.entrypointV06Response?.verificationGasLimit,
            }
          : {
              callGasLimit: gasManagerResponse.entrypointV07Response?.callGasLimit,
              verificationGasLimit: gasManagerResponse.entrypointV07Response?.verificationGasLimit,
            },
      });

      return {
        isSponsored: true,
        userOperation: sponsoredUserOperation,
        gasManagerResponse,
        entryPointAddress,
      };

    } catch (error) {
      console.error('Gas sponsorship failed:', error);
      return {
        isSponsored: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [shouldAttemptSponsorship, gasManagerService, policyId, chainId]);

  /**
   * Check if a transaction can be sponsored
   */
  const canSponsorTransaction = useCallback(async (
    transactionData: AlchemyTransactionData,
    userAddress: string,
    options: AlchemyGasSponsorshipOptions = {}
  ): Promise<boolean> => {
    if (!shouldAttemptSponsorship) {
      return false;
    }

    try {
      const result = await getGasSponsorship(transactionData, userAddress, options);
      return result.isSponsored;
    } catch (error) {
      console.error('Failed to check transaction sponsorship:', error);
      return false;
    }
  }, [shouldAttemptSponsorship, getGasSponsorship]);

  /**
   * Prepare a sponsored UserOperation for sending
   */
  const prepareSponsoredUserOperation = useCallback(async (
    transactionData: AlchemyTransactionData,
    userAddress: string,
    options: AlchemyGasSponsorshipOptions = {}
  ): Promise<{
    userOperation: any;
    isSponsored: boolean;
    entryPointAddress?: string;
  }> => {
    const sponsorshipResult = await getGasSponsorship(transactionData, userAddress, options);

    if (sponsorshipResult.isSponsored && sponsorshipResult.userOperation) {
      // Convert to the format expected by Account Kit
      const userOp = {
        target: transactionData.target,
        data: transactionData.data,
        value: transactionData.value || 0n,
      };

      // Apply sponsorship data based on EntryPoint version
      const entryPointVersion = options.entryPointVersion || '0.7';
      
      if (entryPointVersion === '0.6' && sponsorshipResult.gasManagerResponse?.entrypointV06Response) {
        const v06Response = sponsorshipResult.gasManagerResponse.entrypointV06Response;
        return {
          userOperation: {
            ...userOp,
            paymasterAndData: v06Response.paymasterAndData,
            callGasLimit: v06Response.callGasLimit,
            verificationGasLimit: v06Response.verificationGasLimit,
            preVerificationGas: v06Response.preVerificationGas,
            maxFeePerGas: v06Response.maxFeePerGas,
            maxPriorityFeePerGas: v06Response.maxPriorityFeePerGas,
          },
          isSponsored: true,
          entryPointAddress: sponsorshipResult.entryPointAddress,
        };
      } else if (entryPointVersion === '0.7' && sponsorshipResult.gasManagerResponse?.entrypointV07Response) {
        const v07Response = sponsorshipResult.gasManagerResponse.entrypointV07Response;
        return {
          userOperation: {
            ...userOp,
            paymaster: v07Response.paymaster,
            paymasterData: v07Response.paymasterData,
            paymasterVerificationGasLimit: v07Response.paymasterVerificationGasLimit,
            paymasterPostOpGasLimit: v07Response.paymasterPostOpGasLimit,
            callGasLimit: v07Response.callGasLimit,
            verificationGasLimit: v07Response.verificationGasLimit,
            preVerificationGas: v07Response.preVerificationGas,
            maxFeePerGas: v07Response.maxFeePerGas,
            maxPriorityFeePerGas: v07Response.maxPriorityFeePerGas,
          },
          isSponsored: true,
          entryPointAddress: sponsorshipResult.entryPointAddress,
        };
      }
    }

    // Return regular UserOperation if sponsorship failed
    return {
      userOperation: {
        target: transactionData.target,
        data: transactionData.data,
        value: transactionData.value || 0n,
      },
      isSponsored: false,
    };
  }, [getGasSponsorship]);

  return {
    // State
    shouldAttemptSponsorship,
    isGasSponsorshipAvailable: !!gasManagerService,
    policyId,
    chainId,
    walletType,

    // Functions
    getGasSponsorship,
    canSponsorTransaction,
    prepareSponsoredUserOperation,

    // Utilities
    gasManagerService,
  };
}
