import { useCallback, useRef } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';

/**
 * Hook for automatically completing referrals when users perform qualifying actions
 * This ensures referrers get their rewards when referred users complete their first activity
 */
export function useReferralCompletion() {
  const { completeReferral, user } = useUserAccount();
  const completionAttemptedRef = useRef(false);

  /**
   * Attempt to complete a referral for the current user
   * This should be called after any qualifying action (transaction, staking, etc.)
   */
  const attemptReferralCompletion = useCallback(async (actionType: string = 'unknown') => {
    // Only attempt once per session to avoid spam
    if (completionAttemptedRef.current) {
      return;
    }

    // Only attempt if user is authenticated
    if (!user?._id) {
      return;
    }

    try {
      completionAttemptedRef.current = true;
      const result = await completeReferral();
      
      if (result?.payload) {
        console.log(`Referral completed successfully for action: ${actionType}`, {
          pointsAwarded: result.payload.points_awarded,
          referrerRewarded: result.payload.referrer_rewarded
        });
        
        // You could show a success notification here if needed
        return {
          success: true,
          pointsAwarded: result.payload.points_awarded,
          referrerRewarded: result.payload.referrer_rewarded
        };
      }
    } catch (error) {
      // Reset the flag if there was an actual error (not just "no referral to complete")
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (!errorMessage.includes('No referral to complete') && 
          !errorMessage.includes('No pending referral')) {
        completionAttemptedRef.current = false;
        console.error(`Error completing referral for action ${actionType}:`, error);
      } else {
        console.log(`No pending referral to complete for action: ${actionType}`);
      }
    }

    return { success: false };
  }, [completeReferral, user]);

  /**
   * Reset the completion attempt flag (useful for testing or manual reset)
   */
  const resetCompletionFlag = useCallback(() => {
    completionAttemptedRef.current = false;
  }, []);

  return {
    attemptReferralCompletion,
    resetCompletionFlag,
    hasAttemptedCompletion: completionAttemptedRef.current
  };
}
