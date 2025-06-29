"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { Button, CardHeader, CardContent, CardTitle } from "@/components/Kyc/Card";
import React from "react";

export default function InvestorType() {
  const { updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = (type: "individual" | "entity") => {
    updateFormData({ investorType: type });
    setCurrentStep("verification");
    router.push("/kyc/onboarding/verification");
  };

  const handleNext = () => {
    setCurrentStep("document");
    router.push("/kyc/onboarding/verification");
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-2xl md:text-3xl">Select Investor Type</CardTitle>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 space-y-6 md:space-y-8 px-0">
        <p className="text-base md:text-xl text-gray-400 leading-relaxed">
          If you are a U.S. investor, it is only possible to onboard when you are an accredited
          investor.
        </p>

        {/* Investor type selection - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Button
            variant="default"
            className="relative h-[140px] sm:h-[160px] md:h-[180px] w-full flex flex-col items-center justify-center border border-gray-700 bg-[#001F3F] hover:bg-[#002347] active:bg-[#002347] text-white rounded-xl transition-all duration-200 touch-manipulation"
            onClick={() => handleSelect("individual")}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-lg sm:text-xl font-medium">Individual</span>
          </Button>

          <Button
            variant="default"
            className="relative h-[140px] sm:h-[160px] md:h-[180px] w-full flex flex-col items-center justify-center border border-gray-700 bg-[#001F3F] hover:bg-[#013853] active:bg-[#013853] text-white rounded-xl transition-all duration-200 touch-manipulation"
            onClick={() => handleSelect("entity")}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-3 md:mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-lg sm:text-xl font-medium">Entity</span>
          </Button>
        </div>
      </CardContent>

      {/* Navigation buttons - fixed at bottom on mobile */}
      <div className="flex justify-between items-center pt-6 mt-auto">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
