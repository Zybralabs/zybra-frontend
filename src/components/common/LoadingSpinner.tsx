"use client";

import SimpleLoader from '../SimpleLoader';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  text?: string;
  color?: 'blue' | 'white' | 'gray';
}

export const LoadingSpinner = ({
  size = 'xs',
  text,
  className = '',
  color = 'blue'
}: LoadingSpinnerProps) => {
  return (
    <SimpleLoader
      size={size}
      color={color}
      className={className}
      text={text}
    />
  );
};
