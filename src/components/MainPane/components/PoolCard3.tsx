import { AnemoyIcon, PopupIcon, RatingAIcon, RatingAPlusIcon } from "@/components/Icons";
import { formatAmount, formatNumber } from "@/utils/formatters";
import Link from "next/link";

type PoolCardType = {
  active?: boolean;
  status?: string;
  name?: string;
  icon?: React.ReactNode;
  volume: number;
  apy: string;
  minInv: number;
  assetType: string;
  investorType: string;
  investUrl?: string;
  tvl: number;
};

export default function PoolCard3({
  apy = "-3.97%",
  assetType = "US Treasuries",
  icon = <AnemoyIcon />,
  investorType = "Non-US Professional Investors",
  name = "Anemoy Liquid Treasury Fund 1",
  tvl = 38954595,
  volume = 76440000000,
  active = true,
  status = "Not Filled",
  investUrl,
  minInv = 200000,
}: PoolCardType) {
  return (
    <div className="bg-[#001C29] text-white p-6 rounded-xl w-2xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-md bg-[#001620] border-[0.25px] ${active ? "border-midGreen/50 text-midGreen" : "border-midRed/50 text-midRed"}  text-sm`}
          >
            <span
              className={`${active ? "bg-midGreen" : "bg-midRed"} w-2 h-2 rounded-full mr-2`}
            ></span>
            <p className="text-xs"> {status} </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">{icon}</div>
            <h3 className="text-lg xl:text-xl font-semibold">{name}</h3>
          </div>
        </div>

        <svg
          width="43"
          height="41"
          viewBox="0 0 43 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.96087 32.642C3.7019 29.9649 2.99868 26.9782 2.99868 23.8284C2.99868 12.3133 12.3966 2.97858 23.9896 2.97858C30.4447 2.97858 36.2191 5.87297 40.0697 10.4262L42.3668 8.51168C37.9662 3.30789 31.3669 0 23.9896 0C10.7405 0 0 10.6683 0 23.8284C0 27.4282 0.803648 30.8416 2.24249 33.9011L4.96087 32.642Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23.9896 37.9769C16.123 37.9769 9.7458 31.6426 9.7458 23.8288C9.7458 16.015 16.123 9.68072 23.9896 9.68072C28.3699 9.68072 32.2876 11.6452 34.9005 14.735L37.1982 12.8199C34.0353 9.07972 29.292 6.70215 23.9896 6.70215C14.4668 6.70215 6.74707 14.37 6.74707 23.8288C6.74707 33.2876 14.4668 40.9555 23.9896 40.9555V37.9769Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M29.1578 28.1356C27.9202 29.5992 26.0644 30.5297 23.9895 30.5297C20.2632 30.5297 17.2424 27.5293 17.2424 23.828C17.2424 20.1267 20.2632 17.1262 23.9895 17.1262C26.0644 17.1262 27.9202 18.0568 29.1578 19.5204L31.742 17.3666C29.8855 15.1713 27.1018 13.7754 23.9895 13.7754C18.4 13.7754 13.8689 18.2761 13.8689 23.828C13.8689 29.3799 18.4 33.8806 23.9895 33.8806C26.8418 33.8806 29.4175 32.7077 31.257 30.822L29.1578 28.1356Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="mb-5 pt-3 flex items-center justify-between border-t border-[#313E44]">
        <div className="text-white text-lg mb-1">TVL (USDC)</div>
        <div className="text-xl xl:text-3xl font-semibold">{formatNumber(tvl)}</div>
      </div>

      <div className="flex w-full flex-col lg:flex-row justify-between gap-4 mb-8">
        <div>
          <div className="text-gray-400 text-sm mb-1 w-max">Volume (24h)</div>
          <div className="text-xl xl:text-3xl font-semibold">${formatAmount(volume)}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-0">APY</div>
          <div className="flex items-center">
            <span
              className={`text-xl xl:text-3xl font-semibold ${apy?.[0] === "-" ? "text-midRed" : "text-midGreen"}`}
            >
              {apy}
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="text-gray-400 text-sm mb-0 w-max">Min. Investment</div>
          <div className="flex items-center">
            <span className="text-xl xl:text-3xl font-semibold">${formatAmount(minInv)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start gap-5 flex-wrap xl:gap-8 mb-8">
        <div>
          <div className="text-gray-400 text-sm mb-1">Asset type</div>
          <div className="text-base xl:text-lg">{assetType}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1">Investor type</div>
          <div className="text-base xl:text-lg">{investorType}</div>
        </div>
      </div>

      <div className="flex justify-between flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400 text-sm mr-2">Rating</div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 rounded-2xl outline outline-[.25px] outline-[#6B6B6C] text-white flex items-center gap-1">
              <RatingAIcon />
              <p className="text-sm">Aa-bf </p>
            </div>
            <div className="px-3 py-1 rounded-2xl outline outline-[.25px] outline-[#6B6B6C] text-white flex items-center gap-1">
              <RatingAPlusIcon />
              <p className="text-sm">A+</p>
            </div>
          </div>
        </div>

        <Link
          href={investUrl || "#"}
          className="w-full xl:w-auto gap-1.5 px-5 py-2 xl:py-1.5 rounded-full border border-white/50 bg-[#001620] text-white text-sm flex justify-center xl:justify-start items-center hover:bg-[#001220] transition-colors"
        >
          Invest
          <PopupIcon />
        </Link>
      </div>
    </div>
  );
}
