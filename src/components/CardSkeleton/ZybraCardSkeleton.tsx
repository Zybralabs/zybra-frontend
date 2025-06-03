"use client";

import React from "react";
import ZybraLogoLoader from "../ZybraLogoLoader";

type SkeletonProps = {
  type?: "Pool" | "Stock";
};

const ZybraCardSkeleton = ({ type = "Stock" }: SkeletonProps) => {
  return (
    <div className="p-6 rounded-xl flex flex-col justify-between bg-[#001C29] animate-pulse border border-[#003354]/40 shadow-lg">
      <div className="flex justify-between items-center w-full gap-2 mb-4">
        <div className="h-8 w-[40%] bg-[#002A44] rounded-md"></div>
        <ZybraLogoLoader size="sm" />
      </div>

      <div className="flex items-center w-full gap-3 pb-3 border-b border-[#003354]/40 mt-3">
        <div className="aspect-square w-[10%] bg-[#002A44] rounded-md"></div>
        <div className="h-7 w-[60%] bg-[#002A44] rounded-md"></div>
      </div>

      {type === "Stock" ? (
        <>
          <div className="flex justify-between gap-2 items-center mt-4">
            <div className="h-6 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-6 w-10 bg-[#002A44] rounded-md"></div>
          </div>
          <div className="flex justify-between gap-2 items-center mt-4">
            <div className="h-6 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-6 w-10 bg-[#002A44] rounded-md"></div>
          </div>
          <div className="flex justify-between gap-2 items-center mt-4">
            <div className="h-6 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-6 w-10 bg-[#002A44] rounded-md"></div>
          </div>
          <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mt-7">
            <div className="h-10 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-10 w-full xl:w-[25%] bg-[#002A44] rounded-md"></div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between gap-2 items-center mt-4">
            <div className="h-6 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-6 w-[40%] bg-[#002A44] rounded-md"></div>
          </div>
          <div className="flex justify-between gap-2 items-center mt-4">
            <div className="h-6 w-[25%] bg-[#002A44] rounded-md"></div>
            <div className="h-6 w-[40%] bg-[#002A44] rounded-md"></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="h-16 bg-[#002A44] rounded-md"></div>
            <div className="h-16 bg-[#002A44] rounded-md"></div>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-[50%] bg-[#002A44] rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default ZybraCardSkeleton;
