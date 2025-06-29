import React, { useState } from 'react';
import { Copy, ExternalLink, AlertCircle, Shield } from 'lucide-react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';

interface FundingHelperProps {
  isOpen: boolean;
  onClose: () => void;
  smartAccountAddress?: string;
}

export const FundingHelper: React.FC<FundingHelperProps> = ({
  isOpen,
  onClose,
  smartAccountAddress
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { client, isGasSponsored, policyId } = useSmartAccountClientSafe();

  const address = smartAccountAddress || client?.account?.address;

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#001C29] rounded-xl border border-[#003354]/40 max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Fund Your Smart Wallet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Gas Sponsorship Status */}
        {isGasSponsored ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-300 mb-1">Gas Fees Sponsored</h4>
                <p className="text-sm text-green-200/80">
                  Great news! Your transactions are sponsored by Alchemy Gas Manager. No ETH needed for gas fees.
                </p>
                {policyId && (
                  <p className="text-xs text-green-200/60 mt-1">
                    Policy ID: {policyId}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-300 mb-1">ETH Required for Gas</h4>
                <p className="text-sm text-yellow-200/80">
                  Your Account Kit smart wallet needs Base Sepolia ETH to pay for transaction gas fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Wallet Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Smart Wallet Address:
          </label>
          <div className="bg-[#00233A]/50 border border-[#003354]/60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-mono break-all">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Loading...'}
              </span>
              <button
                onClick={handleCopyAddress}
                className="ml-2 p-1 hover:bg-[#003354]/60 rounded transition-colors"
                disabled={!address}
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            {copySuccess && (
              <p className="text-xs text-green-400 mt-1">Address copied!</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="font-medium text-white mb-3">How to fund your wallet:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Copy your smart wallet address above</li>
            <li>Get Base Sepolia ETH from a faucet (see Step 1 on mint page)</li>
            <li>Bridge Sepolia ETH to Base Sepolia using Superbridge</li>
            <li>Send the Base Sepolia ETH to your smart wallet address</li>
            <li>Return here and try claiming tokens again</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 mb-4">
          <a
            href="https://superbridge.app/base-sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-blue-400">Bridge to Base Sepolia</span>
            <ExternalLink className="h-4 w-4 text-blue-400" />
          </a>
          
          <button
            onClick={onClose}
            className="w-full p-3 bg-[#00233A] hover:bg-[#003354] border border-[#003354]/60 rounded-lg transition-colors text-white"
          >
            I&apos;ll fund my wallet later
          </button>
        </div>

        {/* Alternative */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Or switch to a Web3 wallet that already has ETH
          </p>
        </div>
      </div>
    </div>
  );
};

export default FundingHelper;
