'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useUserAccount } from '@/context/UserAccountContext';
import { useQuestTracking } from './QuestTrackerProvider';

// Map of paths to step IDs and feature names for tracking
const PATH_TO_STEP_MAP: Record<string, { stepId: string, featureName: string, category?: string }> = {
  '/lending': { stepId: 'lending', featureName: 'visit_lending_page', category: 'product_use' },
  '/userDashboard': { stepId: 'dashboard', featureName: 'visit_dashboard_page', category: 'exploration' },
  '/swap': { stepId: 'deposit', featureName: 'visit_swap_page', category: 'product_use' },
  '/offers': { stepId: 'offers', featureName: 'visit_offers_page', category: 'product_use' },
  '/stake': { stepId: 'stake', featureName: 'visit_stake_page', category: 'product_use' },
  '/mint': { stepId: 'mint', featureName: 'visit_mint_page', category: 'exploration' },
  '/kyc': { stepId: 'kyc', featureName: 'visit_kyc_page', category: 'exploration' },
  '/points': { stepId: 'points', featureName: 'visit_points_page', category: 'exploration' },
  '/tvl-dashboard': { stepId: 'tvl', featureName: 'visit_tvl_page', category: 'exploration' }
};

/**
 * Component that tracks page visits and marks exploration steps as completed
 * This component should be added to the app layout to track all page visits
 */
export const PageTracker = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { token } = useUserAccount();
  const { trackFeature } = useQuestTracking();

  useEffect(() => {
    // Only track if user is connected and has an address or has a token
    if ((!isConnected && !token) || !pathname) return;

    // Find if current path matches any step
    const matchingPath = Object.keys(PATH_TO_STEP_MAP).find(path =>
      pathname.startsWith(path)
    );

    if (matchingPath) {
      const { featureName, category, stepId } = PATH_TO_STEP_MAP[matchingPath];

      // Track the feature usage with additional metadata
      trackFeature(featureName, {
        path: pathname,
        category: category || 'exploration',
        timestamp: new Date().toISOString()
      }).catch(console.error);

      // Only save progress if the user is logged in
      if (typeof window !== 'undefined') {
        try {
          // Get the auth token
          const authToken = localStorage.getItem('authToken');

          // Only save progress if user is authenticated
          if (authToken) {
            // Use token-specific storage key
            const storageKey = `zybra-completed-steps-${authToken.substring(0, 10)}`;

            const savedSteps = localStorage.getItem(storageKey);
            const existingSteps = savedSteps ? new Set(JSON.parse(savedSteps)) : new Set();
            existingSteps.add(stepId);
            localStorage.setItem(storageKey, JSON.stringify(Array.from(existingSteps)));
          }
          // If not authenticated, don't save any progress
        } catch (error) {
          console.error('Error saving step completion to localStorage:', error);
        }
      }
    }
  }, [pathname, isConnected, address, token, trackFeature]);

  // This component doesn't render anything
  return null;
};

export default PageTracker;
