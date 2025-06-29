"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface NextButtonProps {
  handleClick: () => void;
  disable?: boolean;
}

export function NextButton({ handleClick, disable }: NextButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={disable}
      className="flex justify-center items-center px-4 py-2 md:px-6 md:py-3 text-sm md:text-base text-gray-400 hover:text-white hover:bg-darkGreen disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 touch-manipulation min-h-[44px]"
    >
      <span className="hidden sm:inline">Next</span>
      <span className="sm:hidden">Next</span>
      <ChevronRight className="ml-1 h-4 w-4 md:h-5 md:w-5" />
    </Button>
  );
}
