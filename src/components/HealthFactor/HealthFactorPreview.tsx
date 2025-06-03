"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { getHealthFactorRisk, calculateHealthFactorAfterBorrow } from '@/hooks/useLending';

interface HealthFactorPreviewProps {
  currentHealthFactor: number;
  currentCollateral: number;
  currentBorrows: number;
  additionalBorrowValue: number; // In USD
  className?: string;
}

const HealthFactorPreview: React.FC<HealthFactorPreviewProps> = ({
  currentHealthFactor,
  currentCollateral,
  currentBorrows,
  additionalBorrowValue,
  className = ''
}) => {
  // Calculate new health factor after borrow
  const newHealthFactor = calculateHealthFactorAfterBorrow(
    currentCollateral,
    currentBorrows,
    additionalBorrowValue
  );

  const currentRisk = getHealthFactorRisk(currentHealthFactor);
  const newRisk = getHealthFactorRisk(newHealthFactor);

  // Determine if the change is positive or negative
  const isImproving = newHealthFactor > currentHealthFactor;
  const isWorsening = newHealthFactor < currentHealthFactor;

  // Format health factor for display
  const formatHF = (hf: number): string => {
    if (hf === Infinity) return '∞';
    if (hf >= 100) return '99.9+';
    return hf.toFixed(2);
  };

  // Don't show preview if no additional borrow
  if (additionalBorrowValue <= 0) {
    return null;
  }

  return (
    <motion.div
      className={`p-4 rounded-lg border border-white/10 bg-[#0A1721]/50 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white/90">Health Factor Impact</h4>
        {isWorsening && newRisk.level === 'danger' && (
          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
            ⚠️ High Risk
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Current Health Factor */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/60 mb-1">Current</span>
          <div className="flex items-center gap-2">
            <span 
              className="text-lg font-bold"
              style={{ color: currentRisk.color }}
            >
              {formatHF(currentHealthFactor)}
            </span>
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: `${currentRisk.color}20`,
                color: currentRisk.color,
                border: `1px solid ${currentRisk.color}40`
              }}
            >
              {currentRisk.label}
            </span>
          </div>
        </div>

        {/* Arrow with trend indicator */}
        <div className="flex flex-col items-center mx-4">
          <div className="flex items-center gap-1">
            {isWorsening && <TrendingDown className="h-3 w-3 text-red-400" />}
            {isImproving && <TrendingUp className="h-3 w-3 text-green-400" />}
            <ArrowRight className="h-4 w-4 text-white/60" />
          </div>
          <span className="text-xs text-white/50 mt-1">After Borrow</span>
        </div>

        {/* New Health Factor */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/60 mb-1">New</span>
          <div className="flex items-center gap-2">
            <span 
              className="text-lg font-bold"
              style={{ color: newRisk.color }}
            >
              {formatHF(newHealthFactor)}
            </span>
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: `${newRisk.color}20`,
                color: newRisk.color,
                border: `1px solid ${newRisk.color}40`
              }}
            >
              {newRisk.label}
            </span>
          </div>
        </div>
      </div>

      {/* Risk warning */}
      {newRisk.level === 'danger' || newRisk.level === 'liquidation' ? (
        <motion.div
          className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-red-400">
            <strong>⚠️ Warning:</strong> {newRisk.description}
          </p>
          {newRisk.level === 'liquidation' && (
            <p className="text-xs text-red-300 mt-1">
              Consider reducing the borrow amount or supplying more collateral.
            </p>
          )}
        </motion.div>
      ) : newRisk.level === 'moderate' && currentRisk.level === 'safe' ? (
        <motion.div
          className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-yellow-400">
            Your position will move from safe to moderate risk. Monitor carefully.
          </p>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default HealthFactorPreview;
