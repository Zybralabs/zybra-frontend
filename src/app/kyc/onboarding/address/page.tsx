"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/Kyc/BackButton";
import { NextButton } from "@/components/Kyc/NextButton";
import { Label } from "@/components/Swap-new/components/label";
import { Input } from "@/components/Swap-new/components/input";
import { Card, CardHeader, CardContent, CardTitle, Button } from "@/components/Kyc/Card";

export default function Address() {
  const { formData, updateFormData, setCurrentStep } = useOnboarding();
  const router = useRouter();

  const handleNext = () => {
    setCurrentStep("complete");
    router.push("/kyc/onboarding/complete");
  };

  return (
    <div className="space-y-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Confirm Address</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Full Address</Label>
          <Input
            id="address"
            className="w-full py-3 px-4 pl-10 rounded-lg bg-[#002130] text-gray-400 outline-none border border-[#203443] placeholder:text-gray-500"
            value={formData.address || ""}
            onChange={(e) => updateFormData({ address: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-between absolute bottom-0 w-[90%] ">
        <BackButton />
        <NextButton handleClick={handleNext} />
      </div>
    </div>
  );
}
