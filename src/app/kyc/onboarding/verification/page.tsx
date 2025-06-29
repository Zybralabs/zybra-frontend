"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/Swap-new/components/input";
import { Label } from "@/components/Swap-new/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { CardHeader, CardTitle } from "@/components/Kyc/Card";
import countries from "@/json/countries.json";
import React from "react";

export default function Verification() {
  const { formData, updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();

  const handleNext = () => {
    setCurrentStep("document");
    router.push("/kyc/onboarding/document");
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-2xl md:text-3xl">Verify Details</CardTitle>
      </CardHeader>

      {/* Description */}
      <p className="text-base md:text-xl text-gray-400 mb-6 leading-relaxed">
        If you are a U.S. investor, it is only possible to onboard when you are an accredited
        investor.
      </p>

      {/* Form Content - scrollable on mobile */}
      <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto">
        {/* Full Name Field */}
        <div className="relative w-full space-y-2">
          <Label className="text-gray-400 text-sm md:text-base" htmlFor="fullName">
            Full Name
          </Label>
          <div className="relative">
            <input
              type="text"
              id="fullName"
              value={formData.fullName || ""}
              onChange={(e) => updateFormData({ fullName: e.target.value })}
              className="w-full py-3 md:py-4 px-4 pl-10 md:pl-12 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] placeholder:text-gray-500 focus:border-[#013853] transition-colors duration-200"
              placeholder="Enter Full Name"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
          </div>
        </div>
        {/* Email Field */}
        <div className="relative w-full space-y-2">
          <Label className="text-gray-400 text-sm md:text-base" htmlFor="email">
            Email Address
          </Label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={formData.emailAddress || ""}
              onChange={(e) => updateFormData({ emailAddress: e.target.value })}
              className="w-full py-3 md:py-4 px-4 pl-10 md:pl-12 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] placeholder:text-gray-500 focus:border-[#013853] transition-colors duration-200"
              placeholder="Enter Email address"
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
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm-7 4l-.02.01M12 14l.02.01M19 14l.02.01"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Responsive grid for form fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm md:text-base" htmlFor="dob">
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
              className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] focus:border-[#013853] transition-colors duration-200"
            />
          </div>
          {/* Country of Citizenship */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm md:text-base">Country of Citizenship</Label>
            <Select onValueChange={(value) => updateFormData({ countryOfCitizenship: value })}>
              <SelectTrigger className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] focus:border-[#013853] transition-colors duration-200">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-[#002130] border-[#203443] max-h-60 overflow-y-auto">
                {countries
                  .sort((a, b) => a.country.localeCompare(b.country))
                  .map((country) => (
                    <SelectItem
                      key={country.abbreviation}
                      className="text-gray-500 focus:text-white focus:bg-[#013853] text-sm md:text-base"
                      value={country.abbreviation.toLowerCase()}
                    >
                      {country.country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country of Residence */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm md:text-base">Country of Residence</Label>
            <Select onValueChange={(value) => updateFormData({ countryOfResidence: value })}>
              <SelectTrigger className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] focus:border-[#013853] transition-colors duration-200">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-[#002130] border-[#203443] max-h-60 overflow-y-auto">
                {countries
                  .sort((a, b) => a.country.localeCompare(b.country))
                  .map((country) => (
                    <SelectItem
                      key={country.abbreviation}
                      className="text-gray-500 focus:text-white focus:bg-[#013853] text-sm md:text-base"
                      value={country.abbreviation.toLowerCase()}
                    >
                      {country.country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
