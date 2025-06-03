"use client";

import React from 'react';
import ZybraLogoLoader from '../ZybraLogoLoader';

interface LoadingContentProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const LoadingContent: React.FC<LoadingContentProps> = ({
  size = 'md',
  className = '',
  showText = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full min-h-[120px] ${className}`}>
      <ZybraLogoLoader size={size} />
      {showText && (
        <div className="mt-2 text-sm text-white/70">
          Loading content...
        </div>
      )}
    </div>
  );
};

export default LoadingContent;
