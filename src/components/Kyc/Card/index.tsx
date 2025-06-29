import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  className = "",
  disabled = false,
  variant = "default",
  size = "md",
}: ButtonProps) => {
  const baseStyle = "px-4 py-4 rounded font-medium focus:outline-none transition-colors duration-200";
  const variantStyles = {
    default: "bg-darkGreen text-white hover:bg-[#013853]",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
  };
  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`rounded-lg ${className}`}>{children}</div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-0 py-4 border-b border-gray-700 ${className}`}>{children}</div>
);

export const CardContent: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-0 py-4 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = "" }) => (
  <h2 className={`text-3xl font-semibold ${className}`}>{children}</h2>
);
