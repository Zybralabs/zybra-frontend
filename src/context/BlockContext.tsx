import React, { createContext, useContext, useEffect, useState } from "react";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

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
  latestBlock: number;
  latestMainnetBlock: number;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (hash: string, status: "confirmed" | "failed") => void;
}

const BlockContext = createContext<BlockContextProps>({
  chainId: null,
  latestBlock: 0,
  latestMainnetBlock: 0,
  transactions: [],
  addTransaction: () => {},
  updateTransactionStatus: () => {},
});

export const useBlockContext = () => useContext(BlockContext);

export const BlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, chain } = useAccount();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();

  // Create a dedicated mainnet client
  const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC || "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"),
  });

  const [chainId, setChainId] = useState<number | null>(chain?.id || null);
  const [latestBlock, setLatestBlock] = useState<number>(0);
  const [latestMainnetBlock, setLatestMainnetBlock] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem("user-transactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("user-transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const updateTransactionStatus = (hash: string, status: "confirmed" | "failed") => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.hash === hash ? { ...tx, status } : tx))
    );
  };

  useEffect(() => {
    if (!publicClient) return;

    const onBlock = async (blockNumber: number) => {
      setLatestBlock(blockNumber);

      const pendingTxs = transactions.filter((tx) => tx.status === "pending");
      for (const tx of pendingTxs) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
          if (receipt) {
            updateTransactionStatus(tx.hash, receipt.status === 1 ? "confirmed" : "failed");
          }
        } catch (err) {
          console.error(`Error checking transaction ${tx.hash}:`, err);
        }
      }
    };

    const unsubscribe = publicClient.watchBlockNumber({ onBlock });
    return () => unsubscribe();
  }, [publicClient, transactions]);

  useEffect(() => {
    const fetchMainnetBlock = async () => {
      try {
        const blockNumber = await mainnetClient.getBlockNumber();
        setLatestMainnetBlock(Number(blockNumber));
      } catch (error) {
        console.error("Error fetching mainnet block number:", error);
      }
    };

    const interval = setInterval(fetchMainnetBlock, 10000);
    return () => clearInterval(interval);
  }, [mainnetClient]);

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
