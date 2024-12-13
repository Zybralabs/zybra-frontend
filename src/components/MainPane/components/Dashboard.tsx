import React from 'react';
import TreasuryCard from './TreasuryCard';
import TeslaCard from './TeslaCard';

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

      <div className="p-grid p-fluid">
        <div className="p-col-12 p-md-6 p-lg-4">
          <TreasuryCard />
        </div>
        <div className="p-col-12 p-md-6 p-lg-4">
          <TeslaCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
