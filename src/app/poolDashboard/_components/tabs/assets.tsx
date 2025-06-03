import { Checkbox } from "@/components/Checkbox";
import { LossIcon } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { formatAmount, formatNumber } from "@/utils/formatters";
import { DownloadIcon } from "lucide-react";
import React from "react";

const Assets = () => {
  const data = {
    total_nav: 39044422,
    onchain_reserve: 0,
    offchain_chain: 13357,
    total_assets: "45.36%",
    accrued_fees: -1467055.46,
  };
  const isNegative = (txt: string | number) => (txt.toString()[0] === "-" ? true : false);
  const tableData = [
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
    {
      asset: "912797LZ8",
      type: "US Treasury bill",
      date: "Jan 30,2025",
      quantity: 9073935,
      price: 99.1588,
      value: 9073034.41,
      unrealized_pl: "24,404.97 USDC",
      realized_pl: "0 USDC",
      portfolio: "23.2%",
    },
  ];
  return (
    <div>
      <div className="w-full grid grid-cols-2 grid-rows-3 md:grid-cols-3 md:grid-rows-2 xl:grid-cols-5 xl:grid-rows-1 gap-5 2xl:gap-7">
        <div className="bg-darkGrey flex-1 py-6 px-4 text-white rounded-2xl">
          <span className="text-xs lg:text-sm xl:text-base">Total Nav (USDC)</span>
          <h3 className="text-xl font-bold xl:text-2xl 2xl:text-3xl mt-1">
            {formatNumber(data.total_nav)}
          </h3>
        </div>
        <div className="bg-darkGrey flex-1 py-6 px-4 text-white rounded-2xl">
          <span className="text-xs lg:text-sm xl:text-base">Onchain reserve (USDC)</span>
          <h3 className="text-xl font-bold xl:text-2xl 2xl:text-3xl mt-1">
            {formatNumber(data.onchain_reserve)}
          </h3>
        </div>
        <div className="bg-darkGrey flex-1 py-6 px-4 text-white rounded-2xl">
          <span className="text-xs lg:text-sm xl:text-base">Offchain cash (USD)</span>
          <h3 className="text-xl font-bold xl:text-2xl 2xl:text-3xl mt-1">
            {formatNumber(data.offchain_chain)}
          </h3>
        </div>
        <div className="bg-darkGrey flex-1 py-6 px-4 text-white rounded-2xl">
          <span className="text-xs lg:text-sm xl:text-base">Total Assets (USDC)</span>
          <h3 className="text-xl font-bold xl:text-2xl 2xl:text-3xl mt-1">{data.total_assets}</h3>
        </div>
        <div className="bg-darkGrey flex-1 py-6 px-4 text-white rounded-2xl">
          <span className="text-xs lg:text-sm xl:text-base">Accrued Fees (USDC)</span>
          <div className="flex justify-between items-center w-full gap-2 mt-1">
            <h3
              className={cn(
                "text-xl font-bold xl:text-2xl 2xl:text-3xl mt-1",
                isNegative(data.accrued_fees) ? "text-midRed" : "text-midGreen",
              )}
            >
              {isNegative(data.accrued_fees) ? "-" : "+"} ${formatAmount(data.accrued_fees)}
            </h3>
            <LossIcon className="hidden xl:inline" />
          </div>
        </div>
      </div>
      {/* Table Filters */}
      <div className="flex justify-between items-center w-full text-white gap-5 mt-7 xl:mt-10">
        <span>7 ongoing assets</span>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2">
            <Checkbox className="bg-[#D9D9D94D] w-4 h-4" />
            <span>Show repaid assets</span>
          </label>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#013853] text-white font-medium rounded-xl hover:bg-[#012b3f]">
            View asset transactions
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#013853] text-white font-medium rounded-xl hover:bg-[#012b3f]">
            <i>
              <DownloadIcon size={16} />
            </i>
            Download
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="border border-white/30 rounded-lg overflow-x-auto overflow-hidden mt-6">
        <table className="w-full text-white">
          <thead>
            <tr>
              <th className="text-left whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Asset
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Security type
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Maturity date
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Quantity
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Market price
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Market value
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Unrealized P&L
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Realized P&L
              </th>
              <th className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                Portolio%
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((d, i) => (
              <tr key={i}>
                <td className="text-left whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.asset}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.type}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.date}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.quantity}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.price}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.value}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.unrealized_pl}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.realized_pl}
                </td>
                <td className="text-center whitespace-nowrap px-5 py-3 w-max border-b border-white/20">
                  {d.portfolio}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assets;
