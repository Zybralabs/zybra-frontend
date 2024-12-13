import PortfolioPerformance from "./area-chart";
import { InvestedAssets } from "./invested-assets";
import ZfiComponent from "./price-chart";
import { StatsCard } from "./stats-card";
import { TransactionsComponent } from "./transactions-table";

// Sample data - replace with real data in production
const portfolioData = Array.from({ length: 100 }, () => Math.random() * 1000);
const transactions: Transaction[] = [
  {
    type: "Stock",
    logo: "/logos/apple.png",
    name: "$AAPL",
    status: "Take Offer",
    quantity: "559.2",
    price: "$365.25",
    allocation: "25%",
    currency: "USD",
    liquidity: "High",
    date: "06/29/2024",
  },
  {
    type: "Pool",
    logo: "/logos/pool.png",
    name: "Anemoy Liquid Treasury Fund 1",
    status: "Withdraw",
    quantity: "600.63",
    price: "$252.28",
    allocation: "36%",
    currency: "ETH",
    liquidity: "High",
    date: "06/29/2024",
  },
  {
    type: "Stock",
    logo: "/logos/nvidia.png",
    name: "$NVDA",
    status: "Make Offer",
    quantity: "2142.0",
    price: "$2000.25",
    allocation: "49%",
    currency: "USD",
    liquidity: "High",
    date: "06/29/2024",
  },
];


const investedStocks = [
  { name: "PoolSpace", amount: "168.71", change: "14.34%", isPositive: true },
  { name: "SolPool", amount: "233.99", change: "11.24%", isPositive: true },
  { name: "Hamster", amount: "2,545.06", change: "10.21%", isPositive: false },
];

export default function UserDashboard() {
  return (
    <main className="min-h-screen bg-[#051220] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="My Wallet"
            value="$636,558.36"
            change={{ value: "193.22", isPositive: true }}
            today="today"
          />
          <StatsCard
            title="Total Investment"
            value="$27,655.83"
            change={{ value: "260.45", isPositive: true }}
            today="today"
          />
          <StatsCard
            title="Lydra Borrowed"
            value="Lzy 9856.36"
            change={{ value: "269.73", isPositive: true }}
            today="today"
          />
          <StatsCard
            title="Collateral Ratio"
            value="45.36%"
            change={{ value: "120.03", isPositive: true }}
          />
          <StatsCard
            title="PNL"
            value="$1,467,055.46"
            change={{ value: "642.12", isPositive: false }}
            today="today"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="rounded-lg bg-[#0a1929] p-4">
              
              <PortfolioPerformance />
              {/* <img src="/UserDashboard/graph.png" /> */}
            </div>
            <TransactionsComponent transactions={transactions} />
          </div>
          <div className="space-y-6">
            <div className="rounded-lg bg-[#0a1929] p-4">
  

                <ZfiComponent />
           
            </div>
            <InvestedAssets title="Invested Stocks" assets={investedStocks} />
            <InvestedAssets title="Invested Pools" assets={investedStocks} />
          </div>
        </div>
      </div>
    </main>
  );
}
