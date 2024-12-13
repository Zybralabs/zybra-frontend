import React from 'react';

import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

const TreasuryCard = () => {
  const header = (
    <span className="p-tag p-tag-success">Active</span>
  );
  
  const footer = (
    <button className="p-button p-button-secondary">Invest</button>
  );

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'APY',
        data: [-3, -2, -1, -4, -3.97],
        fill: false,
        borderColor: '#42A5F5',
        tension: 0.4
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <Card
      title="Anemoy Liquid Treasury Fund 1"
      subTitle="TVL (USDC): 38,954,595"
      header={header}
      footer={footer}
      className="p-mb-4 bg-card text-white"
    >
      <div className="text-sm mb-3">
        <p>Volume (24h): <strong>76.44B</strong></p>
        <p>APY: <span className="text-red-500">-3.97%</span></p>
        <p>Asset Type: US Treasuries</p>
        <p>Investor Type: Non-US Professional Investors</p>
      </div>
      <Chart type="line" data={data} options={options} />
    </Card>
  );
};

export default TreasuryCard;
