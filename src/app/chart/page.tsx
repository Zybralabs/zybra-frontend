"use client";

import { Footer } from "@/components";
import CardTable from "@/components/CardTable";
import CardWithChart from "@/components/CardWithChart";
import {
  BnbIcon,
  BtcIcon,
  GraphIcon,
  InvestmentIcon,
  NvidiaIcon,
  RatioIcon,
  SolIcon,
  TeslaIcon,
  WalletIcon,
  XrpIcon,
} from "@/components/Icons";
import Marquee from "react-fast-marquee";
import Header from "@/components/MainPane/components/Header";
import PortfolioChart from "@/components/PortfolioChart";
import { AppSidebar as Sidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/Sidebar/ui/sidebar";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/utils/formatters";
import { ArrowDown, ArrowUp } from "lucide-react";
import DataTable from "@/components/DataTable";

enum ProfitTypeEnum {
  INC = "inc",
  DEC = "dec",
}

export default function Chart() {
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
    stocks: [
      {
        icon: <NvidiaIcon />,
        text: "$NVDA",
        val: "0.70%",
        type: ProfitTypeEnum.INC,
      },
      {
        icon: <TeslaIcon />,
        text: "$TSLA",
        val: "2.50%",
        type: ProfitTypeEnum.DEC,
      },
      {
        icon: <BtcIcon />,
        text: "$BTC",
        val: "1.73%",
        type: ProfitTypeEnum.DEC,
      },
      {
        icon: <BnbIcon />,
        text: "$BNB",
        val: "4.83%",
        type: ProfitTypeEnum.DEC,
      },
      {
        icon: <SolIcon />,
        text: "$SOL",
        val: "5.06%",
        type: ProfitTypeEnum.DEC,
      },
      {
        icon: <XrpIcon />,
        text: "$XRP",
        val: "7.93%",
        type: ProfitTypeEnum.INC,
      },
    ],
  };
  return (
    <SidebarProvider>
      {/* Root Container with Blue Background */}
      <div className="flex w-full min-h-screen bg-darkBlue">
        {/* Sidebar */}
        <div className="flex-1 w-full">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 bg-[#0a192f] w-full max-w-[calc(100%-256px)]">
          {/* Header */}
          <header className="sticky top-0 z-10 flex gap-4 h-16 items-center border-b border-white/10 bg-darkGreen px-6 w-full overflow-clip">
            <div className="w-full">
              <SidebarTrigger />
            </div>
            {!!data?.stocks?.length && (
              <div className="w-full bg-darkBlue rounded-[10px] flex items-center py-3">
                <div className="flex items-center px-2.5">
                  <div className="rounded-full w-2.5 aspect-square border-[3px] border-[#136148] bg-grassGreen"></div>
                  <span className="text-grassGreen text-[10px] ml-1 w-max">Live Rates</span>
                </div>
                <Marquee autoFill>
                  {/* <div className="flex justify-evenly items-center w-full"> */}
                  {data.stocks.map((stock, i) => (
                    <div key={i} className="flex items-center text-white gap-1 w-full mx-3">
                      <i>{stock.icon}</i>
                      <span>{stock.text}</span>
                      <span
                        className={`flex items-center gap-0.5 ${stock.type === ProfitTypeEnum.INC ? "text-midGreen" : "text-midRed"}`}
                      >
                        {stock.type === ProfitTypeEnum.INC ? <ArrowUp /> : <ArrowDown />}{" "}
                        {stock.val}
                      </span>
                    </div>
                  ))}
                  {/* </div> */}
                </Marquee>
              </div>
            )}
          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-5 container mx-auto">
            <Header />
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
              <StatCard
                name="My Wallet"
                icon={<WalletIcon />}
                amount={formatCurrency(63655836.59)}
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
                amount={formatCurrency(63655836.59)}
                bottomContent={
                  <div>
                    <span>+1792.22$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
              <StatCard
                name="Lzybra Borrowed"
                amount="Lzy 9856.36"
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
                amount={formatCurrency(1467055.46)}
                bottomContent={
                  <div>
                    <span className="text-midRed">-6392.38$</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
            </div>
            <div className="w-full mt-5 grid grid-cols-1 xl:grid-cols-9 2xl:grid-cols-4 gap-6">
              <div className="w-full xl:col-span-6 2xl:col-span-3 order-2 xl:order-1">
                <PortfolioChart />
                <div className="mt-5">
                  <DataTable heading="Transactions" onPopup={() => {}} />
                </div>
              </div>
              <div className="xl:col-span-3 2xl:col-span-1 flex flex-col gap-4 order-1 xl:order-2">
                <CardWithChart
                  head={
                    <div className="w-full flex justify-between items-center">
                      <span className="text-sm font-semibold">Zfi</span>
                      <div>
                        <span className="text-sm">$2,545,06</span>
                        <span className="text-xs text-midGreen ml-1">+10.21 %</span>
                      </div>
                    </div>
                  }
                />
                <CardTable title="Invested Stocks" data={data.investedPool} />
                <CardTable title="Invested Pools" data={data.investedPool} />
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
