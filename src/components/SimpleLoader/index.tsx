"use client";

import React from 'react';

interface SimpleLoaderProps {
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
  text?: string;
}

const SimpleLoader: React.FC<SimpleLoaderProps> = ({
  size = 'sm',
  color = 'blue',
  className = '',
  text
}) => {
  // Size mapping
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  // Color mapping
  const colorMap = {
    blue: 'border-blue-400 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div 
        className={`rounded-full animate-spin border-2 ${sizeMap[size]} ${colorMap[color]}`}
        role="status"
        aria-label="Loading"
      />
      {text && <span className="ml-2 text-xs text-gray-400">{text}</span>}
    </div>
  );
};

export default SimpleLoader;
