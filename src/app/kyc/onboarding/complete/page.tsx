"use client";

import { useRouter } from "next/navigation";
import { BackButton } from "@/components/Kyc/BackButton";
import { Card, CardHeader, CardContent, CardTitle, Button } from "@/components/Kyc/Card";
import { useUserAccount } from "@/context/UserAccountContext";
import { useEffect } from "react";

export default function Complete() {
  const router = useRouter();
  
  const {submitKYC} = useUserAccount();
  const handleViewPools = () => {
    router.push("/offers");
  };
useEffect(() => {
    submitKYC();
  }
  , []);
  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>
          <span className="text-green-700">✔</span>
          {" "} You are All Set!
        </CardTitle>
      </CardHeader>
      <h1 className="text-2xl font-bold">Thank you for verifying your identity.</h1>
      <p className=" text-gray-400">
        Your profile will be updated within 24 hours. <br /> In the meantime, feel free to explore
        our platform.{" "}
      </p>
      <Button
        variant={"default"}
        size="sm"
        onClick={handleViewPools}
        className="text-md !px-4 !py-2"
      >
        View Pools
      </Button>
      <div className="flex justify-between absolute bottom-0 w-[90%] ">
        <BackButton />
      </div>
    </div>
  );
}
