"use client";

import StakingSkeleton from "@/components/StakingSkeleton";
import StakingComponent from "@/components/Stake";
import { Suspense } from "react";

// Create a client-only version of the component

export default function Staking() {
  return (
    <Suspense fallback={<StakingSkeleton />}>
      <StakingComponent />
    </Suspense>
  );
}
