"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";

export default function InvestorType() {
  const { updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();

  const Button = ({
    children,
    onClick,
    className = "",
    disabled = false,
    variant = "default",
  }: any) => {
    const baseStyle = "px-4 py-4 rounded font-medium focus:outline-none";
    const variantStyles = {
      default: "bg-darkGreen text-white hover:bg-[#013853]",
      outline: "border border-gray-300 hover:bg-gray-50",
      ghost: "hover:bg-gray-100",
    };
    return (
      <button
        className={`${baseStyle} ${variantStyles[variant as keyof typeof variantStyles]} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  const Card = ({ children, className = "" }: any) => (
    <div className={`rounded-lg ${className}`}>{children}</div>
  );

  const CardHeader = ({ children, className = "" }: any) => (
    <div className={`px-0 py-4 border-b border-gray-700 ${className}`}>{children}</div>
  );

  const CardContent = ({ children, className = "" }: any) => (
    <div className={`px-0 py-4 ${className}`}>{children}</div>
  );

  const CardTitle = ({ children, className = "" }: any) => (
    <h2 className={`text-3xl font-semibold ${className}`}>{children}</h2>
  );

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
    <div className="max-w-6xl mx-auto px-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Select Investor Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <p className="text-xl text-gray-400">
          If you are a U.S. investor, it is only possible to onboard when you are an accredited
          investor.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <Button
            variant="default"
            className="relative h-[180px] w-full flex flex-col items-center justify-center border-1 border-gray-700 bg-[#001F3F] hover:bg-[#002347] text-white rounded-xl transition-all"
            onClick={() => handleSelect("individual")}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 mb-4 text-gray-400"
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
            <span className="text-xl font-medium">Individual</span>
          </Button>
          <Button
            variant="default"
            className="relative h-[180px] w-full flex flex-col items-center justify-center border-1 border-gray-700 bg-[#001F3F] hover:bg-[#013853] text-white rounded-xl transition-all"
            onClick={() => handleSelect("entity")}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 mb-4 text-gray-400"
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
            <span className="text-xl font-medium">Entity</span>
          </Button>
        </div>
      </CardContent>
      <div className="flex justify-between absolute bottom-0 w-[90%] ">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
