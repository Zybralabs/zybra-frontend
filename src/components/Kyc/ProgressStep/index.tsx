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
    <div className="space-y-8 mt-6">
      {STEPS.map((step) => {
        const isCurrent = currentStep === step.href.split("/").pop();
        const isCompleted =
          STEPS.findIndex((s) => s.href.includes(currentStep)) >
          STEPS.findIndex((s) => s.href === step.href);

        return (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center space-x-3 ${
              isCurrent
                ? "text-white font-semibold"
                : isCompleted
                  ? "text-white/80"
                  : "text-white/20"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCurrent
                  ? "bg-[#013853] text-white"
                  : isCompleted
                    ? "bg-[#044F74] text-white"
                    : "bg-[#044F74]/20 text-white/20"
              }`}
            >
              {step.id}
            </div>
            <span>{step.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
