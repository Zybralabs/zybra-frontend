import React from "react";
import Header from "./components/Header";
import TreasuryCard from "./components/TreasuryCard";
import TeslaCard from "./components/TeslaCard";
import PoolCard from "./components/PoolCard";
import PoolCard2 from "./components/PoolCard2";
import TeslaCard2 from "./components/TeslaCard2";
import PoolCard3 from "./components/PoolCard3";
import PoolCard4 from "./components/PoolCard4";
const Dashboard = () => {
  return (
    <div className="flex flex-col h-full w-full bg-[#0C1122] text-white p-6">
      <Header /> {/* Reusable Header Component */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mt-4">
        <PoolCard />
        <TeslaCard />
        <PoolCard2 />
        <TeslaCard2 />
        <PoolCard3 />
        <PoolCard4 />

        {/* <PoolCard2 />
        <PoolCard2 />
        <PoolCard2 /> */}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen flex bg-dark text-white">
      {/* <Sidebar /> */}
      <div className="flex-1">
        <Dashboard />
      </div>
    </div>
  );
};

export default App;
