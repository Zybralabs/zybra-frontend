import React from "react";

type ButtonProps = {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const Button: React.FC<ButtonProps> = ({ children, className = "", onClick }) => {
  return (
    <button
      className={`${className} w-full rounded-lg outline-none flex justify-center items-center py-2.5`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
