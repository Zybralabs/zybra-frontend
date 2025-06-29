"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { Button } from "@/components/Kyc/Card";
import countries from "@/json/countries.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/Swap/components/input";
import React from "react";

export default function Document() {
  const { updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{front?: File; back?: File}>({});

  const handleDocumentSelect = (type: string) => {
    setSelectedDocType(type);
    updateFormData({ documentType: type as "national-id" | "passport" | "drivers-license" });
    setIsUploadOpen(true);
  };

  const handleFileUpload = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({...prev, [side]: file}));
      // Type-safe way to update form data with dynamic keys
      if (side === 'front') {
        updateFormData({ frontImage: file });
      } else {
        updateFormData({ backImage: file });
      }
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
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-0 py-4 border-b border-gray-700 mb-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Upload Documents</h2>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 md:space-y-8 overflow-y-auto">
          <p className="text-base md:text-xl text-gray-400 leading-relaxed">
            Choose a valid government issued document
          </p>

          <div className="space-y-6">
            {/* Document Issuing Country */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm md:text-base font-medium">
                Document Issuing Country
              </label>
              <Select onValueChange={(value) => updateFormData({ documentCountry: value })}>
                <SelectTrigger className="w-full py-3 md:py-4 px-4 rounded-lg bg-[#002130] text-gray-100 text-sm md:text-base outline-none border border-[#203443] focus:border-[#013853] transition-colors duration-200">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-[#002130] border-[#203443] overflow-y-auto">
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

            {/* Document Type Selection */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg text-gray-400 font-semibold">
                Select document type for verification
              </h3>

              {/* Responsive grid for document types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                  {
                    type: "national-id",
                    label: "National ID",
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-8 h-8 md:w-10 md:h-10"
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
                        className="w-8 h-8 md:w-10 md:h-10"
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
                        className="w-8 h-8 md:w-10 md:h-10"
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
                    className="relative h-32 sm:h-36 md:h-40 w-full flex flex-col items-center justify-center border border-gray-700 bg-[#001F3F] hover:bg-[#013853] active:bg-[#013853] text-white rounded-xl transition-all duration-200 touch-manipulation"
                    onClick={() => handleDocumentSelect(type)}
                  >
                    <div className="mb-2 md:mb-3">{icon}</div>
                    <span className="text-xs sm:text-sm font-semibold capitalize text-gray-300 text-center px-2">
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 text-center px-2 mt-1">
                      {description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons - fixed at bottom */}
        <div className="flex justify-between items-center pt-6 mt-auto">
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
        <DialogContent className="bg-[#001F3F] text-white border-gray-700 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Upload Document Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="text-sm md:text-base text-gray-400 font-medium block mb-2">
                Front Side
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('front')}
                className="mt-1 text-gray-400 text-sm md:text-base py-2 md:py-3 px-3 md:px-4 bg-[#002130] border border-[#203443] rounded-lg focus:border-[#013853] transition-colors duration-200"
              />
              {uploadedFiles.front && (
                <p className="text-sm text-green-400 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Front image uploaded successfully
                </p>
              )}
            </div>
            {selectedDocType !== 'passport' && (
              <div>
                <label className="text-sm md:text-base text-gray-400 font-medium block mb-2">
                  Back Side
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('back')}
                  className="mt-1 text-gray-400 text-sm md:text-base py-2 md:py-3 px-3 md:px-4 bg-[#002130] border border-[#203443] rounded-lg focus:border-[#013853] transition-colors duration-200"
                />
                {uploadedFiles.back && (
                  <p className="text-sm text-green-400 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back image uploaded successfully
                  </p>
                )}
              </div>
            )}

            {/* Upload instructions */}
            <div className="bg-[#002130] p-3 md:p-4 rounded-lg border border-[#203443]">
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                <strong className="text-gray-300">Tips:</strong> Ensure your document is clearly visible,
                well-lit, and all text is readable. Accepted formats: JPG, PNG, PDF.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}