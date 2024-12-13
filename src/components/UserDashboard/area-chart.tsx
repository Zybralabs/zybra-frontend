"use client";

import { useEffect, useRef } from "react";

interface AreaChartProps {
  data: number[];
  height?: number;
  className?: string;
}

export function AreaChart({ data, height = 400, className = "" }: AreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw area
    ctx.beginPath();
    ctx.moveTo(0, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.2)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0)");

    // Draw points
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * canvas.offsetWidth;
      const y = height - (value / Math.max(...data)) * height;
      ctx.lineTo(x, y);
    });

    // Complete the area
    ctx.lineTo(canvas.offsetWidth, height);
    ctx.closePath();

    // Fill area
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * canvas.offsetWidth;
      const y = height - (value / Math.max(...data)) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, height]);

  return (
    <div className={`relative h-[${height}px] w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" style={{ height: `${height}px` }} />
    </div>
  );
}
