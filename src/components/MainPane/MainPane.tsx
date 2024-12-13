import React from "react";
import Header from "./components/Header";
import TreasuryCard from "./components/TreasuryCard";
import TeslaCard from "./components/TeslaCard";

const Dashboard = () => {
  return (
    <div className="flex flex-col h-full w-full bg-[#0a192f] text-white p-6">
      <Header /> {/* Reusable Header Component */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <TreasuryCard />
        <TeslaCard />
      </div>
    </div>
  );
};

export default Dashboard;
