"use client";

import { useUserAccount } from '@/context/UserAccountContext';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for tracking feature usage for quests
 * This hook automatically tracks feature usage and updates quest progress
 */
export function useQuestTracker() {
  const { 
    trackFeatureUsage, 
    trackWalletConnection, 
    trackProfileCompletion,
    verifySocialShare,
    trackAMAParticipation,
    trackReferral,
    address,
    user
  } = useUserAccount();
  
  // Use refs to prevent duplicate tracking
  const trackedFeaturesRef = useRef<Set<string>>(new Set());
  const walletTrackedRef = useRef(false);
  const profileTrackedRef = useRef(false);
  
  /**
   * Track a feature usage for quests
   * @param featureName Name of the feature being used
   * @param metadata Additional metadata about the feature usage
   */
  const trackFeature = useCallback(async (featureName: string, metadata: Record<string, any> = {}) => {
    // Skip if already tracked in this session
    const featureKey = `${featureName}-${JSON.stringify(metadata)}`;
    if (trackedFeaturesRef.current.has(featureKey)) {
      return;
    }
    
    try {
      await trackFeatureUsage(featureName);
      trackedFeaturesRef.current.add(featureKey);
    } catch (error) {
      console.error(`Error tracking feature usage for ${featureName}:`, error);
    }
  }, [trackFeatureUsage]);
  
  /**
   * Track a social share for quests
   * @param platform Platform where content was shared (twitter, discord, etc.)
   * @param contentType Type of content shared (achievement, transaction, etc.)
   * @param metadata Additional metadata about the share
   */
  const trackSocialShare = useCallback(async (
    platform: string, 
    contentType: string, 
    metadata: Record<string, any> = {}
  ) => {
    try {
      await verifySocialShare(platform, contentType, JSON.stringify(metadata));
    } catch (error) {
      console.error(`Error tracking social share on ${platform}:`, error);
    }
  }, [verifySocialShare]);
  
  /**
   * Track AMA participation for quests
   * @param amaId ID of the AMA event
   * @param metadata Additional metadata about the participation
   */
  const trackAMA = useCallback(async (amaId: string, _metadata: Record<string, any> = {}) => {
    try {
      await trackAMAParticipation(amaId);
    } catch (error) {
      console.error(`Error tracking AMA participation for ${amaId}:`, error);
    }
  }, [trackAMAParticipation]);
  
  /**
   * Track referral for quests
   * @param referralCode Referral code used
   * @param metadata Additional metadata about the referral
   */
  const trackReferralUse = useCallback(async (referralCode: string, metadata: Record<string, any> = {}) => {
    try {
      await trackReferral(referralCode, JSON.stringify(metadata));
    } catch (error) {
      console.error(`Error tracking referral for ${referralCode}:`, error);
    }
  }, [trackReferral]);
  
  // Automatically track wallet connection when address changes
  useEffect(() => {
    const trackWallet = async () => {
      if (address && !walletTrackedRef.current) {
        try {
          await trackWalletConnection(address);
          walletTrackedRef.current = true;
        } catch (error) {
          console.error('Error tracking wallet connection:', error);
        }
      }
    };
    
    trackWallet();
  }, [address, trackWalletConnection]);
  
  // Automatically track profile completion when user profile changes
  useEffect(() => {
    const trackProfile = async () => {
      if (user?.profile_status === 'complete' && !profileTrackedRef.current) {
        try {
          await trackProfileCompletion(!!address, user);
          profileTrackedRef.current = true;
        } catch (error) {
          console.error('Error tracking profile completion:', error);
        }
      }
    };
    
    trackProfile();
  }, [user, trackProfileCompletion]);
  
  return {
    trackFeature,
    trackSocialShare,
    trackAMA,
    trackReferralUse
  };
}
