/**
 * Real Gas Sponsorship Hook - EIP-4337 Compliant Implementation
 * 
 * This hook provides proper gas sponsorship integration following:
 * - EIP-4337: Account Abstraction Using Alt Mempool
 * - Alchemy's Account Kit best practices
 * - Real UserOperation creation with actual transaction data
 * 
 * Key Features:
 * - Creates real UserOperations (not dummy operations)
 * - Proper nonce management from smart account
 * - Correct gas estimation and sponsorship
 * - Integration with Alchemy's middleware
 * - EIP-4337 compliant transaction flow
 */

import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { getGasManagerPolicyId } from '@/config';
import { 
  createGasManagerService, 
  type RealTransactionData, 
  type SmartAccountContext,
  type AlchemyGasManagerResponse,
  type AlchemyGasOverrides
} from '@/services/gasManager';
import { type Address, type Hex } from 'viem';

export interface RealGasSponsorshipOptions {
  entryPointVersion?: '0.6' | '0.7';
  overrides?: AlchemyGasOverrides;
  webhookData?: string;
  forceSponsorship?: boolean;
}

export interface RealGasSponsorshipResult {
  isSponsored: boolean;
  userOperation?: any;
  gasManagerResponse?: AlchemyGasManagerResponse;
  entryPointAddress?: Address;
  error?: string;
}

/**
 * Hook for real gas sponsorship with EIP-4337 compliance
 */
export function useRealGasSponsorship() {
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

  // Create gas manager service
  const gasManagerService = useMemo(() => {
    if (!alchemyApiKey) {
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
   * Get smart account context for UserOperation creation
   */
  const getSmartAccountContext = useCallback(async (
    smartAccountClient: any
  ): Promise<SmartAccountContext | null> => {
    if (!smartAccountClient || !address) {
      return null;
    }

    try {
      // Get account nonce from the smart account client
      const nonce = await smartAccountClient.account.getNonce();
      
      // Check if account is deployed
      const code = await smartAccountClient.getCode({ address });
      const isDeployed = code && code !== '0x';

      let initCode: Hex | undefined;
      let factory: Address | undefined;
      let factoryData: Hex | undefined;

      // If account is not deployed, get factory information
      if (!isDeployed && smartAccountClient.account.getFactoryAddress) {
        factory = await smartAccountClient.account.getFactoryAddress();
        if (factory && smartAccountClient.account.getFactoryData) {
          factoryData = await smartAccountClient.account.getFactoryData();
          if (factoryData) {
            initCode = `${factory}${factoryData.slice(2)}` as Hex;
          }
        }
      }

      return {
        address: address as Address,
        nonce: BigInt(nonce),
        initCode,
        factory,
        factoryData,
      };
    } catch (error) {
      console.error('Failed to get smart account context:', error);
      return null;
    }
  }, [address]);

  /**
   * Request real gas sponsorship for a transaction
   */
  const requestRealGasSponsorship = useCallback(async (
    transactionData: RealTransactionData,
    smartAccountClient: any,
    options: RealGasSponsorshipOptions = {}
  ): Promise<RealGasSponsorshipResult> => {
    if (!shouldAttemptSponsorship || !gasManagerService || !policyId) {
      return {
        isSponsored: false,
        error: 'Gas sponsorship not available',
      };
    }

    try {
      console.log('Requesting real gas sponsorship:', {
        policyId,
        target: transactionData.target,
        chainId,
        walletType,
      });

      // Get smart account context
      const accountContext = await getSmartAccountContext(smartAccountClient);
      if (!accountContext) {
        throw new Error('Failed to get smart account context');
      }

      console.log('Smart account context:', {
        address: accountContext.address,
        nonce: accountContext.nonce.toString(),
        isDeployed: !accountContext.initCode,
      });

      // Request gas sponsorship with real transaction data
      const gasManagerResponse = await gasManagerService.requestRealGasSponsorship(
        transactionData,
        accountContext,
        policyId,
        {
          entryPointVersion: options.entryPointVersion || '0.7',
          overrides: options.overrides,
          webhookData: options.webhookData,
        }
      );

      // Get EntryPoint address
      const entryPointAddress = gasManagerService.getEntryPointAddress(
        options.entryPointVersion || '0.7'
      );

      console.log('Real gas sponsorship successful:', {
        entryPointVersion: options.entryPointVersion || '0.7',
        hasV06Response: !!gasManagerResponse.entrypointV06Response,
        hasV07Response: !!gasManagerResponse.entrypointV07Response,
        entryPointAddress,
      });

      // Convert to Account Kit format
      const userOperation = {
        target: transactionData.target,
        data: transactionData.data,
        value: transactionData.value || 0n,
      };

      return {
        isSponsored: true,
        userOperation,
        gasManagerResponse,
        entryPointAddress,
      };

    } catch (error) {
      console.error('Real gas sponsorship failed:', error);
      return {
        isSponsored: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [shouldAttemptSponsorship, gasManagerService, policyId, chainId, getSmartAccountContext]);

  /**
   * Check if a transaction can be sponsored
   */
  const canSponsorTransaction = useCallback(async (
    transactionData: RealTransactionData,
    smartAccountClient: any,
    options: RealGasSponsorshipOptions = {}
  ): Promise<boolean> => {
    if (!shouldAttemptSponsorship) {
      return false;
    }

    try {
      const result = await requestRealGasSponsorship(transactionData, smartAccountClient, options);
      return result.isSponsored;
    } catch (error) {
      console.error('Failed to check transaction sponsorship:', error);
      return false;
    }
  }, [shouldAttemptSponsorship, requestRealGasSponsorship]);

  return {
    // State
    shouldAttemptSponsorship,
    isGasSponsorshipAvailable: !!gasManagerService,
    policyId,
    chainId,
    walletType,

    // Functions
    requestRealGasSponsorship,
    canSponsorTransaction,
    getSmartAccountContext,

    // Utilities
    gasManagerService,
  };
}
