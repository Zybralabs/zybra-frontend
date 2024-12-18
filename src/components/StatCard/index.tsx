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
    <div className="px-4 pt-6 pb-5 bg-darkGrey rounded-2xl flex flex-col gap-1.5 text-white w-full">
      <div className="flex items-center gap-2.5">
        <h5 className="text-sm">{name}</h5>
        <i>{icon}</i>
      </div>
      <div className="flex items-center w-full justify-between gap-1">
        <span className="text-lg 2xl:text-2xl">{amount}</span>
        <i>{growth ? <GrowthIcon /> : <LossIcon />}</i>
      </div>
      <div className="text-midGreen text-xs">{bottomContent}</div>
    </div>
  );
};

export default StatCard;
