"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle, Skull } from 'lucide-react';
import { getHealthFactorRisk, type HealthFactorRisk } from '@/hooks/useLending';

interface HealthFactorDisplayProps {
  healthFactor: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

const HealthFactorDisplay: React.FC<HealthFactorDisplayProps> = ({
  healthFactor,
  size = 'md',
  showIcon = true,
  showDescription = false,
  className = ''
}) => {
  const risk = getHealthFactorRisk(healthFactor);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1',
      text: 'text-xs',
      icon: 'h-3 w-3',
      value: 'text-sm font-medium',
      description: 'text-xs'
    },
    md: {
      container: 'px-3 py-2',
      text: 'text-sm',
      icon: 'h-4 w-4',
      value: 'text-base font-semibold',
      description: 'text-sm'
    },
    lg: {
      container: 'px-4 py-3',
      text: 'text-base',
      icon: 'h-5 w-5',
      value: 'text-lg font-bold',
      description: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Icon selection based on risk level
  const getIcon = (riskLevel: HealthFactorRisk['level']) => {
    const iconProps = { className: `${config.icon}`, style: { color: risk.color } };
    
    switch (riskLevel) {
      case 'safe':
        return <Shield {...iconProps} />;
      case 'moderate':
        return <AlertTriangle {...iconProps} />;
      case 'danger':
        return <AlertCircle {...iconProps} />;
      case 'liquidation':
        return <Skull {...iconProps} />;
      default:
        return <Shield {...iconProps} />;
    }
  };

  // Format health factor for display
  const formatHealthFactor = (hf: number): string => {
    if (hf === Infinity) return '∞';
    if (hf >= 100) return '99.9+';
    if (hf >= 10) return hf.toFixed(1);
    return hf.toFixed(2);
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 rounded-lg border transition-all duration-200 ${config.container} ${className}`}
      style={{
        backgroundColor: `${risk.color}15`,
        borderColor: `${risk.color}40`
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && getIcon(risk.level)}
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`${config.text} text-white/80`}>Health Factor:</span>
          <span 
            className={`${config.value}`}
            style={{ color: risk.color }}
          >
            {formatHealthFactor(healthFactor)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span 
            className={`${config.text} font-medium`}
            style={{ color: risk.color }}
          >
            {risk.label}
          </span>
        </div>
        
        {showDescription && (
          <span className={`${config.description} text-white/60 mt-1`}>
            {risk.description}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default HealthFactorDisplay;
