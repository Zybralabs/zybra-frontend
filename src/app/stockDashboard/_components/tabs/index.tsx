"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Assets from "@/app/poolDashboard/_components/tabs/assets";
import Offers from "./offers";
import OverviewTab from "./overview";

const Tabs = () => {
  const tabs = [
    {
      name: "Overview",
      id: "overview",
    },
    {
      name: "Offers",
      id: "offers",
    },
    {
      name: "Swap",
      id: "swap",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <div className="flex flex-col flex-1 w-full pt-6 md:pt-8">
      <div className="border-b border-[#072A3C]/50 mb-6">
        <ul className="flex items-center gap-8">
          {tabs.map((tab, i) => (
            <li
              key={i}
              className={`relative pb-4 group cursor-pointer ${
                activeTab === tab.id 
                  ? "text-[#4BB6EE]" 
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              {tab.id === "swap" ? (
                <Link 
                  href={`/swap`}
                  className="text-base font-medium transition-colors duration-200"
                >
                  {tab.name}
                </Link>
              ) : (
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className="text-base font-medium transition-colors duration-200 focus:outline-none"
                >
                  {tab.name}
                </button>
              )}
              {/* Active indicator */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#4BB6EE] scale-x-100"
                    : "bg-transparent scale-x-0 group-hover:bg-white/10 group-hover:scale-x-100"
                }`}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full">
        {activeTab === tabs[0]?.id && <OverviewTab />}
        {activeTab === tabs[1]?.id && <Offers />}
        {activeTab === tabs[2]?.id && <Assets />}
      </div>
    </div>
  );
};

export default Tabs;