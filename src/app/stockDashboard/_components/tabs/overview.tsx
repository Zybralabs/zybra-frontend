import React from "react";
import {
  BaseChainIcon,
  ChevronRight,
  RatingAIcon,
  RatingAPlusIcon,
  TeslaLogoIcon,
} from "@/components/Icons";
import OverviewChart from "@/components/OverviewChart";
import Link from "next/link";

const OverviewTab: React.FC = () => {
  const active = true;
  const status = "Active";
  const tags = ["Website", "Forum", "Email", "Executive summary"];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-7 gap-4 w-full max-w-[1920px] mx-auto">
      {/* Market Overview Chart */}
      <div className="xl:col-span-5 h-[400px] md:h-[500px] px-5 py-7 md:p-7 lg:p-10 border border-[#072A3C] bg-[#001820] rounded-xl">
        <div className="mb-6 md:mb-10">
          <h3 className="text-white font-medium text-lg md:text-xl">Market Overview</h3>
        </div>
        <div className="h-[calc(100%-80px)]">
          <OverviewChart />
        </div>
      </div>

      {/* Overview Details */}
      <div className="xl:col-span-2 px-4 sm:px-6 pt-7 pb-5 flex flex-col gap-4 md:gap-5 justify-between border border-[#072A3C] bg-[#001820] rounded-xl">
        <div className="flex w-full justify-between items-center mb-2 md:mb-3 gap-4 md:gap-10">
          <h6 className="text-base md:text-lg text-white font-medium">Overview</h6>
          <div className={`inline-flex items-center px-3 py-1 rounded-md bg-[#001219] border-[0.25px] ${active ? "border-midGreen/50 text-midGreen" : "border-midRed/50 text-midRed"} text-sm`}>
            <span className={`${active ? "bg-midGreen" : "bg-midRed"} w-2 h-2 rounded-full mr-2`}></span>
            <p className="text-xs md:text-sm">{status}</p>
          </div>
        </div>

        {/* Overview Details List */}
        <div className="space-y-4">
          {[
            { label: "Description", value: "A token representing TESLA INC. DL -,001 stock" },
            { label: "Blockchain", value: <span className="flex gap-1.5 items-center"><BaseChainIcon /> Base chain</span> },
            { label: "Asset type", value: "Stock token" },
            { label: "Token Address", value: "0x7FCF...Bafb", className: "border-b border-white" },
            { label: "Token standard", value: "SX1411" },
            { label: "Redemption Asset Ticker", value: "USDC" },
            { label: "Redemption Asset Blockchain", value: "Polygon" },
            { label: "Agent name", value: "Swarm Markets GmBH" },
          ].map((item, index) => (
            <div key={index} className="flex w-full justify-between gap-3 md:gap-10">
              <span className="text-sm md:text-base text-darkSlate font-medium whitespace-nowrap">{item.label}</span>
              <span className={`text-sm md:text-base text-white font-light text-right ${item.className || ''}`}>
                {item.value}
              </span>
            </div>
          ))}

          <div className="flex w-full justify-between gap-3 md:gap-10">
            <span className="text-sm md:text-base text-darkSlate font-medium">Rating</span>
            <div className="py-1 px-2 rounded-full border border-[#EAEAEA] flex items-center">
              <RatingAIcon />
              <span className="text-sm text-white font-light ml-1.5">Aa-bf</span>
              <div className="mx-1.5 h-full w-[1px] bg-[#EAEAEA]"></div>
              <RatingAPlusIcon />
              <span className="text-sm text-white font-light ml-2">A+</span>
            </div>
          </div>
        </div>
        
        <span className="block ml-auto border-b border-darkSlate text-darkSlate text-xs">
          more info
        </span>
      </div>

      {/* Tesla Description */}
      <div className="xl:col-span-5 p-5 md:p-7 lg:px-10 lg:py-8 border border-[#072A3C] bg-[#001820] rounded-xl flex flex-col gap-5">
        <div className="flex items-center gap-2.5 mb-2">
          <TeslaLogoIcon />
          <h2 className="text-xl md:text-2xl font-medium text-white">$TSLA</h2>
        </div>
        <div>
          <h5 className="text-lg md:text-xl text-white mb-3">Tesla Inc.</h5>
          <p className="text-white/60 text-base md:text-lg">
            Tesla, Inc. is a global leader in sustainable energy and electric vehicles. The company
            designs, manufactures, and sells electric vehicles, battery energy storage systems,
            solar energy solutions, and related products. Tesla&apos;s mission is to accelerate the
            worlds transition to sustainable energy through innovative technology and scalable
            solutions. With a focus on cutting-edge design, unmatched performance, and reducing
            environmental impact, Tesla has revolutionized the transportation and energy sectors.
          </p>
        </div>
        <div className="w-full overflow-x-auto pb-2">
          <ul className="flex justify-end items-center gap-4 min-w-max">
            {tags.map((tag, i) => (
              <li key={i} className="border border-[#072A3C] text-white/70 px-4 md:px-6 py-2 rounded-full text-sm md:text-base">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reports */}
      <div className="xl:col-span-2 px-5 py-4 md:py-6 border border-[#072A3C] bg-[#001820] rounded-xl flex flex-col gap-5">
        <h4 className="text-lg md:text-xl font-medium text-white">Reports</h4>
        <ul className="px-3 md:px-5 text-white">
          {["Balance sheet", "Profit & loss", "Cash flow statement"].map((item, index) => (
            <li key={index}>
              <Link
                href="#"
                className="w-full flex justify-between items-center py-4 border-b border-white/10 hover:text-white/80 transition-colors"
              >
                <span className="text-sm md:text-base">{item}</span>
                <ChevronRight />
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <span className="text-white text-base md:text-lg">Pool analysis</span>
          <span className="text-darkSlate text-xs md:text-sm block">Reviewer: Mark Hergenroeder</span>
          <span className="text-darkSlate text-xs md:text-sm">
            Title: Facilitator of the Centrifuge Credit Group
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;