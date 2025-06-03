import React from 'react';

interface StatusSectionProps {
  title: string;
  amount: number;
  buttonText: string;
  onClick: () => void;
  theme: 'blue' | 'red' | 'green' | 'yellow';
  disabled?: boolean;
}

const StatusSection: React.FC<StatusSectionProps> = ({
  title,
  amount,
  buttonText,
  onClick,
  theme = 'blue',
  disabled = false
}) => {
  // Theme configurations
  const themeStyles = {
    blue: {
      button: 'bg-blue-500 hover:bg-blue-600',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400'
    },
    red: {
      button: 'bg-red-500 hover:bg-red-600',
      border: 'border-red-500/20',
      bg: 'bg-red-500/5',
      text: 'text-red-400'
    },
    green: {
      button: 'bg-green-500 hover:bg-green-600',
      border: 'border-green-500/20',
      bg: 'bg-green-500/5',
      text: 'text-green-400'
    },
    yellow: {
      button: 'bg-yellow-500 hover:bg-yellow-600',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/5',
      text: 'text-yellow-400'
    }
  };

  const currentTheme = themeStyles[theme];

  return (
    <div className={`p-4 rounded-lg border ${currentTheme.border} ${currentTheme.bg}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`font-medium ${currentTheme.text}`}>
          {title}
        </h4>
        <span className="text-white font-medium">
          {amount.toLocaleString()} USDC
        </span>
      </div>
      
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 rounded-md font-medium transition-colors duration-200
                   ${currentTheme.button}
                   ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                   text-white`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default StatusSection;