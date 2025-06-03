import React from "react";
import ZybraCardSkeleton from "./ZybraCardSkeleton";

const StockCardSkeleton = () => (
  <ZybraCardSkeleton type="Stock" />
);

const PoolCardSkeleton = () => (
  <ZybraCardSkeleton type="Pool" />
);

type SkeletonProps = {
  type?: "Pool" | "Stock";
};

const CardSkeleton = ({ type = "Stock" }: SkeletonProps) => {
  return <ZybraCardSkeleton type={type} />;
};

export default CardSkeleton;
