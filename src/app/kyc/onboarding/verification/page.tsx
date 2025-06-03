"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import countries from "@/json/countries.json";

export default function Verification() {
  const { formData, updateFormData, setCurrentStep } = useOnboarding();
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

  const handleNext = () => {
    setCurrentStep("document");
    router.push("/kyc/onboarding/document");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Verify Details</CardTitle>
      </CardHeader>
      {/* <CardContent className="space-y-8 mt-2"> */}
      <p className="text-xl text-gray-400">
        If you are a U.S. investor, it is only possible to onboard when you are an accredited
        investor.
      </p>
      <div className="space-y-4 max-h-md overflow-hidden overflowy-scroll">
        <div className="relative w-full space-y-2">
          <Label className="text-gray-400" htmlFor="dob">
            Name
          </Label>
          <div>
            <input
              type="text"
              id="fullName"
              value={formData.fullName || ""}
              onChange={(e) => updateFormData({ fullName: e.target.value })}
              className="w-full py-3 px-4 pl-10 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443] placeholder:text-gray-500"
              placeholder="Enter Full Name"
            />
            <span className="absolute left-3 top-[55%] text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 12H8m0 0a4 4 0 110-8 4 4 0 010 8zm-4 4v5h12v-5"
                />
              </svg>
            </span>
          </div>
        </div>
        <div className="relative w-full space-y-2">
          <Label className="text-gray-400" htmlFor="dob">
            Email
          </Label>
          <div>
            <input
              id="email"
              type="email"
              value={formData.emailAddress || ""}
              onChange={(e) => updateFormData({ emailAddress: e.target.value })}
              className="w-full py-3 px-4 pl-10 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443] placeholder:text-gray-500"
              placeholder="Enter Email address"
            />
            <span className="absolute left-3 top-[55%] text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 12H8m0 0a4 4 0 110-8 4 4 0 010 8zm-4 4v5h12v-5"
                />
              </svg>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <Label className="text-gray-400" htmlFor="dob">
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
              className="w-full py-3 pl-4 pr-10 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443]"
              style={{ appearance: "textfield" }} // Optional to standardize appearance
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Country of Citizenship</Label>
            <Select onValueChange={(value) => updateFormData({ countryOfCitizenship: value })}>
              <SelectTrigger className="w-full py-3 px-4 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443]">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-[#002130] border-[#203443] max-h-60 overflow-y-auto [&_[data-radix-select-viewport]]:overflow-y-auto">
                {countries
                  .sort((a, b) => a.country.localeCompare(b.country))
                  .map((country) => (
                    <SelectItem
                      key={country.abbreviation}
                      className="text-gray-500 focus:text-white focus:bg-[#013853] pr-4"
                      value={country.abbreviation.toLowerCase()}
                    >
                      {country.country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Country of Residence</Label>
            {/* <Select onValueChange={(value) => updateFormData({ countryOfResidence: value })}>
              <SelectTrigger className="w-full py-3 px-4 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443]">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-[#002130] border-[#203443]">
                <SelectItem
                  className="text-gray-500 focus:text-white focus:bg-[#013853]"
                  value="us"
                >
                  United States
                </SelectItem>
                <SelectItem
                  className="text-gray-500 focus:text-white focus:bg-[#013853]"
                  value="ch"
                >
                  Switzerland
                </SelectItem>
                <SelectItem
                  className="text-gray-500 focus:text-white focus:bg-[#013853]"
                  value="de"
                >
                  Germany
                </SelectItem>
              </SelectContent>
            </Select> */}
            <Select onValueChange={(value) => updateFormData({ countryOfResidence: value })}>
              <SelectTrigger className="w-full py-3 px-4 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443]">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-[#002130] border-[#203443] max-h-60 overflow-y-auto [&_[data-radix-select-viewport]]:overflow-y-auto">
                {countries
                  .sort((a, b) => a.country.localeCompare(b.country))
                  .map((country) => (
                    <SelectItem
                      key={country.abbreviation}
                      className="text-gray-500 focus:text-white focus:bg-[#013853] pr-4"
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
      {/* </CardContent> */}
      <div className="flex justify-between absolute bottom-0 w-[90%] ">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
