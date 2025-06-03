"use client";

import React from 'react';
import ZybraLogoLoader from '@/components/ZybraLogoLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#001525]">
      <div className="flex flex-col items-center">
        <ZybraLogoLoader size="lg" />
      </div>
    </div>
  );
}
