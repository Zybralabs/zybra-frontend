"use client";

import { useRouter } from "next/navigation";
import { BackButton } from "@/components/Kyc/BackButton";
import { CardHeader, CardTitle, Button } from "@/components/Kyc/Card";
import { useUserAccount } from "@/context/UserAccountContext";
import { useEffect } from "react";

export default function Complete() {
  const router = useRouter();

  const { submitKYC } = useUserAccount();

  const handleViewPools = () => {
    router.push("/offers");
  };

  useEffect(() => {
    submitKYC();
  }, [submitKYC]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Success Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 px-4">
        {/* Success Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Title */}
        <CardHeader className="flex flex-col items-center space-y-0 pb-0 px-0">
          <CardTitle className="text-2xl md:text-3xl lg:text-4xl text-center">
            <span className="text-green-600">✓</span> You are All Set!
          </CardTitle>
        </CardHeader>

        {/* Success Message */}
        <div className="space-y-4 max-w-md">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Thank you for verifying your identity.
          </h1>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed">
            Your profile will be updated within 24 hours. In the meantime, feel free to explore our platform and discover available investment opportunities.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            variant="default"
            size="lg"
            onClick={handleViewPools}
            className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium bg-[#013853] hover:bg-[#044A6C] text-white rounded-lg transition-colors duration-200 touch-manipulation"
          >
            Explore Investment Pools
          </Button>
        </div>

        {/* Additional Info */}
        <div className="bg-[#002130] p-4 md:p-6 rounded-lg border border-[#203443] max-w-md">
          <h3 className="text-sm md:text-base font-medium text-gray-300 mb-2">What&apos;s Next?</h3>
          <ul className="text-xs md:text-sm text-gray-400 space-y-1">
            <li>• Your KYC verification is being processed</li>
            <li>• You&apos;ll receive an email confirmation</li>
            <li>• Start exploring investment opportunities</li>
          </ul>
        </div>
      </div>

      {/* Navigation - only back button */}
      <div className="flex justify-start items-center pt-6">
        <BackButton />
      </div>
    </div>
  );
}
