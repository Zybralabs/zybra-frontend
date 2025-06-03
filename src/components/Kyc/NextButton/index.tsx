"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function NextButton({ handleClick, disable }: { handleClick: () => void , disable?:boolean}) {
  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={disable}
      className="flex justify-center items-center mb-4 text-gray-400 hover:text-white hover:hover:bg-darkGreen"
    >
      Next
      <ChevronRight className="mr-0 h-4 w-4" />
    </Button>
  );
}
