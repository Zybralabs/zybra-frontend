"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUserAccount } from "@/context/UserAccountContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onSuccess, onCancel }) => {
  const { verifyCode, sendVerificationEmail, alertModalOpenHandler } = useUserAccount();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize the refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    
    const timer = setTimeout(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Only take the first character
    setOtp(newOtp);
    
    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press for backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste functionality
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Check if pasted content is a valid OTP (numbers only)
    if (!/^\d+$/.test(pastedData)) return;
    
    const pastedOtp = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    
    pastedOtp.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Handle OTP verification
  const handleVerify = async () => {
    setError(null);
    
    // Check if OTP is complete
    if (otp.some(digit => !digit)) {
      setError("Please enter the complete verification code");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Convert OTP array to number
      const otpNumber = parseInt(otp.join(""), 10);
      
      // Call the verify function from context
      await verifyCode(email, otpNumber);
      
      // Show success message
      alertModalOpenHandler({
        isSuccess: true,
        title: "Success",
        message: "Email verified successfully!",
      });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify code";
      setError(errorMessage);
      
      alertModalOpenHandler({
        isError: true,
        title: "Verification Failed",
        message: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      await sendVerificationEmail(email);
      
      // Reset timer
      setResendTimer(60);
      
      alertModalOpenHandler({
        isSuccess: true,
        title: "Code Resent",
        message: "A new verification code has been sent to your email",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend code";
      setError(errorMessage);
      
      alertModalOpenHandler({
        isError: true,
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div 
        className="bg-[#001824]/70 border border-[#1F4863] rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
        <p className="text-gray-400 text-sm mb-6">
          We&apos;ve sent a verification code to <span className="text-blue-400">{email}</span>
        </p>
        
        {/* OTP Input Fields */}
        <div className="flex justify-between mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-12 text-center text-white bg-[#002130] border border-[#1F4863] rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xl font-medium"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.some(digit => !digit)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-medium disabled:opacity-50 transition-all duration-200 hover:from-[#3B82F6] hover:to-[#60A5FA]"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </button>
          
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || isResending}
              className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors text-sm"
            >
              {isResending ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Resending...
                </span>
              ) : resendTimer > 0 ? (
                `Resend code in ${resendTimer}s`
              ) : (
                "Resend code"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
