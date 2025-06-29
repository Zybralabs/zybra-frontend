"use client";

import React from 'react';
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';
import { useUserAccount } from '@/context/UserAccountContext';

/**
 * Debug component to show smart account client status
 * This helps identify when the client is not ready and prevents errors
 */
export const ClientDebugInfo: React.FC = () => {
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
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Smart Account Client Debug</h4>
      <div>Wallet Type: {walletType || 'None'}</div>
      <div>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</div>
      <div>Client Ready: <span style={{ color: isClientReady ? 'green' : 'red' }}>{isClientReady ? 'YES' : 'NO'}</span></div>
      <div>Client Exists: <span style={{ color: !!client ? 'green' : 'red' }}>{!!client ? 'YES' : 'NO'}</span></div>
      <div>Gas Sponsored: <span style={{ color: isGasSponsored ? 'green' : 'gray' }}>{isGasSponsored ? 'YES' : 'NO'}</span></div>
      <div>Policy ID: {policyId || 'None'}</div>
      <div>Send Function: <span style={{ color: !!sendUserOperationAsync ? 'green' : 'red' }}>{!!sendUserOperationAsync ? 'Available' : 'Not Available'}</span></div>
      {client && (
        <div>
          <div>Client Account: <span style={{ color: !!client.account ? 'green' : 'red' }}>{!!client.account ? 'Present' : 'Missing'}</span></div>
          <div>Client Chain: {client.chain?.id || 'Unknown'}</div>
        </div>
      )}
    </div>
  );
};
