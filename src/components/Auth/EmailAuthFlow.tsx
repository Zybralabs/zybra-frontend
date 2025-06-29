"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUserAccount } from "@/context/UserAccountContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { useAuthenticate, useSignerStatus } from "@account-kit/react";
import { AlchemySignerStatus } from "@account-kit/signer";

// Storage key for persisting email during verification
const EMAIL_STORAGE_KEY = "zybra_auth_email";

interface EmailAuthFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EmailAuthFlow: React.FC<EmailAuthFlowProps> = ({ onSuccess, onCancel }) => {
  const router = useRouter();
  const { alertModalOpenHandler, user, address, walletSignIn } = useUserAccount();
  const { authenticate, isPending, authenticateAsync } = useAuthenticate();
  const { status } = useSignerStatus();

  // Initialize email from localStorage if available
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(EMAIL_STORAGE_KEY) || "";
    }
    return "";
  });

  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Determine which screen to show based on signer status or isPending state
  const isAwaitingOTP = useMemo(() => {
    // First check Alchemy's signer status
    const alchemyStatus = status === AlchemySignerStatus.AWAITING_EMAIL_AUTH;

    // If Alchemy says we're awaiting OTP, trust it
    if (alchemyStatus) return true;

    // Otherwise, check if we're in a pending state and have an email stored
    return isPending && !!email;
  }, [status, isPending, email]);

  // Initialize component based on authentication state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // If we're in the OTP verification state but don't have an email, try to get it from localStorage
      if (isAwaitingOTP && !email) {
        const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
        if (storedEmail) {
          setEmail(storedEmail);
        }
      }
    }

    // Cleanup function
    return () => {
      // No cleanup needed
    };
  }, [isAwaitingOTP, email]);

  // Check if user is authenticated and redirect to dashboard
  useEffect(() => {
    // If we have both user and address, redirect to dashboard
    if (user && address) {
      // Show success message
      alertModalOpenHandler({
        isSuccess: true,
        title: "Success",
        message: "Authentication successful! Redirecting to dashboard...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/userDashboard");
      }, 1500); // Give the user time to see the success message
    }
  }, [user, address, router, alertModalOpenHandler]);

  // Focus OTP input when it becomes visible
  useEffect(() => {
    if (isAwaitingOTP && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [isAwaitingOTP]);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendTimer <= 0 || !isAwaitingOTP) return;

    const timer = setTimeout(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer, isAwaitingOTP]);

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  // Handle OTP input change
  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    setOtpCode(value);
    if (error) setError(null);
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const errorMessage = "Please enter a valid email address";
      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: "Invalid Email",
        message: errorMessage,
      });
      return;
    }

    // Check for common email issues
    if (email.length > 254) {
      const errorMessage = "Email address is too long";
      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: "Invalid Email",
        message: errorMessage,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save email to localStorage to persist across page navigations
      if (typeof window !== 'undefined') {
        localStorage.setItem(EMAIL_STORAGE_KEY, email);
      }

      // Use Alchemy's authenticate function to send OTP
      console.log("Sending OTP to email:", email);

      // First, try to use authenticate directly (this is the recommended approach)
      try {
        authenticate(
          {
            type: "email",
            emailMode: "otp",
            email,
          },
          {
            onSuccess: (userData) => {
              // This will fire when the entire flow is complete (after OTP verification)
              console.log("Email authentication complete, user data:", userData);

              // If we have a wallet address from Alchemy, authenticate with the backend
              if (userData.address) {
                console.log("Email authentication successful, authenticating with backend using address:", userData.address);

                // Call walletSignIn to authenticate with the backend
                // Use "auth" type which maps to MINIMAL wallet type in walletSignIn
                console.log("Calling walletSignIn with address:", userData.address);
                walletSignIn("auth", userData.address)
                  .then(() => {
                    console.log("Backend authentication successful");

                    // Store email in localStorage for future reference
                    if (userData.email) {
                      localStorage.setItem("userEmail", userData.email);
                    }

                    // Success message and redirection will be handled by the useEffect
                    if (onSuccess) onSuccess();
                  })
                  .catch((err: Error) => {
                    console.error("Error authenticating with backend:", err);
                    alertModalOpenHandler({
                      isError: true,
                      title: "Authentication Error",
                      message: "Failed to authenticate with the server. Please try again."
                    });
                  });
              }
            },
            onError: (err) => {
              const errorMessage = err instanceof Error ? err.message : "Failed to send verification code";
              setError(errorMessage);

              alertModalOpenHandler({
                isError: true,
                title: "Error",
                message: errorMessage,
              });
            },
          }
        );
      } catch (error) {
        console.error("Error initiating email authentication:", error);

        // If direct authenticate fails, fall back to authenticateAsync
        authenticateAsync(
          {
            type: "email",
            emailMode: "otp",
            email,
          },
          {
            onSuccess: (userData) => {
              console.log("Email authentication initiated with authenticateAsync, user data:", userData);
              // The OTP verification will handle the backend authentication
            },
            onError: (err) => {
              let fallbackErrorTitle = "Authentication Failed";
              let fallbackErrorMessage = "Failed to send verification code";

              if (err instanceof Error) {
                if (err.message.includes("network") || err.message.includes("fetch")) {
                  fallbackErrorTitle = "Network Error";
                  fallbackErrorMessage = "Please check your internet connection and try again";
                } else if (err.message.includes("rate limit") || err.message.includes("too many")) {
                  fallbackErrorTitle = "Rate Limit Exceeded";
                  fallbackErrorMessage = "Too many attempts. Please wait a few minutes before trying again";
                } else if (err.message.includes("blocked") || err.message.includes("forbidden")) {
                  fallbackErrorTitle = "Email Blocked";
                  fallbackErrorMessage = "This email address cannot be used for authentication";
                } else {
                  fallbackErrorMessage = err.message;
                }
              }

              setError(fallbackErrorMessage);
              alertModalOpenHandler({
                isError: true,
                title: fallbackErrorTitle,
                message: fallbackErrorMessage,
              });
            },
          }
        );
      }

      // Start resend timer
      setResendTimer(60);
    } catch (err) {
      let errorTitle = "Authentication Error";
      let errorMessage = "Failed to send verification code";

      if (err instanceof Error) {
        if (err.message.includes("network") || err.message.includes("fetch")) {
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again";
        } else if (err.message.includes("rate limit") || err.message.includes("too many")) {
          errorTitle = "Rate Limit Exceeded";
          errorMessage = "Too many attempts. Please wait a few minutes before trying again";
        } else if (err.message.includes("service unavailable") || err.message.includes("503")) {
          errorTitle = "Service Unavailable";
          errorMessage = "Authentication service is temporarily unavailable. Please try again later";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if OTP is complete
    if (!otpCode || otpCode.length < 6) {
      const errorMessage = "Please enter the complete 6-digit verification code";
      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: "Incomplete Code",
        message: errorMessage,
      });
      return;
    }

    // Validate OTP format (should be numeric)
    if (!/^\d{6}$/.test(otpCode)) {
      const errorMessage = "Verification code must be 6 digits";
      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: "Invalid Code Format",
        message: errorMessage,
      });
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Use Alchemy's authenticate function to verify OTP
      console.log("Verifying OTP code for email:", email);

      authenticate(
        {
          type: "otp",
          otpCode,
        },
        {
          onSuccess: async (userData) => {
            // This will fire when the entire flow is complete
            console.log("OTP verification successful, user data:", userData);

            // Clear the stored email since verification is complete
            if (typeof window !== 'undefined') {
              localStorage.removeItem(EMAIL_STORAGE_KEY);
            }

            // If we have a wallet address from Alchemy, authenticate with the backend
            if (userData.address) {
              console.log("Email OTP verification successful, authenticating with backend using address:", userData.address);

              // Call walletSignIn to authenticate with the backend
              // Always use "auth" type which maps to "abstraction-wallet" in walletSignIn
              walletSignIn("auth", userData.address)
                .then(() => {
                  console.log("Backend authentication successful");

                  // Store email in localStorage for future reference
                  if (userData.email) {
                    localStorage.setItem("userEmail", userData.email);
                  }

                  // Show success message
                  alertModalOpenHandler({
                    isSuccess: true,
                    title: "Authentication Successful",
                    message: "Email verification successful! You are now logged in."
                  });

                  // The redirection will be handled by the useEffect that checks for user and address
                  if (onSuccess) onSuccess();
                })
                .catch((err: Error) => {
                  console.error("Error authenticating with backend:", err);
                  alertModalOpenHandler({
                    isError: true,
                    title: "Authentication Error",
                    message: "Failed to authenticate with the server. Please try again."
                  });
                });
            } else {
              console.error("No wallet address returned from Alchemy after OTP verification");
              alertModalOpenHandler({
                isError: true,
                title: "Authentication Error",
                message: "Failed to get wallet address from authentication provider. Please try again."
              });
            }
          },
          onError: (err) => {
            let errorTitle = "Verification Failed";
            let errorMessage = "Failed to verify code";

            if (err instanceof Error) {
              if (err.message.includes("invalid") || err.message.includes("incorrect")) {
                errorTitle = "Invalid Code";
                errorMessage = "The verification code you entered is incorrect. Please try again";
              } else if (err.message.includes("expired")) {
                errorTitle = "Code Expired";
                errorMessage = "The verification code has expired. Please request a new one";
              } else if (err.message.includes("rate limit") || err.message.includes("too many")) {
                errorTitle = "Too Many Attempts";
                errorMessage = "Too many failed attempts. Please wait before trying again";
              } else if (err.message.includes("network") || err.message.includes("fetch")) {
                errorTitle = "Network Error";
                errorMessage = "Please check your internet connection and try again";
              } else {
                errorMessage = err.message;
              }
            }

            setError(errorMessage);
            alertModalOpenHandler({
              isError: true,
              title: errorTitle,
              message: errorMessage,
            });
          },
        }
      );
    } catch (err) {
      let errorTitle = "Verification Error";
      let errorMessage = "Failed to verify code";

      if (err instanceof Error) {
        if (err.message.includes("invalid") || err.message.includes("incorrect")) {
          errorTitle = "Invalid Code";
          errorMessage = "The verification code you entered is incorrect. Please try again";
        } else if (err.message.includes("expired")) {
          errorTitle = "Code Expired";
          errorMessage = "The verification code has expired. Please request a new one";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again";
        } else if (err.message.includes("rate limit") || err.message.includes("too many")) {
          errorTitle = "Too Many Attempts";
          errorMessage = "Too many failed attempts. Please wait before trying again";
        } else if (err.message.includes("service unavailable") || err.message.includes("503")) {
          errorTitle = "Service Unavailable";
          errorMessage = "Verification service is temporarily unavailable. Please try again later";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setError(null);

    try {
      // Use Alchemy's authenticate function to resend OTP
      console.log("Resending OTP to email:", email);

      authenticate(
        {
          type: "email",
          emailMode: "otp",
          email,
        },
        {
          onSuccess: (userData) => {
            // This will fire when the entire flow is complete (after OTP verification)
            console.log("Email authentication complete after resend, user data:", userData);

            // If we have a wallet address from Alchemy, authenticate with the backend
            if (userData.address) {
              console.log("Email authentication successful after resend, authenticating with backend using address:", userData.address);

              // Call walletSignIn to authenticate with the backend
              // Use "auth" type which maps to MINIMAL wallet type in walletSignIn
              walletSignIn("auth", userData.address)
                .then(() => {
                  console.log("Backend authentication successful after resend");

                  // Store email in localStorage for future reference
                  if (userData.email) {
                    localStorage.setItem("userEmail", userData.email);
                  }

                  // Success message and redirection will be handled by the useEffect
                  if (onSuccess) onSuccess();
                })
                .catch((err: Error) => {
                  console.error("Error authenticating with backend after resend:", err);
                  alertModalOpenHandler({
                    isError: true,
                    title: "Authentication Error",
                    message: "Failed to authenticate with the server. Please try again."
                  });
                });
            }
          },
          onError: (err) => {
            let errorTitle = "Resend Failed";
            let errorMessage = "Failed to resend verification code";

            if (err instanceof Error) {
              if (err.message.includes("rate limit") || err.message.includes("too many")) {
                errorTitle = "Rate Limit Exceeded";
                errorMessage = "Too many requests. Please wait a few minutes before requesting another code";
              } else if (err.message.includes("network") || err.message.includes("fetch")) {
                errorTitle = "Network Error";
                errorMessage = "Please check your internet connection and try again";
              } else if (err.message.includes("service unavailable") || err.message.includes("503")) {
                errorTitle = "Service Unavailable";
                errorMessage = "Email service is temporarily unavailable. Please try again later";
              } else {
                errorMessage = err.message;
              }
            }

            setError(errorMessage);
            alertModalOpenHandler({
              isError: true,
              title: errorTitle,
              message: errorMessage,
            });
          },
        }
      );

      // Reset timer
      setResendTimer(60);

      alertModalOpenHandler({
        isSuccess: true,
        title: "Code Resent",
        message: "A new verification code has been sent to your email",
      });
    } catch (err) {
      let errorTitle = "Resend Error";
      let errorMessage = "Failed to resend verification code";

      if (err instanceof Error) {
        if (err.message.includes("rate limit") || err.message.includes("too many")) {
          errorTitle = "Rate Limit Exceeded";
          errorMessage = "Too many requests. Please wait a few minutes before requesting another code";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again";
        } else if (err.message.includes("service unavailable") || err.message.includes("503")) {
          errorTitle = "Service Unavailable";
          errorMessage = "Email service is temporarily unavailable. Please try again later";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      alertModalOpenHandler({
        isError: true,
        title: errorTitle,
        message: errorMessage,
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Clear stored email on cancel
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EMAIL_STORAGE_KEY);
    }

    if (onCancel) onCancel();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!isAwaitingOTP ? (
          <motion.div
            key="email-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-[#001824]/70 border border-[#1F4863] rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-semibold text-white mb-2">Sign in with Email</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your email to receive a one-time verification code
            </p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full py-3 px-4 pl-10 rounded-lg bg-[#002130] text-white outline-none border border-[#1F4863] placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base"
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                  <Mail className="h-5 w-5" />
                </span>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <div className="flex justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="flex items-right justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-medium disabled:opacity-50 transition-all duration-200 hover:from-[#3B82F6] hover:to-[#60A5FA]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-verification"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-[#001824]/70 border border-[#1F4863] rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mb-6">
              We&apos;ve sent a verification code to <span className="text-blue-400">{email}</span>
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="relative">
                <input
                  ref={otpInputRef}
                  type="text"
                  value={otpCode}
                  onChange={handleOTPChange}
                  className="w-full py-3 px-4 rounded-lg bg-[#002130] text-white outline-none border border-[#1F4863] placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-xl tracking-widest"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isVerifying || otpCode.length < 6}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-medium disabled:opacity-50 transition-all duration-200 hover:from-[#3B82F6] hover:to-[#60A5FA]"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify Code
                  </span>
                )}
              </button>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isSubmitting}
                  className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Sending...
                    </span>
                  ) : resendTimer > 0 ? (
                    `Resend code in ${resendTimer}s`
                  ) : (
                    "Resend code"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailAuthFlow;
