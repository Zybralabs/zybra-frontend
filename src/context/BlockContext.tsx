import React, { createContext, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";

import { ChainId } from "@/constant/addresses";
import { useEthersProvider } from "@/hooks/useContract";

interface Transaction {
  hash: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  from: string;
  to: string;
  value: string; // Store in wei for precision
}

interface BlockContextProps {
  chainId: number | null;
  latestBlock: number | null;
  latestMainnetBlock: number | null;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (hash: string, status: "confirmed" | "failed") => void;
}

const BlockContext = createContext<BlockContextProps>({
  chainId: null,
  latestBlock: null,
  latestMainnetBlock: null,
  transactions: [],
  addTransaction: () => {},
  updateTransactionStatus: () => {},
});

export const useBlockContext = () => useContext(BlockContext);

export const BlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const provider = useEthersProvider();

  const [chainId, setChainId] = useState<number | null>(null);
  const [latestBlock, setLatestBlock] = useState<number | null>(null);
  const [latestMainnetBlock, setLatestMainnetBlock] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mainnetProvider, setmainnetProvider] = useState<Transaction[]>([]);

  // Load transactions from localStorage
  useEffect(() => {
    const storedTransactions = localStorage.getItem("user-transactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
    setmainnetProvider(
      new ethers.JsonRpcApiProvider(
        ChainId.Mainnet,
        "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      ),
    );
  }, []);

  // Save transactions to localStorage on update
  useEffect(() => {
    localStorage.setItem("user-transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const updateTransactionStatus = (hash: string, status: "confirmed" | "failed") => {
    setTransactions((prev) => prev.map((tx) => (tx.hash === hash ? { ...tx, status } : tx)));
  };

  useEffect(() => {
    if (!provider) return;

    // Fetch initial chain ID
    provider.getNetwork().then((network) => {
      setChainId(network.chainId);
    });

    // Subscribe to block updates
    const onBlock = async (blockNumber: number) => {
      setLatestBlock(blockNumber);

      // Check for pending transactions
      const pendingTxs = transactions.filter((tx) => tx.status === "pending");
      for (const tx of pendingTxs) {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          if (receipt) {
            updateTransactionStatus(tx.hash, receipt.status === 1 ? "confirmed" : "failed");
          }
        } catch (err) {
          console.error(`Error checking transaction ${tx.hash}:`, err);
        }
      }
    };

    provider.on("block", onBlock);

    return () => {
      provider.off("block", onBlock);
    };
  }, [provider, transactions]);

  // useEffect(() => {
  //   if (!mainnetProvider) return;

  //   // Subscribe to Mainnet block updates
  //   const onMainnetBlock = (blockNumber: number) => {
  //     setLatestMainnetBlock(blockNumber);
  //   };

  //   mainnetProvider.on('block', onMainnetBlock);

  //   return () => {
  //     mainnetProvider.off('block', onMainnetBlock);
  //   };
  // }, [mainnetProvider]);

  return (
    <BlockContext.Provider
      value={{
        chainId,
        latestBlock,
        latestMainnetBlock,
        transactions,
        addTransaction,
        updateTransactionStatus,
      }}
    >
      {children}
    </BlockContext.Provider>
  );
};
