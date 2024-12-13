import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

const TeslaCard = () => {
  const header = (
    <span className="p-tag p-tag-warning">Not Filled</span>
  );

  const footer = (
    <button className="p-button p-button-secondary">Invest</button>
  );

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Price Change',
        data: [25, 30, 45, 35, 35.6],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
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
      title="Tesla Stock Offer"
      subTitle="Price: 425.57 USDC"
      header={header}
      footer={footer}
      className="p-mb-4 bg-card text-white"
    >
      <div className="text-sm mb-3">
        <p>Market Cap: <strong>76.44B</strong></p>
        <p>Change: <span className="text-green-500">35.6%</span></p>
        <p>Quantity: 520.26</p>
        <p>Lyzbra: 520.26</p>
      </div>
      <Chart type="line" data={data} options={options} />
    </Card>
  );
};

export default TeslaCard;
