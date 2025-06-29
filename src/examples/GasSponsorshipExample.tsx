/**
 * Example component demonstrating enhanced gas sponsorship integration
 * This shows how to use the new gas sponsorship features across the application
 */

import React, { useState, useCallback } from 'react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { useGasSponsorship } from '@/hooks/useGasSponsorship';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';
import { ethers } from 'ethers';

// Example contract ABI for demonstration
const EXAMPLE_CONTRACT_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

export const GasSponsorshipExample: React.FC = () => {
  const { address, walletType } = useUserAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Enhanced smart account client with gas sponsorship
  const {
    client,
    isGasSponsored,
    isClientReady,
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  } = useSmartAccountClientSafe();

  // Direct gas sponsorship utilities
  const {
    shouldSponsorGas,
    isGasSponsorshipAvailable,
    getGasSponsorshipData,
    canSponsorTransaction: canSponsorTx,
  } = useGasSponsorship();

  /**
   * Example 1: Basic sponsored transaction
   */
  const handleBasicSponsoredTransaction = useCallback(async () => {
    if (!address || !isClientReady) {
      setResult('Wallet not connected or client not ready');
      return;
    }

    setIsLoading(true);
    try {
      // Example: Transfer tokens with gas sponsorship
      const iface = new ethers.Interface(EXAMPLE_CONTRACT_ABI);
      const data = iface.encodeFunctionData("transfer", [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // recipient
        ethers.parseEther("1.0") // amount
      ]) as `0x${string}`;

      const transactionData = {
        target: "0x1234567890123456789012345678901234567890" as `0x${string}`, // example contract
        data,
        value: 0n,
      };

      // For gasless users, use sponsored transaction
      if (isGasSponsored && walletType === WalletType.MINIMAL) {
        const result = await executeSponsoredTransaction(transactionData, {
          waitForTxn: true,
        });
        setResult(`Sponsored transaction successful: ${result.hash}`);
      } else {
        // Fallback to regular transaction
        const result = await executeTransaction(transactionData);
        setResult(`Regular transaction successful: ${result.hash}`);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setResult(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    isClientReady,
    isGasSponsored,
    walletType,
    executeSponsoredTransaction,
    executeTransaction,
  ]);

  /**
   * Example 2: Check if transaction can be sponsored before executing
   */
  const handleCheckAndExecute = useCallback(async () => {
    if (!address || !isClientReady) {
      setResult('Wallet not connected or client not ready');
      return;
    }

    setIsLoading(true);
    try {
      const iface = new ethers.Interface(EXAMPLE_CONTRACT_ABI);
      const data = iface.encodeFunctionData("approve", [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // spender
        ethers.parseEther("100.0") // amount
      ]) as `0x${string}`;

      const transactionData = {
        target: "0x1234567890123456789012345678901234567890" as `0x${string}`,
        data,
        value: 0n,
      };

      // Check if transaction can be sponsored
      const canSponsor = await canSponsorTransaction(transactionData);
      
      if (canSponsor) {
        setResult('Transaction can be sponsored, executing...');
        const result = await executeSponsoredTransaction(transactionData);
        setResult(`Sponsored transaction successful: ${result.hash}`);
      } else {
        setResult('Transaction cannot be sponsored, using regular transaction...');
        const result = await executeTransaction(transactionData);
        setResult(`Regular transaction successful: ${result.hash}`);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setResult(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    isClientReady,
    canSponsorTransaction,
    executeSponsoredTransaction,
    executeTransaction,
  ]);

  /**
   * Example 3: Get detailed gas sponsorship information
   */
  const handleGetSponsorshipInfo = useCallback(async () => {
    if (!address || !isClientReady) {
      setResult('Wallet not connected or client not ready');
      return;
    }

    setIsLoading(true);
    try {
      const iface = new ethers.Interface(EXAMPLE_CONTRACT_ABI);
      const data = iface.encodeFunctionData("transfer", [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        ethers.parseEther("0.5")
      ]) as `0x${string}`;

      const transactionData = {
        target: "0x1234567890123456789012345678901234567890" as `0x${string}`,
        data,
        value: 0n,
      };

      // Get detailed sponsorship information
      const sponsorshipData = await getGasSponsorshipData(transactionData, address, {
        entryPointVersion: '0.7',
      });

      if (sponsorshipData.isSponsored) {
        setResult(`
          Gas sponsorship available!
          Paymaster: ${sponsorshipData.paymaster || 'N/A'}
          Paymaster Data: ${sponsorshipData.paymasterData || 'N/A'}
          Call Gas Limit: ${sponsorshipData.gasLimits?.callGasLimit || 'N/A'}
          Max Fee Per Gas: ${sponsorshipData.feeData?.maxFeePerGas || 'N/A'}
        `);
      } else {
        setResult('Gas sponsorship not available for this transaction');
      }
    } catch (error) {
      console.error('Failed to get sponsorship info:', error);
      setResult(`Failed to get sponsorship info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [address, isClientReady, getGasSponsorshipData]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Gas Sponsorship Examples</h2>
      
      {/* Status Information */}
      <div className="mb-6 p-4 bg-white rounded border">
        <h3 className="text-lg font-semibold mb-2">Current Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Wallet Type: {walletType || 'Not connected'}</div>
          <div>Client Ready: {isClientReady ? 'Yes' : 'No'}</div>
          <div>Gas Sponsored: {isGasSponsored ? 'Yes' : 'No'}</div>
          <div>Should Sponsor Gas: {shouldSponsorGas ? 'Yes' : 'No'}</div>
          <div>Sponsorship Available: {isGasSponsorshipAvailable ? 'Yes' : 'No'}</div>
          <div>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={handleBasicSponsoredTransaction}
          disabled={isLoading || !isClientReady}
          className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Execute Basic Sponsored Transaction'}
        </button>

        <button
          onClick={handleCheckAndExecute}
          disabled={isLoading || !isClientReady}
          className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Check Sponsorship & Execute'}
        </button>

        <button
          onClick={handleGetSponsorshipInfo}
          disabled={isLoading || !isClientReady}
          className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Get Sponsorship Information'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 p-4 bg-white rounded border">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default GasSponsorshipExample;
