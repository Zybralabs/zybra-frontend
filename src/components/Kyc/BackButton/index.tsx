"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="flex justify-center items-center px-4 py-2 md:px-6 md:py-3 text-sm md:text-base text-gray-400 hover:text-white hover:bg-darkGreen transition-colors duration-200 touch-manipulation min-h-[44px]"
    >
      <ChevronLeft className="mr-1 h-4 w-4 md:h-5 md:w-5" />
      <span className="hidden sm:inline">Back</span>
      <span className="sm:hidden">Back</span>
    </Button>
  );
}
