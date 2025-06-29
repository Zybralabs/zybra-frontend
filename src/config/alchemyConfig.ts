/**
 * Alchemy Account Kit Configuration - Official Implementation
 * 
 * This configuration follows Alchemy's best practices for:
 * - Smart Account Client creation with built-in gas sponsorship
 * - Proper middleware integration
 * - EIP-4337 compliant transaction flow
 * 
 * References:
 * - https://www.alchemy.com/docs/wallets/infra/sponsor-gas
 * - https://www.alchemy.com/docs/wallets/reference/account-kit/infra/functions/alchemyGasAndPaymasterAndDataMiddleware
 * - https://www.alchemy.com/docs/wallets/infra/quickstart
 */

import {
  createAlchemySmartAccountClient,
  alchemy,
  type AlchemySmartAccountClient,
  type AlchemyTransport,
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  polygon,
  mainnet,
} from '@account-kit/infra';
import { createLightAccount } from '@account-kit/smart-contracts';
import { LocalAccountSigner } from '@aa-sdk/core';
import { generatePrivateKey } from 'viem/accounts';
import type { Chain } from 'viem';

// Supported chains with gas manager policies
export const SUPPORTED_CHAINS = {
  baseSepolia: {
    chain: baseSepolia,
    policyId: process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID,
  },
  sepolia: {
    chain: sepolia,
    policyId: process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID,
  },
  arbitrumSepolia: {
    chain: arbitrumSepolia,
    policyId: process.env.NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID,
  },
  polygon: {
    chain: polygon,
    policyId: process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID,
  },
  mainnet: {
    chain: mainnet,
    policyId: process.env.NEXT_PUBLIC_MAINNET_GAS_MANAGER_POLICY_ID,
  },
} as const;

/**
 * Create Alchemy Smart Account Client with built-in gas sponsorship
 * 
 * This is the official way to create a smart account client with gas sponsorship
 * according to Alchemy's documentation. The gas sponsorship middleware is
 * automatically included when policyId is provided.
 */
export async function createAlchemySmartAccountWithGasSponsorship(
  chain: Chain,
  policyId?: string,
  apiKey?: string
): Promise<AlchemySmartAccountClient> {
  const alchemyApiKey = apiKey || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  
  if (!alchemyApiKey) {
    throw new Error('Alchemy API key is required');
  }

  // Create Alchemy transport
  const alchemyTransport = alchemy({
    apiKey: alchemyApiKey,
  });

  // Create smart account client with built-in gas sponsorship
  const client = createAlchemySmartAccountClient({
    transport: alchemyTransport,
    chain,
    // Gas sponsorship is automatically enabled when policyId is provided
    ...(policyId && { policyId }),
    account: await createLightAccount({
      chain,
      transport: alchemyTransport,
      signer: LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
    }),
  });

  return client;
}

/**
 * Create Alchemy Smart Account Client with gas sponsorship
 *
 * Uses the built-in gas sponsorship configuration through policyId
 */
export async function createAlchemySmartAccountWithCustomGasManager(
  chain: Chain,
  policyId: string,
  apiKey?: string
): Promise<AlchemySmartAccountClient> {
  const alchemyApiKey = apiKey || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  if (!alchemyApiKey) {
    throw new Error('Alchemy API key is required');
  }

  if (!policyId) {
    throw new Error('Policy ID is required for gas sponsorship');
  }

  // Create Alchemy transport
  const alchemyTransport = alchemy({
    apiKey: alchemyApiKey,
  });

  // Create smart account client with gas sponsorship
  const client = createAlchemySmartAccountClient({
    transport: alchemyTransport,
    chain,
    policyId, // Built-in gas sponsorship
    account: await createLightAccount({
      chain,
      transport: alchemyTransport,
      signer: LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
    }),
  });

  return client;
}

/**
 * Get gas manager policy ID for a specific chain
 */
export function getGasManagerPolicyId(chainId: number): string | undefined {
  switch (chainId) {
    case baseSepolia.id:
      return SUPPORTED_CHAINS.baseSepolia.policyId;
    case sepolia.id:
      return SUPPORTED_CHAINS.sepolia.policyId;
    case arbitrumSepolia.id:
      return SUPPORTED_CHAINS.arbitrumSepolia.policyId;
    case polygon.id:
      return SUPPORTED_CHAINS.polygon.policyId;
    case mainnet.id:
      return SUPPORTED_CHAINS.mainnet.policyId;
    default:
      console.warn(`No gas manager policy configured for chain ID: ${chainId}`);
      return undefined;
  }
}

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number) {
  const chainConfigs = Object.values(SUPPORTED_CHAINS);
  return chainConfigs.find(config => config.chain.id === chainId);
}

/**
 * Check if gas sponsorship is available for a chain
 */
export function isGasSponsorshipAvailable(chainId: number): boolean {
  const policyId = getGasManagerPolicyId(chainId);
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  
  return !!(policyId && apiKey);
}

/**
 * Example usage for transaction execution with built-in gas sponsorship
 */
export async function executeTransactionWithBuiltInSponsorship(
  client: AlchemySmartAccountClient,
  transactionData: {
    target: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }
) {
  if (!client.account) {
    throw new Error('Smart account client does not have an account configured');
  }

  // With Alchemy's built-in gas sponsorship, you just send the transaction
  // The middleware automatically handles gas sponsorship if policy is configured
  const result = await client.sendUserOperation({
    account: client.account,
    uo: {
      target: transactionData.target,
      data: transactionData.data,
      value: transactionData.value || 0n,
    },
  });

  console.log('Transaction sent with automatic gas sponsorship:', {
    hash: result.hash,
    request: result.request,
  });

  return result;
}

/**
 * Configuration validation
 */
export function validateAlchemyConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check API key
  if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    errors.push('NEXT_PUBLIC_ALCHEMY_API_KEY is not configured');
  }

  // Check policy IDs
  const chainConfigs = Object.entries(SUPPORTED_CHAINS);
  for (const [chainName, config] of chainConfigs) {
    if (!config.policyId) {
      warnings.push(`Gas manager policy ID not configured for ${chainName}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export types for use in other files
export type { AlchemySmartAccountClient, AlchemyTransport };
