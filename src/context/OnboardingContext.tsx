"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export type Step =
  | "link-wallet"
  | "investor-type"
  | "verification"
  | "document"
  | "upload-picture"
  | "address"
  | "complete";

export interface FormData {
  investorType?: "individual" | "entity";
  fullName?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  countryOfCitizenship?: string;
  countryOfResidence?: string;
  documentType?: "national-id" | "passport" | "drivers-license";
  documentCountry?: string;
  documentPicture?: string;
  address?: string;
}

interface OnboardingContextType {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<Step>("link-wallet");
  const [formData, setFormData] = useState<FormData>({});
  const pathname = usePathname();

  useEffect(() => {
    const step = pathname?.split("/").pop() as Step;
    if (step && step !== currentStep) {
      setCurrentStep(step);
    }
  }, [pathname, currentStep]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <OnboardingContext.Provider value={{ currentStep, setCurrentStep, formData, updateFormData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
