import React, { useEffect } from 'react';
import { useAccountAbstraction } from '../hooks/useAccountAbstraction';

const TransactionManager = () => {
  const {
    fetchMinimalAccountFromAPI,
    createMinimalAccount,
    executeTransaction,
    transactions,
  } = useAccountAbstraction();

  useEffect(() => {
    const initialize = async () => {
      const account = await fetchMinimalAccountFromAPI();
      if (!account) {
        const newAccount = await createMinimalAccount();
        console.log('Created Minimal Account:', newAccount);
      } else {
        console.log('Fetched Minimal Account:', account);
      }
    };

    initialize();
  }, [fetchMinimalAccountFromAPI, createMinimalAccount]);

  const handleExecuteTransaction = async () => {
    try {
      const txHash = await executeTransaction(
        '0xMinimalAccountAddress', // User's MinimalAccount
        '0xRecipientAddress', // Recipient address
        ethers.utils.parseEther('0.1'), // Value in wei
        '0x' // Optional function data
      );
      console.log('Transaction Hash:', txHash);
    } catch (err) {
      console.error('Transaction execution failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleExecuteTransaction}>Execute Transaction</button>
      <h3>Transactions:</h3>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            <p>Destination: {tx.destination}</p>
            <p>Status: {tx.status}</p>
            {tx.txHash && <p>Transaction Hash: {tx.txHash}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionManager;
