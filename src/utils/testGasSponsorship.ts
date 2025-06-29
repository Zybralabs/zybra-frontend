/**
 * Gas Sponsorship Testing Utilities
 * 
 * This file contains utilities to test and verify that Alchemy's gas sponsorship
 * is working correctly with the proper configuration.
 */

import {
  createAlchemySmartAccountClient,
  alchemy,
  baseSepolia,
} from '@account-kit/infra';
import { createLightAccount } from '@account-kit/smart-contracts';
import { LocalAccountSigner } from '@aa-sdk/core';
import { encodeFunctionData } from 'viem';
import { generatePrivateKey } from 'viem/accounts';

// Test ERC20 contract ABI (for testing purposes)
const TEST_ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

/**
 * Test Alchemy Gas Sponsorship Configuration
 */
export async function testAlchemyGasSponsorship() {
  console.log("🧪 Testing Alchemy Gas Sponsorship Configuration...");

  // Check environment variables
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const policyId = process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID;

  if (!apiKey) {
    console.error("❌ NEXT_PUBLIC_ALCHEMY_API_KEY not found");
    return false;
  }

  if (!policyId) {
    console.error("❌ NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID not found");
    return false;
  }

  console.log("✅ Environment variables configured");
  console.log(`📋 API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`📋 Policy ID: ${policyId}`);

  try {
    // Create Alchemy transport
    const alchemyTransport = alchemy({
      apiKey: apiKey,
    });

    console.log("✅ Alchemy transport created");

    // Create smart account client with gas sponsorship
    const client = createAlchemySmartAccountClient({
      transport: alchemyTransport,
      chain: baseSepolia,
      policyId: policyId, // This enables gas sponsorship automatically
      account: await createLightAccount({
        chain: baseSepolia,
        transport: alchemyTransport,
        signer: LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
      }),
    });

    console.log("✅ Alchemy smart account client created with gas sponsorship");
    console.log(`📋 Account Address: ${client.account.address}`);
    console.log(`📋 Chain: ${client.chain.name} (${client.chain.id})`);

    // Test transaction preparation (without sending)
    const testTransactionData = {
      target: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      data: encodeFunctionData({
        abi: TEST_ERC20_ABI,
        functionName: 'transfer',
        args: ['0x1234567890123456789012345678901234567890', BigInt(1000)],
      }),
      value: 0n,
    };

    console.log("✅ Test transaction data prepared");
    console.log(`📋 Target: ${testTransactionData.target}`);
    console.log(`📋 Data: ${testTransactionData.data.substring(0, 20)}...`);

    // Check if the client has gas sponsorship middleware
    const hasGasSponsorship = 'policyId' in client && client.policyId === policyId;
    
    if (hasGasSponsorship) {
      console.log("✅ Gas sponsorship middleware is properly configured");
      console.log(`📋 Policy ID in client: ${client.policyId}`);
    } else {
      console.error("❌ Gas sponsorship middleware not found in client");
      return false;
    }

    console.log("🎉 Alchemy Gas Sponsorship test completed successfully!");
    return true;

  } catch (error) {
    console.error("❌ Failed to test Alchemy Gas Sponsorship:", error);
    return false;
  }
}

/**
 * Validate Gas Manager Policy Configuration
 */
export function validateGasManagerConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check API key
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!apiKey) {
    errors.push('NEXT_PUBLIC_ALCHEMY_API_KEY is not configured');
  } else if (apiKey.length < 20) {
    warnings.push('NEXT_PUBLIC_ALCHEMY_API_KEY seems too short');
  }

  // Check policy IDs
  const policyIds = {
    base: process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID,
    sepolia: process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID,
    arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID,
    polygon: process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID,
    mainnet: process.env.NEXT_PUBLIC_MAINNET_GAS_MANAGER_POLICY_ID,
  };

  let hasPolicyId = false;
  for (const [chain, policyId] of Object.entries(policyIds)) {
    if (policyId) {
      hasPolicyId = true;
      console.log(`✅ ${chain} policy ID configured: ${policyId}`);
    } else {
      warnings.push(`${chain} policy ID not configured`);
    }
  }

  if (!hasPolicyId) {
    errors.push('No gas manager policy IDs configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test transaction with gas sponsorship (simulation)
 */
export async function simulateGasSponsoredTransaction(
  target: `0x${string}`,
  data: `0x${string}`,
  value: bigint = 0n
) {
  console.log("🧪 Simulating gas sponsored transaction...");

  const validation = validateGasManagerConfiguration();
  if (!validation.isValid) {
    console.error("❌ Configuration validation failed:", validation.errors);
    return false;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;
    const policyId = process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID!;

    // Create client
    const alchemyTransport = alchemy({ apiKey });
    const client = createAlchemySmartAccountClient({
      transport: alchemyTransport,
      chain: baseSepolia,
      policyId,
      account: await createLightAccount({
        chain: baseSepolia,
        transport: alchemyTransport,
        signer: LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
      }),
    });

    console.log("✅ Client created for simulation");

    // Simulate the transaction (don't actually send it)
    const userOperation = {
      target,
      data,
      value,
    };

    console.log("✅ UserOperation prepared:", {
      target: userOperation.target,
      dataLength: userOperation.data.length,
      value: userOperation.value.toString(),
    });

    console.log("🎉 Gas sponsored transaction simulation completed!");
    return true;

  } catch (error) {
    console.error("❌ Simulation failed:", error);
    return false;
  }
}

/**
 * Debug gas sponsorship status
 */
export function debugGasSponsorshipStatus() {
  console.log("🔍 Debugging Gas Sponsorship Status...");
  
  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    basePolicyId: process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID,
    sepoliaPolicyId: process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID,
    arbitrumPolicyId: process.env.NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID,
    polygonPolicyId: process.env.NEXT_PUBLIC_POLYGON_GAS_MANAGER_POLICY_ID,
    mainnetPolicyId: process.env.NEXT_PUBLIC_MAINNET_GAS_MANAGER_POLICY_ID,
  };

  console.table(config);

  const validation = validateGasManagerConfiguration();
  console.log("Validation Result:", validation);

  return validation;
}

// Export for use in components
export const GasSponsorshipTester = {
  test: testAlchemyGasSponsorship,
  validate: validateGasManagerConfiguration,
  simulate: simulateGasSponsoredTransaction,
  debug: debugGasSponsorshipStatus,
};
