'use client';

import dynamic from 'next/dynamic';
import { QuestTrackerProvider } from './QuestTrackerProvider';

// Dynamically import PageTracker with no SSR to avoid hydration issues
const PageTracker = dynamic(() => import('@/components/PageTracker'), { ssr: false });

export default function ClientPageTracker() {
  return (
    <QuestTrackerProvider>
      <PageTracker />
    </QuestTrackerProvider>
  );
}
