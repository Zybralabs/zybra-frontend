"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { Label } from "@/components/Swap-new/components/label";
import { Input } from "@/components/Swap-new/components/input";
import { CardHeader, CardTitle } from "@/components/Kyc/Card";

export default function Address() {
  const { formData, updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();

  const handleNext = () => {
    setCurrentStep("complete");
    router.push("/kyc/onboarding/complete");
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-2xl md:text-3xl">Confirm Address</CardTitle>
      </CardHeader>

      {/* Content */}
      <div className="flex-1 space-y-6 md:space-y-8">
        <p className="text-base md:text-xl text-gray-400 leading-relaxed">
          Please confirm your residential address for verification purposes.
        </p>

        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-400 text-sm md:text-base font-medium">
              Full Address
            </Label>
            <div className="relative">
              <Input
                id="address"
                className="w-full py-3 md:py-4 px-4 pl-10 md:pl-12 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] placeholder:text-gray-500 focus:border-[#013853] transition-colors duration-200"
                placeholder="Enter your full address"
                value={formData.address || ""}
                onChange={(e) => updateFormData({ address: e.target.value })}
              />
              <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 md:h-5 md:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
            </div>
          </div>

          {/* Additional address fields for better UX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-400 text-sm md:text-base font-medium">
                City
              </Label>
              <Input
                id="city"
                className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] placeholder:text-gray-500 focus:border-[#013853] transition-colors duration-200"
                placeholder="Enter city"
                value={formData.city || ""}
                onChange={(e) => updateFormData({ city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-gray-400 text-sm md:text-base font-medium">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] placeholder:text-gray-500 focus:border-[#013853] transition-colors duration-200"
                placeholder="Enter postal code"
                value={formData.postalCode || ""}
                onChange={(e) => updateFormData({ postalCode: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons - fixed at bottom */}
      <div className="flex justify-between items-center pt-6 mt-auto">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
