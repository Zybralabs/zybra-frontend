import React from "react";

import PoolCard from "./components/PoolCard";
import Sidebar from "./components/Sidebar";
import TeslaCard from "./components/TeslaCard";
import TreasuryCard from "./components/TreasuryCard";

const Dashboard = () => {
  return (
    <div className="p-4">
      <div className="flex justify-between align-items-center mb-4">
        <h1 className="text-3xl font-bold">Explore</h1>
        <div>
          <button className="p-button p-button-outlined p-mr-2">Connect Wallet</button>
          <button className="p-button p-button-success">Deposit</button>
        </div>
      </div>
          <PoolCard />

      <div className="p-grid p-fluid">
        <div className="p-col-12 p-md-6 p-lg-4">{/* <TreasuryCard /> */}
        </div>
        <div className="p-col-12 p-md-6 p-lg-4">{/* <TeslaCard /> */}</div>
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
