import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
  CategoryScale,
} from "chart.js";

ChartJS.register(PointElement, LineElement, LinearScale, Tooltip, Filler, CategoryScale);

const ZfiComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const data = {
    labels: Array.from({ length: 20 }, (_, i) => i + 1), // Simulated X-axis data
    datasets: [
      {
        label: "Zfi",
        data: [
          1500, 1600, 1750, 2000, 2100, 2200, 2500, 2450, 2600, 2545, 2750, 2700,
          2850, 2900, 3000, 3100, 3200, 3300, 3400, 3545,
        ],
        borderColor: "#00FF00", // Green line
        backgroundColor: "rgba(0, 255, 0, 0.1)", // Light green gradient fill
        pointRadius: 0, // Points are invisible by default
        pointHoverRadius: 5, // Small points appear on hover
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
        enabled: true, // Enable tooltip
        backgroundColor: "#1e293b",
        titleColor: "#fff",
        bodyColor: "#fff",
        displayColors: false,
        callbacks: {
          label: (tooltipItem) => `Value: $${tooltipItem.raw.toFixed(2)}`, // Display formatted value
        },
      },
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      x: {
        display: false, // Hide X-axis
      },
      y: {
        display: false, // Hide Y-axis
      },
    },
    hover: {
      mode: "nearest", // Ensure hover focuses on nearest point
      intersect: true, // Highlight only when cursor is on a point
    },
  };

  return (
    <>
      {!isExpanded && (
        <div className="relative h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Zfi</h2>
            <div className="text-sm font-semibold text-green-400 flex items-center">
              $2,545.06
              <span className="text-xs ml-2">+10.21%</span>
            </div>
            <FaExternalLinkAlt
              onClick={toggleExpand}
              className="text-gray-400 hover:text-gray-200 cursor-pointer"
              size={18}
            />
          </div>
          {/* Chart */}
          <div className="mt-2 h-36">
            <Line data={data} options={options} />
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="fixed inset-0 bg-black/90 z-50 p-6 flex flex-col items-center">
          <div className="bg-[#0a1929] rounded-lg p-4 w-full max-w-4xl relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Zfi</h2>
              <div className="text-sm font-semibold text-green-400 flex items-center">
                $2,545.06
                <span className="text-xs ml-2">+10.21%</span>
              </div>
              <button
                onClick={toggleExpand}
                className="text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            {/* Chart */}
            <div className="mt-2 h-96">
              <Line data={data} options={options} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ZfiComponent;
