"use client";

import React from 'react';
import ZybraLogoLoader from '@/components/ZybraLogoLoader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full min-h-[70vh]">
      <div className="flex flex-col items-center">
        <ZybraLogoLoader size="lg" />
      </div>
    </div>
  );
}
