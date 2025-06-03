"use client";

import { Footer } from "@/components";
import CardTable from "@/components/CardTable";
import CardWithChart from "@/components/CardWithChart";
import {
  BnbIcon,
  BtcIcon,
  GraphIcon,
  GrowthIcon,
  InvestmentIcon,
  LossIcon,
  NvidiaIcon,
  PoolIcon,
  RatioIcon,
  SolIcon,
  StockIcon,
  TeslaIcon,
  WalletIcon,
  XrpIcon,
} from "@/components/Icons";
import Marquee from "react-fast-marquee";
import Header from "@/components/MainPane/components/WalletInfoHeader";
import PortfolioChart from "@/components/PortfolioChart";
import { AppSidebar as Sidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/Sidebar/ui/sidebar";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/utils/formatters";
import { ArrowDown, ArrowUp } from "lucide-react";
import DataTable from "@/components/DataTable";
import { useState } from "react";
import {Modal} from "@/components/Modal";
import { poolsModalCols, transactionCols, transactionModalCols } from "@/components/DataTable/cols";
import { formatAmount } from "@/utils/formatters";
import LayoutHeader from "@/components/Header/Header";

export default function Chart() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [transactionsModal, setTransactionsModal] = useState(false);
  const [poolsModal, setPoolsModal] = useState(false);
  const [stocksModal, setStocksModal] = useState(false);

  const data = {
    investedPool: [
      {
        name: "PoolSpace",
        amount: 16871,
        change: "+ 14,34%",
      },
      {
        name: "PoolSpace",
        amount: 16871,
        change: "+ 14,34%",
      },
      {
        name: "PoolSpace",
        amount: 16871,
        change: "+ 14,34%",
      },
      {
        name: "PoolSpace",
        amount: 16871,
        change: "- 14,34%",
      },
    ],

    transactionsData: [
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
    ],
    transactionModalData: [
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPLasdasdasdasdasdasdasd",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <PoolIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
    ],
    poolsModal: [
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
    ],
  };

  return (
    <SidebarProvider open={sidebarVisible} onOpenChange={(e) => setSidebarVisible(e)}>
      <div className="flex w-full min-h-screen overflow-x-hidden bg-darkBlue">
        <Sidebar />
        <div
          className={`flex flex-col flex-1 bg-[#0a192f] w-full duration-300 ${
            sidebarVisible ? "md:max-w-[calc(100%-256px)]" : "max-w-full"
          }`}
        >
          <LayoutHeader />
          <main className="flex-1 px-5 container mx-auto">
            <Header />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
              <StatCard
                name="My Wallet"
                icon={<WalletIcon />}
                amount={`$${formatAmount(63655836.59)}`}
                bottomContent={
                  <div>
                    <span>+1792.22$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
              <StatCard
                name="Total Investment"
                icon={<InvestmentIcon />}
                amount={`$${formatAmount(63655836.59)}`}
                bottomContent={
                  <div>
                    <span>+1792.22$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
              <StatCard
                name="ZrUSD Borrowed"
                amount={`Lzy ${formatAmount(9856.36)}`}
                bottomContent={
                  <div>
                    <span>+1792.22$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
              <StatCard
                name="Collateral Ratio"
                icon={<RatioIcon />}
                amount="45.36%"
                bottomContent={<span>+200.00%</span>}
              />
              <StatCard
                name="PNL"
                icon={<GraphIcon />}
                growth={false}
                amount={`$${formatAmount(1467055.46)}`}
                bottomContent={
                  <div>
                    <span className="text-midRed">-6392.38$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
            </div>
            <div className="w-full mt-5 grid grid-cols-1 xl:grid-cols-9 2xl:grid-cols-4 gap-6">
              <div className="w-full flex flex-col xl:col-span-6 2xl:col-span-3 order-2 xl:order-1">
                <PortfolioChart />
                <div className="mt-5 flex-1">
                  <DataTable
                    heading="Transactions"
                    onPopup={() => setTransactionsModal(true)}
                    columns={transactionCols}
                    data={data.transactionsData}
                    tableHeightClass="max-h-[222px]"
                  />
                </div>
              </div>
              <div className="xl:col-span-3 2xl:col-span-1 flex flex-col gap-4 order-1 xl:order-2">
                <div className="max-h-[215px] flex-1">
                  <CardWithChart
                    head={
                      <div className="w-full flex justify-between items-center">
                        <span className="text-sm font-semibold">ZFI</span>
                        <div>
                          <span className="text-sm">$2,545,06</span>
                          <span className="text-xs text-midGreen ml-1">+10.21 %</span>
                        </div>
                      </div>
                    }
                  />
                </div>
                <CardTable
                  title="Invested Stocks"
                  data={data.investedPool}
                  onPopup={() => setStocksModal(true)}
                />
                <CardTable
                  title="Invested Pools"
                  data={data.investedPool}
                  onPopup={() => setPoolsModal(true)}
                />
              </div>
            </div>
          </main>

          {/* Footer */}
          {/* <Footer /> */}
        </div>
      </div>
      {transactionsModal && (
        <Modal onClose={() => setTransactionsModal(false)}>
          <div>
            <DataTable
              heading="Transactions"
              columns={transactionModalCols}
              data={data.transactionModalData}
              filtration
            />
          </div>
        </Modal>
      )}
      {stocksModal && (
        <Modal onClose={() => setStocksModal(false)}>
          <div>
            <DataTable
              heading="Invested Pools"
              columns={transactionModalCols}
              data={data.transactionModalData}
              filtration
            />
          </div>
        </Modal>
      )}
      {poolsModal && (
        <Modal onClose={() => setPoolsModal(false)}>
          <div>
            <DataTable
              heading="Invested Pools"
              columns={poolsModalCols}
              data={data.poolsModal}
              filtration
            />
          </div>
        </Modal>
      )}
    </SidebarProvider>
  );
}
