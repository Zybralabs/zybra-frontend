import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserAccount } from '@/context/UserAccountContext';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function useReferralCode() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  
  // Get the functions directly from UserAccountContext
  const { 
    validateReferralCode, 
    applyReferralCode, 
    user, 
    alertModalOpenHandler 
  } = useUserAccount();

  // Capture referral code from URL
  useEffect(() => {
    const refCode = searchParams?.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      // Store in localStorage for persistence across pages
      localStorage.setItem('referralCode', refCode);
    } else {
      // Check localStorage if no code in URL
      const storedCode = localStorage.getItem('referralCode');
      if (storedCode && !referralCode) {
        setReferralCode(storedCode);
      }
    }
  }, [searchParams, referralCode]);

  // Validate referral code
  useEffect(() => {
    const validateCode = async () => {
      if (referralCode && !isApplied && !isProcessing) {
        setIsProcessing(true);
        try {
          const response = await validateReferralCode(referralCode);
          
          // Match the backend response structure from validateReferralCode controller
          if (response?.success && response?.payload?.valid) {
            setReferrerName(response.payload.referrer_name);
          }
        } catch (error) {
          console.error("Invalid referral code:", error);
          localStorage.removeItem('referralCode');
          setReferralCode(null);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    validateCode();
  }, [referralCode, isApplied, isProcessing, validateReferralCode]);

  // Apply referral code when user is authenticated
  useEffect(() => {
    const applyCode = async () => {
      if (referralCode && user?._id && !isApplied && !isProcessing) {
        setIsProcessing(true);
        try {
          const response = await applyReferralCode(referralCode);
          if (response?.success) {
            setIsApplied(true);
            alertModalOpenHandler({
              isSuccess: true,
              title: "Referral Applied",
              message: `You've been referred by ${referrerName || 'another user'}. Complete your first activity to earn bonus points!`
            });
          }
        } catch (error) {
          console.error("Failed to apply referral code:", error);
          alertModalOpenHandler({
            isError: true,
            title: "Referral Error",
            message: error instanceof Error ? error.message : "Failed to apply referral code"
          });
        } finally {
          setIsProcessing(false);
        }
      }
    };

    applyCode();
  }, [referralCode, user, isApplied, isProcessing, applyReferralCode, alertModalOpenHandler, referrerName]);

  return {
    referralCode,
    referrerName,
    isApplied,
    isProcessing
  };
}
