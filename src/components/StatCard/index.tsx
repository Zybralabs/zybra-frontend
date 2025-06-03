import React from "react";
import { GrowthIcon, LossIcon } from "../Icons";

type StatCardProps = {
  name: string;
  icon?: React.ReactNode;
  amount: string | number;
  bottomContent?: React.ReactNode;
  growth?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({
  amount,
  name,
  bottomContent,
  icon,
  growth = true,
}) => {
  return (
    <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-[#012b3f] to-[#01223a] rounded-2xl flex flex-col gap-2 text-white w-full border border-[#0a3b54]/40 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium text-white/90">{name}</h5>
          <div className="p-1 bg-[#0a3b54] rounded-full">{icon}</div>
        </div>
        
        <div className="bg-[#0a3b54]/50 p-1 rounded-md">
          {growth ? (
            <div className="text-green-400">
              <GrowthIcon />
            </div>
          ) : (
            <div className="text-red-400">
              <LossIcon />
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-1">
        <span className="text-xl font-bold 2xl:text-2xl tracking-tight">{amount}</span>
      </div>
      
      <div className={`text-xs font-medium ${growth ? 'text-green-400' : 'text-red-400'} flex items-center gap-1 mt-auto`}>
        {growth ? '↑' : '↓'} {bottomContent}
      </div>
    </div>
  );
};

export default StatCard;
