"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";

interface NextButtonProps {
  handleClick: () => void;
  disabled?: boolean;
}
import countries from "@/json/countries.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/Swap/components/input";

export default function Document() {
  const { updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{front?: File; back?: File}>({});

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

  const handleDocumentSelect = (type: string) => {
    setSelectedDocType(type);
    updateFormData({ documentType: type as "national-id" | "passport" | "drivers-license" });
    setIsUploadOpen(true);
  };

  const handleFileUpload = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({...prev, [side]: file}));
      updateFormData({ [`${side}Image`]: file });
    }
  };

  const handleNext = () => {
    if (selectedDocType === 'passport' && uploadedFiles.front) {
      setCurrentStep("upload-picture");
      router.push("/kyc/onboarding/upload-picture");
    } else if ((selectedDocType === 'national-id' || selectedDocType === 'drivers-license') && 
               uploadedFiles.front && uploadedFiles.back) {
      setCurrentStep("upload-picture");
      router.push("/kyc/onboarding/upload-picture");
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 space-y-4">
        <div className="px-0 py-4 border-b border-gray-700">
          <h2 className="text-3xl font-semibold">Upload Documents</h2>
        </div>
        <div className="space-y-8 !p-0">
          <h1 className="text-xl text-gray-400">Choose a valid government issued document</h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-400">Document Issuing Country</label>
              <Select onValueChange={(value) => updateFormData({ documentCountry: value })}>
                <SelectTrigger className="w-full py-3 px-4 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443]">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="h-[250px] bg-[#002130] border-[#203443]">
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
              <h3 className="text-lg text-gray-400 font-semibold">
                Select document type for verification
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  {
                    type: "national-id",
                    label: "National ID",
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="6" width="18" height="12" rx="2" ry="2"></rect>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <line x1="3" y1="14" x2="21" y2="14"></line>
                      </svg>
                    ),
                    description: "Front and back side",
                  },
                  {
                    type: "passport",
                    label: "Passport",
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="3" width="16" height="18" rx="2" ry="2"></rect>
                        <line x1="4" y1="9" x2="20" y2="9"></line>
                        <line x1="4" y1="13" x2="20" y2="13"></line>
                        <line x1="4" y1="17" x2="20" y2="17"></line>
                      </svg>
                    ),
                    description: "Photo Page",
                  },
                  {
                    type: "drivers-license",
                    label: "Driver's License",
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="3" width="16" height="18" rx="2" ry="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                        <line x1="12" y1="14" x2="12" y2="16"></line>
                      </svg>
                    ),
                    description: "Front and back side",
                  },
                ].map(({ type, label, icon, description }) => (
                  <Button
                    key={type}
                    variant="default"
                    className="relative h-36 w-full flex flex-col items-center justify-center border-1 border-gray-700 bg-[#001F3F] hover:bg-[#013853] text-white rounded-xl transition-all"
                    onClick={() => handleDocumentSelect(type)}
                  >
                    <div className="mb-2">{icon}</div>
                    <span className="text-sm font-semibold capitalize text-gray-300">{label}</span>
                    <span className="text-xs text-gray-400">{description}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between absolute bottom-0 w-[90%]">
          <BackButton />
          <NextButton 
            handleClick={handleNext} 
            
            disable={
              selectedDocType === 'passport' 
                ? !uploadedFiles.front 
                : !uploadedFiles.front || !uploadedFiles.back
            }
          />
        </div>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-[#001F3F] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Upload Document Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Front Side</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('front')}
                className="mt-1 text-gray-400"
              />
              {uploadedFiles.front && (
                <p className="text-sm text-green-400 mt-1">Front image uploaded</p>
              )}
            </div>
            {selectedDocType !== 'passport' && (
              <div>
                <label className="text-sm text-gray-400">Back Side</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('back')}
                  className="mt-1 text-gray-400"
                />
                {uploadedFiles.back && (
                  <p className="text-sm text-green-400 mt-1">Back image uploaded</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}