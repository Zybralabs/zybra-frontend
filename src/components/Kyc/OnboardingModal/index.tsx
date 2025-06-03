"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Swap-new/components/input";
import { Label } from "@/components/Swap-new/components/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressStatusEnum, ProgressSteps } from "./ProgressSteps";
import { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import type { FormData, Step } from "@/context/OnboardingContext";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: "Link wallet" },
  { id: 2, title: "Selector investor type" },
  { id: 3, title: "Identity verification" },
  { id: 4, title: "Status" },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("investor-type");
  const [formData, setFormData] = useState<FormData>({});

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  };

  const getProgressSteps = () => {
    return STEPS.map((step) => ({
      ...step,
      status:
        currentStep === "complete" && step.id === 4
          ? ProgressStatusEnum.COMPLETED
          : step.id === 3 && currentStep === "verification"
            ? ProgressStatusEnum.COMPLETED
            : step.id === 2 && currentStep === "investor-type"
              ? ProgressStatusEnum.CURRENT
              : step.id < 2
                ? ProgressStatusEnum.COMPLETED
                : ProgressStatusEnum.UPCOMING,
      onClick: () => {
        if (step.id === 2) setCurrentStep("investor-type");
        else if (step.id === 3) setCurrentStep("verification");
        else if (step.id === 4) setCurrentStep("complete");
      },
    }));
  };

  const handleNext = () => {
    switch (currentStep) {
      case "investor-type":
        setCurrentStep("verification");
        break;
      case "verification":
        setCurrentStep("document");
        break;
      case "document":
        setCurrentStep("address");
        break;
      case "address":
        setCurrentStep("complete");
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "verification":
        setCurrentStep("investor-type");
        break;
      case "document":
        setCurrentStep("verification");
        break;
      case "address":
        setCurrentStep("document");
        break;
      case "complete":
        setCurrentStep("address");
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "investor-type":
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Start onboarding to Centrifuge
              </DialogTitle>
              <p className="text-[15px] text-gray-600">
                If you are a U.S. investor, it is only possible to onboard when you are an
                accredited investor.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-[120px] w-full flex-col items-center justify-center border-2 text-left"
                onClick={() => updateFormData({ investorType: "individual" })}
              >
                <span className="text-lg font-semibold">Individual</span>
              </Button>
              <Button
                variant="outline"
                className="h-[120px] w-full flex-col items-center justify-center border-2 text-left"
                onClick={() => updateFormData({ investorType: "entity" })}
              >
                <span className="text-lg font-semibold">Entity</span>
              </Button>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Signer verification
              </DialogTitle>
              <p className="text-[15px] text-gray-600">
                Please add your information to complete verification.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName || ""}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.emailAddress || ""}
                  onChange={(e) => updateFormData({ emailAddress: e.target.value })}
                />
                <p className="text-sm text-blue-600">Please enter a valid email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Country of Citizenship</Label>
                <Select onValueChange={(value) => updateFormData({ countryOfCitizenship: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ch">Switzerland</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Country of Residence</Label>
                <Select onValueChange={(value) => updateFormData({ countryOfResidence: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ch">Switzerland</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that all the information provided is true and accurate.
                </label>
              </div>
            </div>
          </div>
        );

      case "document":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Choose your document issuing country
              </DialogTitle>
            </div>

            <Select onValueChange={(value) => updateFormData({ documentCountry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ch">Switzerland</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="us">United States</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select document type for verification</h3>
              <p className="text-sm text-gray-600">Valid government issued document</p>

              <div className="grid grid-cols-3 gap-4">
                {["national-id", "passport", "drivers-license"].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-32 flex-col space-y-2"
                    onClick={() =>
                      updateFormData({ documentType: type as FormData["documentType"] })
                    }
                  >
                    <span className="text-sm font-semibold capitalize">
                      {type.split("-").join(" ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {type === "national-id" && "Front and back side"}
                      {type === "passport" && "Photo Page"}
                      {type === "drivers-license" && "Front and back side"}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Confirm document information
              </DialogTitle>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => updateFormData({ address: e.target.value })}
              />
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Thanks for verifying your identity
              </DialogTitle>
              <p className="text-[15px] text-gray-600">
                Your profile will be updated in 24hours.
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={onClose}>View Pools</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          {currentStep !== "investor-type" && (
            <Button variant="ghost" onClick={handleBack} className="absolute left-4 top-4">
              Back
            </Button>
          )}
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-[100px_1fr] gap-6">
          <ProgressSteps steps={getProgressSteps()} />

          <div className="space-y-8">
            {renderStep()}

            {currentStep !== "complete" && (
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                  onClick={handleBack}
                  disabled={currentStep === "investor-type"}
                >
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
