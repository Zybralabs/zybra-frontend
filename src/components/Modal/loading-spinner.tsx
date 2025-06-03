"use client";

import React from "react";
import SimpleLoader from "../SimpleLoader";

type LoadingSpinnerProps = {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'xs',
  color = 'blue',
  text
}) => (
  <SimpleLoader
    size={size}
    color={color}
    className={className}
    text={text}
  />
);
