import React from "react";

import clsx from "clsx";
import Image from "next/image";
const Bitcoin = ({
  image,
  name,
  percentage,
  arrowPositon,
}: {
  image: string;
  name: string;
  percentage: number;
  arrowPositon: "up" | "down";
}) => {
  return (
    <div className="flex items-center gap-2">
      <Image src={image} width={22} height={17} alt="bitcoin-img" />
      <span className="text-xs text-white">{name}</span>
      <div className="flex items-center gap-1">
        <i
          className={clsx("pi text-[9px] mt-1", {
            "pi-arrow-up text-green-300": arrowPositon === "up",
            "pi-arrow-down text-red": arrowPositon === "down",
          })}
        ></i>
        <span
          className={clsx("text-sm", {
            " text-green-300": arrowPositon === "up",
            " text-red": arrowPositon === "down",
          })}
        >
          {percentage.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default Bitcoin;
