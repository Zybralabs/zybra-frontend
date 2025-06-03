import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { HiArrowTrendingUp } from "react-icons/hi2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
  CategoryScale,
  type TooltipItem,
} from "chart.js";

ChartJS.register(PointElement, LineElement, LinearScale, Tooltip, Filler, CategoryScale);

const ZfiComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Sample data for the chart
  const data = {
    labels: Array.from({ length: 20 }, (_, i) => i + 1),
    datasets: [
      {
        label: "ZFI",
        data: [
          1500, 1600, 1750, 2000, 2100, 2200, 2500, 2450, 2600, 2545, 2750, 2700,
          2850, 2900, 3000, 3100, 3200, 3300, 3400, 3545,
        ],
        borderColor: "#4ade80", // Softer green line
        backgroundColor: (context: { chart: { ctx: any; }; }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(74, 222, 128, 0.3)");
          gradient.addColorStop(1, "rgba(74, 222, 128, 0)");
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#4ade80",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart options - compact view
  const compactOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 700
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          title: () => "ZFI",
          label: (tooltipItem: TooltipItem<"line">) => `$${(tooltipItem.raw as number).toFixed(2)}`,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: Math.min(...data.datasets[0].data) * 0.9,
      },
    },
  };

  // Chart options - expanded view
  const expandedOptions = {
    ...compactOptions,
    plugins: {
      ...compactOptions.plugins,
      tooltip: {
        ...compactOptions.plugins.tooltip,
        titleFont: {
          size: 16,
          weight: 700
        },
        bodyFont: {
          size: 14
        },
        callbacks: {
          title: () => "ZFI Price",
          label: (tooltipItem: TooltipItem<"line">) => `$${(tooltipItem.raw as number).toFixed(2)}`,
          afterLabel: (tooltipItem: TooltipItem<"line">) => {
            const currentPrice = tooltipItem.raw;
            const initialPrice = data.datasets[0].data[0];
            const percentChange = (((currentPrice as number) - initialPrice) / initialPrice) * 100;
            return `Change: ${percentChange.toFixed(2)}%`;
          }
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 0
        }
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value: number) => `$${value.toFixed(0)}`
        }
      },
    },
  };

  return (
    <>
      {!isExpanded && (
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#002239] to-[#001424] p-4 border border-[#0a3b54]/40 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-6 w-6 bg-[#0a3b54] rounded-full text-green-400">
                <span className="text-xs font-bold">Z</span>
              </div>
              <h2 className="text-sm font-semibold text-white">ZFI</h2>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={toggleExpand}
                className="ml-4 p-1 rounded-full bg-[#0a3b54]/40 hover:bg-[#0a3b54] transition-colors text-gray-300 hover:text-white"
              >
                <FaExternalLinkAlt size={12} />
              </button>
            </div>
          </div>
          
          {/* Price info */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-white">$2,545.06</span>
            <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-1.5 py-0.5 rounded">
              <HiArrowTrendingUp size={14} />
              <span>10.21%</span>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-28 mt-1">
            <Line data={data} options={compactOptions} />
          </div>
          
          {/* Footer */}
          <div className="mt-2 flex justify-between items-center pt-2">
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="px-1.5 py-0.5 rounded bg-[#0a3b54]/40">24h</span>
              <span>7d</span>
              <span>30d</span>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: 5m ago
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#002239] to-[#001424] rounded-xl p-6 w-full max-w-4xl border border-[#0a3b54]/60 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 bg-[#0a3b54] rounded-full text-green-400">
                  <span className="text-sm font-bold">Z</span>
                </div>
                <h2 className="text-xl font-bold text-white">ZFI Chart</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">$2,545.06</span>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                    <HiArrowTrendingUp size={16} />
                    <span>10.21%</span>
                  </div>
                </div>
                
                <button
                  onClick={toggleExpand}
                  className="p-2 rounded-full bg-[#0a3b54]/40 hover:bg-[#0a3b54] transition-colors text-gray-300 hover:text-white"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
            
            {/* Chart container with subtle inner shadow */}
            <div className="mt-4 bg-[#001424]/80 rounded-lg p-4 shadow-inner h-96 border border-[#0a3b54]/30">
             {/* @ts-ignore */}
              <Line data={data} options={expandedOptions} />
            </div>
            
            {/* Time range selectors */}
            <div className="mt-6 flex justify-center gap-2">
              {["24h", "7d", "30d", "90d", "1y", "All"].map((range) => (
                <button
                  key={range}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    range === "24h"
                      ? "bg-[#0a3b54] text-white"
                      : "bg-[#0a3b54]/20 text-gray-400 hover:bg-[#0a3b54]/40 hover:text-gray-200"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Additional stats */}
            <div className="mt-8 grid grid-cols-4 gap-4">
              {[
                { label: "Market Cap", value: "$120.5M" },
                { label: "Volume (24h)", value: "$3.2M" },
                { label: "Circulating Supply", value: "48.6M ZFI" },
                { label: "All-time High", value: "$3,812.45" }
              ].map((stat, index) => (
                <div key={index} className="bg-[#0a3b54]/20 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-lg font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ZfiComponent;