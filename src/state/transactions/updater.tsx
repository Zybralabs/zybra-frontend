import { type Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core';
import  { Updater as LibUpdater} from '@/lib/transactions/updater';
import { useCallback, useMemo } from 'react';

import { useAddPopup } from '../application/hooks';
import { checkedTransaction, finalizeTransaction } from './reducer';
import type { SerializableTransactionReceipt } from './types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { DEFAULT_TXN_DISMISS_MS } from '@/constant/constant';
import { useChainId } from 'wagmi';

/**
 * Transaction Updater Component
 * Monitors and processes pending transactions, handling confirmations and popups.
 */
export default function Updater() {
  const  chainId  = useChainId();
  const addPopup = useAddPopup();
  const transactions = useAppSelector((state) => state.transactions);


  const dispatch = useAppDispatch();

  /**
   * Handles transaction checking, updating state when a block is processed.
   */
  const onCheck = useCallback(
    ({ chainId, hash, blockNumber }: { chainId: number; hash: string; blockNumber: number }) => {
      dispatch(checkedTransaction({ chainId, hash, blockNumber }));
    },
    [dispatch]
  );

  /**
   * Handles transaction receipt, finalizing it and adding a popup notification.
   */
  const onReceipt = useCallback(
    ({ chainId, hash, receipt }: { chainId: number; hash: string; receipt: SerializableTransactionReceipt }) => {
      dispatch(
        finalizeTransaction({
          chainId,
          hash,
          receipt: {
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
            contractAddress: receipt.contractAddress,
            from: receipt.from,
            status: receipt.status,
            to: receipt.to,
            transactionHash: receipt.transactionHash,
            transactionIndex: receipt.transactionIndex,
          },
        })
      );

      // Check transaction type for specific handling (e.g., SWAP, DEPOSIT)
      const tx = transactions[chainId]?.[hash];
   

      // Display a popup notification for the transaction
      addPopup(
        {
          txn: { hash },
        },
        hash,
        DEFAULT_TXN_DISMISS_MS
      );
    },
    [addPopup, dispatch,  transactions]
  );

  // Memoize pending transactions for efficient rendering
  const pendingTransactions = useMemo(() => (chainId ? transactions[chainId] ?? {} : {}), [chainId, transactions]);

  // Render the transaction updater library component
  return <LibUpdater pendingTransactions={pendingTransactions} onCheck={onCheck} onReceipt={onReceipt} />;
}
