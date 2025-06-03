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
      className="flex justify-center items-center mb-4 text-gray-400 hover:text-white hover:bg-darkGreen"
    >
      <ChevronLeft className="mr-0 h-4 w-4" />
      Back
    </Button>
  );
}
