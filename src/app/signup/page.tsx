"use client";
import Button from "@/components/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import {
  type UseAuthenticateResult,
  useAuthenticate,
  useConnect,
  useAccount,
  useUser,
  AuthCard,
} from "@account-kit/react";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { useUserAccount } from "@/context/UserAccountContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/SelectButton";
import { useReferralCode } from "@/hooks/useReferral";
import { Zap } from "lucide-react";
import EmailAuthFlow from "@/components/Auth/EmailAuthFlow";
import { ZybraLogo } from "@/components/Icons";

const SignupPage = () => {
  const router = useRouter();
  const { address, user, loading, signIn } = useUserAccount();
  const { referralCode, referrerName, isApplied } = useReferralCode();
  const [activeTab, setActiveTab] = useState("sign-in");

  // Use a ref to track if we've already redirected
  const hasRedirected = useRef(false);

  // Fix the infinite re-render by using the ref to prevent multiple redirects
  // useEffect(() => {
  //   // Only redirect if we have both user and address, and haven't redirected yet
  //   if (user && address && !hasRedirected.current) {
  //     hasRedirected.current = true; // Mark as redirected

  //     // Use a timeout to break the potential render cycle
  //     // This helps prevent the "Maximum update depth exceeded" error
  //     setTimeout(() => {
  //       router.push("/userDashboard");
  //     }, 0);
  //   }
  // }, [user, address, router]);

  const handleGoogleSignIn = async () => {
    try {
      // The success message is now handled in the UserAccountContext
      await signIn("oauth", { authProviderId: "google" });
    } catch (err) {
      // Error handling is now done in the UserAccountContext
      console.error("Error during Google sign-in:", err);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // The success message is now handled in the UserAccountContext
      await signIn("oauth", { authProviderId: "apple" });
    } catch (err) {
      // Error handling is now done in the UserAccountContext
      console.error("Error during Apple sign-in:", err);
    }
  };

  // Removed unused TickerItem component

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#001019] to-[#00253D] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden w-full">
        {/* Price ticker */}


        {/* Abstract background elements */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-indigo-500/10 blur-[80px]"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-[120px] transform -translate-x-1/2 -translate-y-1/2"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Particles/dots effect */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                opacity: Math.random() * 0.5 + 0.2,
                animation: `pulse ${Math.random() * 4 + 2}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center z-10 w-full max-w-lg px-4">
        {/* Logo */}
        <div className="mb-8 flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full">
            <svg
              width="auto"
              height="auto"
              viewBox="0 0 76 67"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.3565 1.46275C24.2084 2.26649 26.3142 4.45264 28.0342 6.3173C31.9885 10.6574 34.8981 13.4223 39.1096 16.8462C46.8415 23.1475 56.7596 27.15 70.2623 29.4005C71.8054 29.6577 73.5736 29.9309 74.2006 29.9792L75.3579 30.0917L75.4544 30.8311C75.583 31.7795 75.583 36.9556 75.4383 37.6146L75.3419 38.1451L73.5576 38.0326C54.6699 36.8913 43.6427 33.6603 34.5766 26.6357C30.0596 23.1314 27.134 20.2862 22.9707 15.3191C20.1576 11.9595 16.2515 7.87654 14.2421 6.17263L13.2937 5.36889L14.5636 4.34011C16.7016 2.62013 20.897 0.016037 21.54 -3.8147e-05C21.6686 -3.8147e-05 22.4884 0.659019 23.3565 1.46275ZM7.26574 14.7083C10.561 15.8335 14.7887 18.1965 17.0391 20.1736C17.3445 20.4308 19.2896 22.3598 21.3793 24.4495C23.4529 26.5231 25.9445 28.8539 26.8929 29.6095C33.387 34.7533 39.9616 37.8075 47.3398 39.0613C50.2493 39.5597 53.7697 39.7043 64.9094 39.8169L75.2293 39.9133L75.1329 40.492C74.9239 41.6654 74.6185 43.0961 74.5703 43.1443C74.5381 43.1604 73.4611 43.7391 72.1752 44.3981C67.3528 46.9058 62.5304 49.96 57.6276 53.625C52.2747 57.6436 48.5776 60.1834 45.6198 61.9356C40.3474 65.0219 34.7373 66.6937 31.1205 66.2275C26.0891 65.5845 20.8649 62.7875 14.0653 57.081C11.4612 54.8949 9.62871 53.1749 5.03136 48.6418L1.62354 45.2822L1.18952 43.4497C0.948402 42.4531 0.803728 41.5851 0.868027 41.5208C1.02877 41.36 2.52372 42.1155 4.16333 43.2247C6.20481 44.591 10.2878 47.7738 15.6728 52.2265C23.2118 58.4634 26.4428 60.0388 31.5063 60.0227C35.7179 60.0227 39.8008 58.7528 46.2146 55.4736C49.3652 53.8661 55.6665 50.3136 55.57 50.2171C55.5379 50.185 54.7502 50.5065 53.834 50.9405C49.4295 53.0141 44.5589 54.6698 40.7492 55.3932C38.6756 55.779 35.5732 55.7468 33.4996 55.3128C28.6289 54.3001 24.5138 52.13 17.5214 46.8897C15.3513 45.2662 15.3834 45.2983 11.6541 41.6494C7.60331 37.6789 4.75809 35.6374 1.3342 34.2229L0.0160738 33.6763L0 32.31C0 31.5545 0.0482235 30.5579 0.0964474 30.1078C0.225045 29.1272 0.0160742 29.1433 2.49157 29.8988C4.5652 30.5418 6.57453 31.3777 8.08555 32.2457C9.35544 32.9691 11.622 34.5444 12.2971 35.1552C12.4739 35.316 13.2777 36.0232 14.0653 36.7305C14.869 37.4378 15.8817 38.3541 16.3158 38.7559C20.7684 42.9032 26.8447 46.7932 31.1044 48.2078C37.1164 50.2011 43.0479 50.1046 53.3517 47.806C59.8138 46.3753 69.764 43.7391 70.1658 43.3694C70.2623 43.2729 70.1819 43.2568 69.9247 43.3051C69.0084 43.5301 63.3823 44.3821 60.8908 44.6875C56.3416 45.2501 52.6605 45.4912 48.5454 45.4912C41.2636 45.4912 37.3092 44.6714 31.7474 41.9709C26.7 39.5275 24.6264 37.8397 16.155 29.3201C11.6702 24.8192 10.7861 24.0155 9.27507 23.0028C7.52293 21.8454 5.41715 20.7684 3.60072 20.1093L2.60409 19.7396L3.08633 18.6787C3.52034 17.7142 5.46538 14.1456 5.56182 14.1456C5.5779 14.1456 6.34948 14.4028 7.26574 14.7083Z"
                fill="#D9D9D9"
                className="text-gray-300 hover:text-white transition-colors"
              ></path>
            </svg>
          </div>
          <span className="text-white text-3xl font-bold tracking-tight">Zybra</span>
        </div>

        {/* Card */}
        <div className="w-full bg-gradient-to-b from-[#001C29]/90 to-[#002740]/90 backdrop-blur-md rounded-3xl shadow-xl shadow-black/20 border border-[#0A3655]/50 overflow-hidden">
          {/* Glowing top border */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0"></div>

          <div className="p-8">
            <Tabs defaultValue="sign-in" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="relative flex w-full max-w-[240px] h-12 bg-[#001019]/40 rounded-full p-1 backdrop-blur-lg mb-8 mx-auto overflow-hidden gap-4">
                <div className="absolute inset-0 border border-[#0A3655]/70 rounded-full"></div>

                {/* The slider with adjusted positioning for the gap */}
                <motion.div
                  className="absolute bg-gradient-to-r from-blue-600/80 to-cyan-500/80 rounded-full h-full"
                  style={{
                    width: "calc(50% - 8px)",
                    left: activeTab === "sign-in" ? "0%" : "calc(50% + 8px)"
                  }}
                  animate={{
                    left: activeTab === "sign-in" ? "0%" : "calc(50% + 8px)"
                  }}
                  initial={false}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                ></motion.div>

                <TabsTrigger
                  value="sign-in"
                  className={`relative z-10 flex-1 text-center font-medium ${activeTab === "sign-in" ? "text-white" : "text-gray-400"
                    } data-[state=active]:bg-transparent`}
                  onClick={() => setActiveTab("sign-in")}
                >
                  Login
                </TabsTrigger>

                <TabsTrigger
                  value="sign-up"
                  className={`relative z-10 flex-1 text-center font-medium ${activeTab === "sign-up" ? "text-white" : "text-gray-400"
                    } data-[state=active]:bg-transparent`}
                  onClick={() => setActiveTab("sign-up")}
                >
                  Signup
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="sign-in" className="mt-0">
                    <div className="text-white space-y-6">
                      <h2 className="text-2xl font-semibold text-center mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        Welcome Back
                      </h2>

                      <EmailAuthFlow
                        onSuccess={() => {
                          // The user will be redirected automatically when authentication is complete
                          // via the useEffect hook that checks for user and address
                        }}
                      />

                      <div className="flex items-center gap-4 my-6">
                        <hr className="flex-grow border-[#1F4863]" />
                        <p className="text-gray-400 text-sm font-medium">or continue with</p>
                        <hr className="flex-grow border-[#1F4863]" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 48 48"
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.7 0 6.7 1.2 9.1 3.5l6.8-6.8C35.7 2.4 30.2 0 24 0 14.4 0 6.4 5.8 2.8 14.1l7.9 6.1C12.6 13.5 17.8 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.2 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.8c-.6 3-2.4 5.5-5.1 7.2l7.8 6c4.5-4.2 7.1-10.5 7.1-17.7z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.7 28.8c-.6-1.8-.9-3.7-.9-5.8s.3-4 1-5.8l-7.9-6.1C1 15 0 19.3 0 24s1 9 2.8 12.9l7.9-6.1z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.5 0 11.9-2.1 15.8-5.7l-7.8-6c-2.2 1.5-5 2.3-8 2.3-6.2 0-11.4-4-13.2-9.5l-7.9 6.1C6.3 42.3 14.4 48 24 48z"
                            />
                          </svg>
                          <span className="text-white/90 text-sm font-medium">Google</span>
                        </button>

                        <button
                          onClick={handleAppleSignIn}
                          disabled={loading}
                          className="bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M16.365 1.43C15.16 2.514 14.158 4.21 14.634 5.844c1.518.119 3.206-.875 4.206-2.005.938-1.047 1.638-2.64 1.383-3.84-1.452.06-3.046.855-3.858 1.43zM12.013 7.77c-1.945 0-2.944-1.008-4.363-1.008-1.453 0-3.08 1.194-4.084 3.247-1.742 3.52-.448 8.733 1.276 11.599.838 1.339 1.829 2.85 3.133 2.85 1.225 0 1.745-.803 3.287-.803 1.534 0 1.93.803 3.134.803 1.304 0 2.211-1.366 3.047-2.706.934-1.439 1.311-2.839 1.336-2.91-.03-.015-2.618-1.006-2.645-4.007-.03-2.594 2.015-3.751 2.112-3.82-1.31-1.93-3.308-2.144-3.91-2.175-1.751-.15-3.305.965-4.15.965z"
                            />
                          </svg>
                          <span className="text-white/90 text-sm font-medium">Apple</span>
                        </button>

                        <ConnectButton.Custom>
  {({
    account,
    chain,
    openChainModal,
    openConnectModal,
    authenticationStatus,
    mounted,
  }) => {
    const ready = mounted && authenticationStatus !== "loading";
    const connected =
      ready &&
      account &&
      chain &&
      (!authenticationStatus || authenticationStatus === "authenticated");

    return (
      <div
        {...(!ready && {
          "aria-hidden": true,
          style: {
            opacity: 0,
            pointerEvents: "none",
            userSelect: "none",
          },
        })}
        className="w-full" // Add full width to match other buttons
      >
        {connected && chain.unsupported ? (
          <button
            onClick={openChainModal}
            className="w-full bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="text-red-400 text-sm font-medium">Wrong Network</span>
          </button>
        ) : (
          <button
            onClick={openConnectModal}
            disabled={loading}
            className="w-full bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M14 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <span className="text-white/90 text-sm font-medium">Wallet</span>
          </button>
        )}
      </div>
    );
  }}
</ConnectButton.Custom>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sign-up" className="mt-0">
                    <div className="text-white space-y-6">
                      <h2 className="text-2xl font-semibold text-center mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        Create Account
                      </h2>

                      <EmailAuthFlow
                        onSuccess={() => {
                          // alertModalOpenHandler({
                          //   isSuccess: true,
                          //   title: "OTP Sent",
                          //   message: "A verification code has been sent to your email",
                          // });
                        }}
                      />

                      <div className="flex items-center gap-4 my-6">
                        <hr className="flex-grow border-[#1F4863]" />
                        <p className="text-gray-400 text-sm font-medium">or continue with</p>
                        <hr className="flex-grow border-[#1F4863]" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 48 48"
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.7 0 6.7 1.2 9.1 3.5l6.8-6.8C35.7 2.4 30.2 0 24 0 14.4 0 6.4 5.8 2.8 14.1l7.9 6.1C12.6 13.5 17.8 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.2 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.8c-.6 3-2.4 5.5-5.1 7.2l7.8 6c4.5-4.2 7.1-10.5 7.1-17.7z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.7 28.8c-.6-1.8-.9-3.7-.9-5.8s.3-4 1-5.8l-7.9-6.1C1 15 0 19.3 0 24s1 9 2.8 12.9l7.9-6.1z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.5 0 11.9-2.1 15.8-5.7l-7.8-6c-2.2 1.5-5 2.3-8 2.3-6.2 0-11.4-4-13.2-9.5l-7.9 6.1C6.3 42.3 14.4 48 24 48z"
                            />
                          </svg>
                          <span className="text-white/90 text-sm font-medium">Google</span>
                        </button>

                        <button
                          onClick={handleAppleSignIn}
                          disabled={loading}
                          className="bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M16.365 1.43C15.16 2.514 14.158 4.21 14.634 5.844c1.518.119 3.206-.875 4.206-2.005.938-1.047 1.638-2.64 1.383-3.84-1.452.06-3.046.855-3.858 1.43zM12.013 7.77c-1.945 0-2.944-1.008-4.363-1.008-1.453 0-3.08 1.194-4.084 3.247-1.742 3.52-.448 8.733 1.276 11.599.838 1.339 1.829 2.85 3.133 2.85 1.225 0 1.745-.803 3.287-.803 1.534 0 1.93.803 3.134.803 1.304 0 2.211-1.366 3.047-2.706.934-1.439 1.311-2.839 1.336-2.91-.03-.015-2.618-1.006-2.645-4.007-.03-2.594 2.015-3.751 2.112-3.82-1.31-1.93-3.308-2.144-3.91-2.175-1.751-.15-3.305.965-4.15.965z"
                            />
                          </svg>
                          <span className="text-white/90 text-sm font-medium">Apple</span>
                        </button>


                        <ConnectButton.Custom>
  {({
    account,
    chain,
    openChainModal,
    openConnectModal,
    authenticationStatus,
    mounted,
  }) => {
    const ready = mounted && authenticationStatus !== "loading";
    const connected =
      ready &&
      account &&
      chain &&
      (!authenticationStatus || authenticationStatus === "authenticated");

    return (
      <div
        {...(!ready && {
          "aria-hidden": true,
          style: {
            opacity: 0,
            pointerEvents: "none",
            userSelect: "none",
          },
        })}
        className="w-full" // Add full width to match other buttons
      >
        {connected && chain.unsupported ? (
          <button
            onClick={openChainModal}
            className="w-full bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="text-red-400 text-sm font-medium">Wrong Network</span>
          </button>
        ) : (
          <button
            onClick={openConnectModal}
            disabled={loading}
            className="w-full bg-[#001824]/70 hover:bg-[#002A40]/90 border border-[#1F4863] rounded-lg py-3 px-4 flex justify-center items-center gap-3 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M14 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <span className="text-white/90 text-sm font-medium">Wallet</span>
          </button>
        )}
      </div>
    );
  }}
</ConnectButton.Custom>
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
            {referralCode && referrerName && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-start">
                <Zap className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <span className="text-blue-400 font-medium">
                    You&apos;ve been referred by {referrerName}!
                  </span>
                  {isApplied ?
                    " Complete your first activity to earn bonus points!" :
                    " Sign up to join and you'll both receive bonus points."}
                </div>
              </div>
            )}

            {/* Terms and Privacy links */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Zybra Finance. All rights reserved.
          </p>
        </div>
      </div>

      {/* Support button */}
      <div className="fixed bottom-8 right-8 z-20">
        <button className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full p-3 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 transition-all group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="absolute -top-10 right-0 bg-white text-gray-800 text-sm py-1 px-3 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Need help?
          </span>
        </button>
      </div>

      {/* Custom animation keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0.8;
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </main>
  );
};

export default SignupPage;