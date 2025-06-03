import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Title,
  Filler,
  CategoryScale,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Title,
  Filler,
  CategoryScale
);

const PortfolioPerformance = () => {
  const data = {
    labels: [
      "2014",
      "2015",
      "2016",
      "2017",
      "2018",
      "2019",
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
    ],
    datasets: [
      {
        label: "Portfolio A",
        data: [100, 300, 708.32, 650, 500, 450, 500, 700, 600, 800, 900],
        borderColor: "#00bfff",
        backgroundColor: "rgba(0, 191, 255, 0.1)",
        pointBorderColor: "#fff",
        pointBackgroundColor: "#00bfff",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: "Portfolio B",
        data: [200, 400, 500, 600, 550, 500, 600, 800, 700, 900, 1000],
        borderColor: "#ff6347",
        backgroundColor: "rgba(255, 99, 71, 0.1)",
        pointBorderColor: "#fff",
        pointBackgroundColor: "#ff6347",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 8,
        displayColors: false,
        cornerRadius: 5,
      },
      legend: {
        labels: {
          color: "#fff",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
          color: "#1e293b",
        },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
          color: "#1e293b",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-[#0a1929] rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">
        Portfolio performance
      </h2>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PortfolioPerformance;
