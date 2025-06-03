"use client";

import React, { createContext, useContext, type ReactNode } from 'react';
import { useQuestTracker } from '@/hooks/useQuestTracker';

// Create context for quest tracking
interface QuestTrackerContextType {
  trackFeature: (featureName: string, metadata?: Record<string, any>) => Promise<void>;
  trackSocialShare: (platform: string, contentType: string, metadata?: Record<string, any>) => Promise<void>;
  trackAMA: (amaId: string, metadata?: Record<string, any>) => Promise<void>;
  trackReferralUse: (referralCode: string, metadata?: Record<string, any>) => Promise<void>;
}

const QuestTrackerContext = createContext<QuestTrackerContextType | null>(null);

// Hook to use quest tracker
export const useQuestTracking = () => {
  const context = useContext(QuestTrackerContext);
  if (!context) {
    throw new Error('useQuestTracking must be used within a QuestTrackerProvider');
  }
  return context;
};

// Provider component
export function QuestTrackerProvider({ children }: { children: ReactNode }) {
  const questTracker = useQuestTracker();
  
  return (
    <QuestTrackerContext.Provider value={questTracker}>
      {children}
    </QuestTrackerContext.Provider>
  );
}
