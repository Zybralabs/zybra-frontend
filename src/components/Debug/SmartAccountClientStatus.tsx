"use client";

import React from 'react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { useUserAccount } from '@/context/UserAccountContext';

/**
 * Debug component to show smart account client status
 * This helps identify when the client is not ready and prevents errors
 */
export const SmartAccountClientStatus: React.FC = () => {
  const { walletType, address } = useUserAccount();
  const {
    client,
    isClientReady,
    isGasSponsored,
    policyId,
    sendUserOperationAsync,
  } = useSmartAccountClientSafe();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold mb-2">Smart Account Client Status</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Wallet Connected:</span>
          <span className={address ? 'text-green-400' : 'text-red-400'}>
            {address ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Wallet Type:</span>
          <span className="text-blue-400">{walletType || 'None'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Client Available:</span>
          <span className={client ? 'text-green-400' : 'text-red-400'}>
            {client ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Client Ready:</span>
          <span className={isClientReady ? 'text-green-400' : 'text-red-400'}>
            {isClientReady ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Send Function:</span>
          <span className={sendUserOperationAsync ? 'text-green-400' : 'text-red-400'}>
            {sendUserOperationAsync ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Gas Sponsored:</span>
          <span className={isGasSponsored ? 'text-green-400' : 'text-yellow-400'}>
            {isGasSponsored ? '✅' : '❌'}
          </span>
        </div>
        
        {policyId && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              Policy: {policyId.substring(0, 8)}...
            </div>
          </div>
        )}
        
        {client?.account && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              Account: {client.account.address?.substring(0, 8)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAccountClientStatus;
