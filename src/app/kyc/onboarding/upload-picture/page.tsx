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
    <div className="space-y-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Upload Profile Picture</CardTitle>
      </CardHeader>
      {/* <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Upload Document Picture</h1>
        <p className="text-gray-400">Please upload a clear picture of your selected document</p>
      </div> */}

      <div
        className={`relative h-[400px] rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-teal-400 bg-[rgba(1,56,83,0.1)]"
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
              className="h-full w-full object-contain p-4"
            />
            <button
              onClick={removeImage}
              className="absolute right-2 top-2 rounded-full bg-gray-900 p-1 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <Upload className="mb-4 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-gray-400">Drag and drop your document here</p>
            <p className="mb-4 text-sm text-gray-500">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              className="border-gray-700 py-2 bg-[#013853] text-gray-300 hover:bg-[#044A6C] hover:text-white"
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
          </div>
        )}
      </div>

      <div className="flex justify-between absolute bottom-0 w-[90%] ">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
