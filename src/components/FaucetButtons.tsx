import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FaucetButtonProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  description: string;
  tags: string[];
  bgColor: string;
  recommended?: boolean;
}

const FaucetButtons: React.FC<{
  buttons: FaucetButtonProps[];
}> = ({ buttons }) => {
  const [selectedButton, setSelectedButton] = useState<string | null>(null);

  const handleButtonClick = (id: string, url: string) => {
    setSelectedButton(id);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {buttons.map((button) => (
        <motion.div
          key={button.id}
          className={`bg-[#00233A] rounded-lg p-4 border ${
            selectedButton === button.id 
              ? "border-blue-500/60" 
              : "border-[#003354]/60"
          } flex items-start gap-3 hover:border-blue-500/40 transition-colors duration-200 group relative overflow-hidden`}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => handleButtonClick(button.id, button.url)}
        >
          <div className={`absolute top-0 right-0 bg-gradient-to-bl from-${button.bgColor}/10 to-transparent w-32 h-32 -mr-8 -mt-8 rounded-full`}></div>
          <div className={`w-10 h-10 rounded-full bg-[${button.bgColor}] flex items-center justify-center text-xs font-bold shadow-lg mt-1 relative`}>
            {button.icon}
          </div>
          <div className="flex-1 relative">
            <div className="flex items-center">
              <a
                href={button.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1 text-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {button.name}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {button.recommended && (
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Recommended</span>
              )}
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {button.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {button.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-[#001A26] px-2 py-1 rounded-md text-gray-400">{tag}</span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FaucetButtons;
