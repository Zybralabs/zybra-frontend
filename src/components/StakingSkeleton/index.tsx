import React from "react";

const StakingSkeleton = () => {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="h-10 w-full max-w-[600px] rounded-full bg-gray-400 mt-10"></div>
      <div className="h-5 w-full max-w-[530px] rounded-full bg-gray-400 mt-6"></div>
      <div className="h-5 w-full max-w-[400px] rounded-full bg-gray-400 mt-3"></div>
      <div className="h-12 w-full max-w-[300px] rounded-full bg-gray-400 mt-10"></div>
      <div className="h-10 w-full max-w-[672px] rounded-lg bg-[#001C29] mt-10 flex flex-col p-6">
        <div className="flex items-center gap-6 justify-between">
          <div className="h-20 w-2/5 rounded-lg bg-gray-400"></div>
          <div className="h-20 w-2/5 rounded-lg bg-gray-400"></div>
        </div>
        <div className="flex flex-col justify-between mt-6">
          <div className="flex justify-between gap-4 items-center border-b border-white/15 pb-6">
            <div className="h-10 w-1/5 rounded-lg bg-gray-400"></div>
            <div className="h-10 w-1/5 rounded-lg bg-gray-400"></div>
          </div>
          <div className="h-5 w-14 rounded-full bg-gray-400 my-7"></div>
          <div className="h-5 w-full rounded-full bg-gray-400"></div>
          <div className="flex justify-between gap-4 items-center border-b border-white/15 mt-6">
            <div className="h-5 w-1/5 rounded-lg bg-gray-400"></div>
            <div className="h-5 w-1/5 rounded-lg bg-gray-400"></div>
          </div>
          <div className="h-11 w-full rounded-full bg-gray-400 mt-6"></div>
        </div>
      </div>
    </div>
  );
};

export default StakingSkeleton;
