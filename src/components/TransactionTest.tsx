"use client";

import React, { useState } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { WalletType } from '@/constant/account/enum';
import { SuccessModal, ErrorModal } from '@/components/Modal';
import { useChainId } from 'wagmi';

interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export const TransactionTest: React.FC = () => {
  const { walletType, address } = useUserAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const {
    client,
    isGasSponsored,
    isClientReady,
    executeTransaction,
    executeSponsoredTransaction,
  } = useSmartAccountClientSafe();

  const testTransaction = async () => {
    if (!address) {
      setResult({ success: false, error: "Wallet not connected" });
      setShowError(true);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log("Testing transaction execution:", {
        walletType,
        address,
        isClientReady,
        isGasSponsored,
        clientAddress: client?.account?.address,
      });

      // Create a simple test transaction (transfer 0 ETH to self)
      const testTransactionData = {
        target: address as `0x${string}`,
        data: "0x" as `0x${string}`,
        value: 0n,
      };

      let txResult;

      if (walletType === WalletType.MINIMAL) {
        if (!isClientReady) {
          throw new Error("Smart account client is not ready");
        }

        if (isGasSponsored) {
          try {
            console.log("Testing sponsored transaction...");
            txResult = await executeSponsoredTransaction(testTransactionData, {
              waitForTxn: true
            });
          } catch (sponsorError) {
            console.warn("Sponsored transaction failed, falling back:", sponsorError);
            txResult = await executeTransaction(testTransactionData, {
              waitForTxn: true
            });
          }
        } else {
          txResult = await executeTransaction(testTransactionData, {
            waitForTxn: true
          });
        }
      } else {
        // For Web3 wallets, we would use wagmi hooks
        throw new Error("Web3 wallet testing not implemented in this test component");
      }

      console.log("Transaction result:", txResult);

      // Extract transaction hash
      let txHash: string | null = null;
      if (txResult) {
        if (typeof txResult === 'string') {
          txHash = txResult;
        } else if (txResult.hash) {
          txHash = txResult.hash;
        }
      }

      if (txHash) {
        setResult({ success: true, txHash });
        setShowSuccess(true);
      } else {
        throw new Error("No transaction hash returned");
      }

    } catch (error) {
      console.error("Transaction test failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult({ success: false, error: errorMessage });
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#001A26] rounded-lg border border-[#003354]/60 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-white mb-4">Transaction Test</h3>
      
      <div className="space-y-3 mb-6">
        <div className="text-sm">
          <span className="text-gray-400">Wallet Type:</span>
          <span className="text-white ml-2">{walletType}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Address:</span>
          <span className="text-white ml-2 font-mono text-xs">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Client Ready:</span>
          <span className={`ml-2 ${isClientReady ? 'text-green-400' : 'text-red-400'}`}>
            {isClientReady ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Gas Sponsored:</span>
          <span className={`ml-2 ${isGasSponsored ? 'text-green-400' : 'text-yellow-400'}`}>
            {isGasSponsored ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <button
        onClick={testTransaction}
        disabled={isLoading || !address || (walletType === WalletType.MINIMAL && !isClientReady)}
        className="w-full bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-3 px-4 rounded-lg text-white font-medium transition-all duration-200"
      >
        {isLoading ? 'Testing Transaction...' : 'Test Transaction'}
      </button>

      {result && (
        <div className="mt-4 p-3 rounded-lg border">
          {result.success ? (
            <div className="border-green-500/30 bg-green-500/10">
              <div className="text-green-400 font-medium">Success!</div>
              <div className="text-green-300 text-sm mt-1">
                TX Hash: {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
              </div>
            </div>
          ) : (
            <div className="border-red-500/30 bg-red-500/10">
              <div className="text-red-400 font-medium">Failed</div>
              <div className="text-red-300 text-sm mt-1">{result.error}</div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Transaction Test Successful"
        message="The transaction execution and waiting mechanism is working correctly!"
        txHash={result?.txHash}
        chainId={chainId}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title="Transaction Test Failed"
        message={result?.error || "Transaction test failed"}
      />
    </div>
  );
};

export default TransactionTest;
