"use client";

import { useState, useRef } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { Upload, X } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, Button } from "@/components/Kyc/Card";

export default function UploadPicture() {
  const { updateFormData, setCurrentStep } = useOnboarding();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleNext = () => {
    setCurrentStep("address");
    router.push("/kyc/onboarding/address");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        updateFormData({ documentPicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setPreview(null);
    updateFormData({ documentPicture: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-2xl md:text-3xl">Upload Profile Picture</CardTitle>
      </CardHeader>

      {/* Content */}
      <div className="flex-1 space-y-6 md:space-y-8">
        <p className="text-base md:text-xl text-gray-400 leading-relaxed">
          Please upload a clear picture of your selected document. Make sure all text is readable and the image is well-lit.
        </p>

        {/* Upload area - responsive height */}
        <div
          className={`relative h-[250px] sm:h-[300px] md:h-[400px] rounded-lg border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? "border-teal-400 bg-[rgba(1,56,83,0.1)] scale-[1.02]"
              : "border-gray-700 bg-[rgba(28,37,54,0.8)]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative h-full">
              <img
                src={preview || "/placeholder.svg"}
                alt="Document preview"
                className="h-full w-full object-contain p-2 md:p-4 rounded-lg"
              />
              <button
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-gray-900/80 p-2 text-gray-400 hover:text-white hover:bg-gray-900 transition-colors duration-200 touch-manipulation"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <Upload className="mb-3 md:mb-4 h-8 w-8 md:h-10 md:w-10 text-gray-400" />
              <p className="mb-2 text-sm md:text-base text-gray-400">
                <span className="hidden sm:inline">Drag and drop your document here</span>
                <span className="sm:hidden">Tap to upload your document</span>
              </p>
              <p className="mb-4 text-xs md:text-sm text-gray-500">or</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                className="border-gray-700 py-2 md:py-3 px-4 md:px-6 bg-[#013853] text-gray-300 hover:bg-[#044A6C] hover:text-white transition-colors duration-200 touch-manipulation text-sm md:text-base"
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload tips */}
              <div className="mt-4 text-xs text-gray-500 max-w-xs">
                <p>Supported formats: JPG, PNG, PDF</p>
                <p>Max file size: 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons - fixed at bottom */}
      <div className="flex justify-between items-center pt-6 mt-auto">
        <BackButton />
        <NextButton handleClick={handleNext} disable={!preview} />
      </div>
    </div>
  );
}
