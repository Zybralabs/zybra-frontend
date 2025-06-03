export const Button = ({
  children,
  onClick,
  className = "",
  disabled = false,
  variant = "default",
}: any) => {
  const baseStyle = "px-4 py-4 rounded font-medium focus:outline-none";
  const variantStyles = {
    default: "bg-darkGreen text-white hover:bg-[#013853]",
    outline: "border border-gray-300 hover:bg-gray-50",
    ghost: "",
  };
  return (
    <button
      className={`${baseStyle} ${variantStyles[variant as keyof typeof variantStyles]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-lg ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = "" }: any) => (
  <div className={`px-0 py-4 border-b border-gray-700 ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = "" }: any) => (
  <div className={`px-0 py-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = "" }: any) => (
  <h2 className={`text-3xl font-semibold ${className}`}>{children}</h2>
);
