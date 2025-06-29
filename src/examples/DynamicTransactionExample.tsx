/**
 * Dynamic Transaction Integration Examples
 * Shows how to use the new dynamic transaction system without changing existing component logic
 */

import React, { useState } from 'react';
import { useUniversalTransaction } from '@/context/UniversalTransactionContext';
import { useDynamicTransaction } from '@/hooks/useDynamicTransaction';
import { useMigratedWriteContract, useMigratedMintTransaction } from '@/utils/transactionMigration';

// Example 1: Using Universal Transaction Context (No component changes needed)
export const UniversalTransactionExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // This automatically handles gas sponsorship for abstract wallets
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();

  const handleMintToken = async () => {
    setIsLoading(true);
    try {
      // This will automatically use gas sponsorship if available
      const result = await executeTransaction({
        contractAddress: "0x1234567890123456789012345678901234567890",
        abi: [
          "function claimTokens(uint256 tokenIndex) external",
        ],
        functionName: "claimTokens",
        args: [0], // tokenIndex
        options: {
          // Optional: customize gas multipliers
          gasMultipliers: {
            callGasLimit: 1.2,
            verificationGasLimit: 1.1,
          },
          // Optional: callbacks
          onSponsorshipApplied: (data: any) => {
            console.log('Gas sponsorship applied:', data);
          },
          onFallback: (reason: string) => {
            console.log('Fallback to regular transaction:', reason);
          },
        },
      });

      setResult(`Transaction successful: ${result.hash}`);
    } catch (error) {
      setResult(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Universal Transaction Example</h3>
      <p className="mb-4">
        Gas Sponsorship: {shouldUseSponsorship ? 'Enabled' : 'Disabled'}
      </p>
      <button
        onClick={handleMintToken}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Mint Token (Auto Sponsored)'}
      </button>
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

// Example 2: Using Dynamic Transaction Hook (Minimal component changes)
export const DynamicTransactionExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Configure the hook for a specific contract
  const {
    executeFunction,
    checkFunctionSponsorship,
    shouldAttemptSponsorship,
  } = useDynamicTransaction({
    contractAddress: "0x1234567890123456789012345678901234567890",
    abi: [
      "function claimTokens(uint256 tokenIndex) external",
      "function transfer(address to, uint256 amount) external returns (bool)",
    ],
    enableSponsorship: true,
    autoRetry: true,
    maxRetries: 3,
    onTransactionSuccess: (result) => {
      setResult(`Transaction successful: ${result.hash}`);
    },
    onTransactionError: (error) => {
      setResult(`Transaction failed: ${error.message}`);
    },
    onSponsorshipApplied: (data) => {
      console.log('Sponsorship applied:', data);
    },
  });

  const handleClaimTokens = async () => {
    setIsLoading(true);
    try {
      // Check if sponsorship is available (optional)
      const sponsorshipCheck = await checkFunctionSponsorship('claimTokens', [0]);
      console.log('Sponsorship check:', sponsorshipCheck);

      // Execute the function - sponsorship is handled automatically
      await executeFunction('claimTokens', [0]);
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    setIsLoading(true);
    try {
      await executeFunction('transfer', [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // to
        "1000000000000000000" // 1 token (18 decimals)
      ]);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Dynamic Transaction Hook Example</h3>
      <p className="mb-4">
        Sponsorship Available: {shouldAttemptSponsorship ? 'Yes' : 'No'}
      </p>
      <div className="space-y-2">
        <button
          onClick={handleClaimTokens}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Claim Tokens'}
        </button>
        <button
          onClick={handleTransfer}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Transfer Tokens'}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

// Example 3: Migration of Existing Hook (Drop-in replacement)
export const MigratedHookExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Drop-in replacement for existing writeContract hook
  const { writeContractAsync } = useMigratedWriteContract();

  // Drop-in replacement for existing mint transaction hook
  const { claimTokens } = useMigratedMintTransaction(
    "0x1234567890123456789012345678901234567890"
  );

  const handleWriteContract = async () => {
    setIsLoading(true);
    try {
      // This works exactly like the old writeContractAsync but with automatic gas sponsorship
      const result = await writeContractAsync({
        address: "0x1234567890123456789012345678901234567890",
        abi: [
          "function claimTokens(uint256 tokenIndex) external",
        ],
        functionName: "claimTokens",
        args: [0],
      });

      setResult(`Write contract successful: ${result.hash}`);
    } catch (error) {
      setResult(`Write contract failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigratedMint = async () => {
    setIsLoading(true);
    try {
      // This works exactly like the old mint function but with automatic gas sponsorship
      const result = await claimTokens(0);
      setResult(`Migrated mint successful: ${result.hash}`);
    } catch (error) {
      setResult(`Migrated mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Migrated Hook Example</h3>
      <p className="mb-4 text-sm text-gray-600">
        These functions work exactly like the original hooks but with automatic gas sponsorship
      </p>
      <div className="space-y-2">
        <button
          onClick={handleWriteContract}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Write Contract (Migrated)'}
        </button>
        <button
          onClick={handleMigratedMint}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Mint Token (Migrated)'}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

// Example 4: Batch Transactions
export const BatchTransactionExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const { executeBatchTransactions } = useUniversalTransaction();

  const handleBatchTransactions = async () => {
    setIsLoading(true);
    try {
      const transactions = [
        {
          contractAddress: "0x1234567890123456789012345678901234567890",
          abi: ["function claimTokens(uint256 tokenIndex) external"],
          functionName: "claimTokens",
          args: [0],
        },
        {
          contractAddress: "0x1234567890123456789012345678901234567890",
          abi: ["function claimTokens(uint256 tokenIndex) external"],
          functionName: "claimTokens",
          args: [1],
        },
        {
          contractAddress: "0x1234567890123456789012345678901234567890",
          abi: ["function claimTokens(uint256 tokenIndex) external"],
          functionName: "claimTokens",
          args: [2],
        },
      ];

      const results = await executeBatchTransactions(transactions);
      setResults(results);
    } catch (error) {
      console.error('Batch transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Batch Transaction Example</h3>
      <button
        onClick={handleBatchTransactions}
        disabled={isLoading}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Execute Batch Transactions'}
      </button>
      {results.length > 0 && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Batch Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="mb-2 text-sm">
              Transaction {index + 1}: {result.success ? '✅ Success' : '❌ Failed'}
              {result.success && result.result?.hash && (
                <span className="ml-2 text-gray-600">({result.result.hash.slice(0, 10)}...)</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main example component
export const DynamicTransactionExamples: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Dynamic Transaction Integration Examples</h2>
      <UniversalTransactionExample />
      <DynamicTransactionExample />
      <MigratedHookExample />
      <BatchTransactionExample />
    </div>
  );
};

export default DynamicTransactionExamples;
