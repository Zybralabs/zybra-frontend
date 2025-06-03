"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    indicatorClassName, 
    showValue = false,
    size = "md",
    animated = false,
    ...props 
  }, ref) => {
    // Calculate percentage
    const percentage = value && max ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
    
    // Determine height based on size
    const heightClass = {
      sm: "h-1",
      md: "h-1.5",
      lg: "h-2",
    }[size];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-[#001525]",
          heightClass,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            animated && "animate-pulse",
            indicatorClassName || "bg-gradient-to-r from-blue-500 to-blue-400"
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Add slight shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
               style={{ backgroundSize: "200% 100%" }} />
        </div>
        
        {showValue && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };