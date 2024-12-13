import { useUserAccount } from "@/context/UserAccountContext";
import { useCoinbasePay } from "@/lib/hooks/useCoinbase";

const CoinbaseWidget = ({ assets = ["ETH", "USDC", "BTC"], onSuccess, onExit, onEvent }) => {
  const { address } = useUserAccount();
  const { openCoinbasePay, loading, error, success } = useCoinbasePay({
    addresses: [address],
    assets,
    onSuccess,
    onExit,
    onEvent,
  });

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold mb-4">Buy Crypto with Coinbase</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={openCoinbasePay}
        disabled={loading}
      >
        Buy with Coinbase
      </button>
      {loading && <p className="mt-4 text-blue-500">Processing transaction...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      {success && <p className="mt-4 text-green-500">Transaction completed successfully!</p>}
    </div>
  );
};

export default CoinbaseWidget;
