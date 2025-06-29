"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface LendingMetricsCardsProps {
  totalSupplied: number;
  totalBorrowed: number;
  borrowUtilization: number;
  borrowLimit: number;
  healthFactor: number;
  isLoading?: boolean;
  hasUserAddress?: boolean;
  hasUserData?: boolean;
  className?: string;
}

export const LendingMetricsCard: React.FC<LendingMetricsCardsProps> = ({
  totalSupplied,
  totalBorrowed,
  borrowUtilization,
  borrowLimit,
  healthFactor,
  isLoading = false,
  hasUserAddress = true,
  hasUserData = true,
  className = ''
}) => {
  // Health Factor Logic with your exact color scheme
  const getHealthFactorRisk = (hf: number) => {
    if (hf === Infinity) {
      return {
        level: 'perfect',
        color: 'green',
        text: 'Very Safe',
        description: 'No borrowing risk',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-400/30',
        textColor: 'text-emerald-400',
        percentage: 100,
        barColor: 'from-emerald-400 to-emerald-500'
      };
    }
    if (hf >= 2.0) {
      return {
        level: 'safe',
        color: 'green',
        text: 'Very Safe',
        description: 'Low liquidation risk',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-400/30',
        textColor: 'text-emerald-400',
        percentage: Math.min(100, ((hf - 2.0) / 1.0) * 20 + 80),
        barColor: 'from-emerald-400 to-emerald-500'
      };
    }
    if (hf >= 1.5) {
      return {
        level: 'good',
        color: 'blue',
        text: 'Safe',
        description: 'Moderate liquidation risk',
        bgColor: 'bg-[#4BB6EE]/10',
        borderColor: 'border-[#4BB6EE]/30',
        textColor: 'text-[#4BB6EE]',
        percentage: ((hf - 1.5) / 0.5) * 20 + 60,
        barColor: 'from-[#4BB6EE] to-[#65C7F7]'
      };
    }
    if (hf >= 1.1) {
      return {
        level: 'medium',
        color: 'amber',
        text: 'Medium Risk',
        description: 'Elevated liquidation risk',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-400/30',
        textColor: 'text-amber-400',
        percentage: ((hf - 1.1) / 0.4) * 20 + 40,
        barColor: 'from-amber-400 to-amber-500'
      };
    }
    if (hf >= 1.0) {
      return {
        level: 'high',
        color: 'red',
        text: 'High Risk',
        description: 'High liquidation risk',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-400/30',
        textColor: 'text-red-400',
        percentage: ((hf - 1.0) / 0.1) * 20 + 20,
        barColor: 'from-red-400 to-red-500'
      };
    }
    return {
      level: 'liquidation',
      color: 'red',
      text: 'Liquidation Risk',
      description: 'Immediate liquidation danger',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/50',
      textColor: 'text-red-400',
      percentage: Math.max(5, hf * 20),
      barColor: 'from-red-500 to-red-600'
    };
  };

  const risk = getHealthFactorRisk(healthFactor);

  // Calculate liquidation price and other metrics
  const liquidationThreshold = totalSupplied * 0.8; // Assuming 80% LTV
  const availableToBorrow = Math.max(0, liquidationThreshold - totalBorrowed);

  return (
    <div className={`${className}`}>
      {/* Horizontal Cards Layout - Exact Website Colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Supplied Card */}
        <motion.div
          className="bg-[#001C29] rounded-xl border border-[#003354]/40 p-6 hover:border-[#003354]/60 transition-all duration-300 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-[#4BB6EE] flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-400 text-sm font-medium">Total Supplied</div>
            <div className="text-2xl font-bold text-white">
              ${totalSupplied.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className="text-gray-500 text-xs">Across all assets</div>
          </div>
        </motion.div>

        {/* Total Borrowed Card */}
        <motion.div
          className="bg-[#001C29] rounded-xl border border-[#003354]/40 p-6 hover:border-[#003354]/60 transition-all duration-300 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-400 text-sm font-medium">Total Borrowed</div>
            <div className="text-2xl font-bold text-white">
              ${totalBorrowed.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className="text-gray-500 text-xs">Outstanding debt</div>
          </div>
        </motion.div>

        {/* Borrow Utilization Card */}
        <motion.div
          className="bg-[#001C29] rounded-xl border border-[#003354]/40 p-6 hover:border-[#003354]/60 transition-all duration-300 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-400 text-sm font-medium">Borrow Utilization</div>
            <div className="text-2xl font-bold text-white">
              {(borrowUtilization * 100).toFixed(2)}%
            </div>
            <div className="text-gray-500 text-xs">
              of ${borrowLimit.toLocaleString(undefined, {maximumFractionDigits: 2})} limit
            </div>
          </div>
        </motion.div>
      </div>

      {/* Health Factor Section - Exact Website Styling */}
      <motion.div
        className="bg-[#001C29] rounded-xl border border-[#003354]/40 overflow-hidden shadow-[0_0_30px_rgba(0,70,120,0.15)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Health Factor Header */}
        <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-4 px-6 border-b border-[#003354]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                risk.color === 'green' ? 'bg-emerald-500' :
                risk.color === 'blue' ? 'bg-[#4BB6EE]' :
                risk.color === 'amber' ? 'bg-amber-500' :
                'bg-red-500'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-1">Health Factor</h3>
                <p className="text-gray-400 text-sm">{risk.description}</p>
              </div>
            </div>

            {/* Health Factor Value with Circular Progress */}
            <div className="flex items-center gap-6">
              {/* Circular Progress Chart */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-[#003354]"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress circle */}
                  <motion.path
                    className={risk.textColor}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    initial={{ strokeDasharray: "0 100" }}
                    animate={{ strokeDasharray: `${risk.percentage} 100` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${risk.textColor}`}>
                    {Math.round(risk.percentage)}%
                  </span>
                </div>
              </div>

              {/* Health Factor Value */}
              <div className="text-right">
                <div className={`text-3xl font-bold ${risk.textColor} mb-2`}>
                  {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${risk.bgColor} ${risk.borderColor}`}>
                  <div className={`w-2 h-2 rounded-full ${risk.textColor.replace('text-', 'bg-')}`}></div>
                  <span className={`text-sm font-medium ${risk.textColor}`}>
                    {risk.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Factor Progress Bar */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-300">Risk Assessment</span>
              <span className={`text-sm font-medium ${risk.textColor}`}>
                {risk.percentage.toFixed(1)}% Safe
              </span>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative">
              <div className="w-full h-3 bg-[#003354]/50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${risk.barColor} shadow-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.percentage}%` }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                />
              </div>

              {/* Risk Zone Markers */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Liquidation</span>
                <span>1.0</span>
                <span>1.5</span>
                <span>2.0</span>
                <span>Safe</span>
              </div>
            </div>
          </div>

          {/* Additional Health Factor Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
              <div className="text-gray-400 text-sm mb-1">Liquidation Threshold</div>
              <div className="text-white font-semibold text-lg">
                ${liquidationThreshold.toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
            </div>

            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
              <div className="text-gray-400 text-sm mb-1">Available to Borrow</div>
              <div className="text-white font-semibold text-lg">
                ${availableToBorrow.toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
            </div>

            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
              <div className="text-gray-400 text-sm mb-1">Borrow Capacity Used</div>
              <div className={`font-semibold text-lg ${
                borrowUtilization > 0.8 ? 'text-red-400' :
                borrowUtilization > 0.6 ? 'text-amber-400' :
                borrowUtilization > 0.4 ? 'text-[#4BB6EE]' :
                'text-emerald-400'
              }`}>
                {(borrowUtilization * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

