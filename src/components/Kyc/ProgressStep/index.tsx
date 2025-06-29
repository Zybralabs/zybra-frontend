"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import Link from "next/link";

const STEPS = [
  // { id: 1, title: "Link wallet", href: "/kyc/onboarding/link-wallet" },
  { id: 1, title: "Investor type", href: "/kyc/onboarding/investor-type" },
  { id: 2, title: "Verification", href: "/kyc/onboarding/verification" },
  { id: 3, title: "Document", href: "/kyc/onboarding/document" },
  { id: 4, title: "Upload Picture", href: "/kyc/onboarding/upload-picture" },
  { id: 5, title: "Address", href: "/kyc/onboarding/address" },
  { id: 6, title: "Complete", href: "/kyc/onboarding/complete" },
];

export function ProgressSteps() {
  const { currentStep } = useOnboarding();

  return (
    <>
      {/* Mobile: Horizontal progress bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/80">Progress</h3>
          <span className="text-xs text-white/60">
            {STEPS.findIndex((s) => s.href.includes(currentStep)) + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#044F74]/20 rounded-full h-2 mb-4">
          <div
            className="bg-[#013853] h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((STEPS.findIndex((s) => s.href.includes(currentStep)) + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Current step indicator */}
        <div className="text-center">
          <div className="text-sm font-medium text-white">
            {STEPS.find((s) => s.href.includes(currentStep))?.title || "Getting Started"}
          </div>
        </div>
      </div>

      {/* Desktop: Vertical step list */}
      <div className="hidden md:block space-y-6 mt-6">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.href.split("/").pop();
          const isCompleted =
            STEPS.findIndex((s) => s.href.includes(currentStep)) >
            STEPS.findIndex((s) => s.href === step.href);

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center space-x-3 transition-colors duration-200 hover:text-white/90 ${
                isCurrent
                  ? "text-white font-semibold"
                  : isCompleted
                    ? "text-white/80"
                    : "text-white/40"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                  isCurrent
                    ? "bg-[#013853] text-white shadow-lg"
                    : isCompleted
                      ? "bg-[#044F74] text-white"
                      : "bg-[#044F74]/20 text-white/40"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className="text-sm">{step.title}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
