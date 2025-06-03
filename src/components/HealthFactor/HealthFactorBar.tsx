"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { getHealthFactorRisk } from '@/hooks/useLending';

interface HealthFactorBarProps {
  healthFactor: number;
  className?: string;
  showLabels?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const HealthFactorBar: React.FC<HealthFactorBarProps> = ({
  healthFactor,
  className = '',
  showLabels = true,
  height = 'md'
}) => {
  const risk = getHealthFactorRisk(healthFactor);

  // Height configurations
  const heightConfig = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  // Calculate progress percentage (0-100%)
  // We'll use a logarithmic scale for better visualization
  const calculateProgress = (hf: number): number => {
    if (hf === Infinity) return 100;
    if (hf <= 0) return 0;
    
    // Use logarithmic scale: 1.0 = 0%, 2.0 = 50%, 4.0 = 75%, 8.0+ = 100%
    const logValue = Math.log2(hf);
    const progress = Math.min(100, Math.max(0, (logValue / 3) * 100));
    return progress;
  };

  const progress = calculateProgress(healthFactor);

  // Define color stops for the gradient
  const getGradientColor = (progress: number): string => {
    if (progress >= 75) return 'from-green-500 to-green-400';
    if (progress >= 50) return 'from-yellow-500 to-orange-400';
    if (progress >= 25) return 'from-orange-500 to-red-400';
    return 'from-red-600 to-red-500';
  };

  const gradientColor = getGradientColor(progress);

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/80">Health Factor</span>
          <span 
            className="text-sm font-semibold"
            style={{ color: risk.color }}
          >
            {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)} - {risk.label}
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${heightConfig[height]}`}>
        <motion.div
          className={`${heightConfig[height]} bg-gradient-to-r ${gradientColor} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Glow effect for high health factors */}
          {progress >= 75 && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-green-300/50 rounded-full blur-sm"></div>
          )}
        </motion.div>
      </div>
      
      {/* Risk zone indicators */}
      <div className="flex justify-between mt-1 text-xs text-white/60">
        <span>Liquidation</span>
        <span>1.0</span>
        <span>2.0</span>
        <span>Safe</span>
      </div>
    </div>
  );
};

export default HealthFactorBar;
