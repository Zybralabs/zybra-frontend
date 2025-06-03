"use client";

import React, { useState, useCallback } from 'react';
import { useTVLMetrics, useTVLBreakdown } from '@/hooks/useTVL';
import { TVLOverviewCard, TVLBreakdownChart, TVLTopAssetsCard } from '@/components/TVL';
import UserProfileHeader from "@/components/UserProfileHeader";
import { useUserAccount } from '@/context/UserAccountContext';
import { InfoIcon, RefreshCw, Bug } from 'lucide-react';

export default function TVLDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const {
    data: tvlMetrics,
    loading: metricsLoading,
    usedFallback: metricsUsedFallback,
    refetch: refetchMetrics,
    debugInfo: metricsDebugInfo
  } = useTVLMetrics();

  const {
    data: tvlBreakdown,
    loading: breakdownLoading,
    usedFallback: breakdownUsedFallback,
    refetch: refetchBreakdown,
    debugInfo: breakdownDebugInfo
  } = useTVLBreakdown(period);

  const { user, balanceLoading } = useUserAccount();

  // Dashboard User Header Component
  const DashboardUserHeader = () => {
    return <UserProfileHeader user={user} loading={balanceLoading} />;
  };

  // Determine if any fallback endpoints were used
  const usedFallback = metricsUsedFallback || breakdownUsedFallback;

  // Function to refresh all TVL data with debounce
  const refreshAllData = useCallback(() => {
    if (metricsLoading || breakdownLoading) {
      console.log('Already loading data, skipping refresh');
      return;
    }
    console.log('Refreshing all TVL data...');
    refetchMetrics();
    refetchBreakdown();
  }, [refetchMetrics, refetchBreakdown, metricsLoading, breakdownLoading]);

  return (
    <div className="flex flex-col container justify-center overflow-x-hidden mt-6">
      <div className="w-full">
        <DashboardUserHeader />

        <div className="mt-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">TVL Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Monitor the Total Value Locked across the Zybra Finance ecosystem
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refreshAllData()}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={metricsLoading || breakdownLoading}
              >
                <RefreshCw className={`h-4 w-4 ${(metricsLoading || breakdownLoading) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className={`flex items-center gap-1 px-3 py-1.5 ${showDebugInfo ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-lg transition-colors`}
              >
                <Bug className="h-4 w-4" />
                <span>Debug</span>
              </button>
            </div>
          </div>

          {/* Fallback notification */}
          {usedFallback && (
            <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded-lg flex items-start gap-3">
              <InfoIcon className="text-amber-500 h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                Some data is being displayed from simplified endpoints. The main API endpoints may be temporarily unavailable.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* TVL Overview Card */}
          <TVLOverviewCard
            data={tvlMetrics}
            loading={metricsLoading}
            usedFallback={metricsUsedFallback}
          />

          {/* TVL Breakdown Chart */}
          <TVLBreakdownChart
            data={tvlBreakdown}
            loading={breakdownLoading}
            onPeriodChange={setPeriod}
            currentPeriod={period}
            usedFallback={breakdownUsedFallback}
          />

          {/* Top Assets and Pools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TVLTopAssetsCard
              data={tvlBreakdown}
              loading={breakdownLoading}
              title="Top Assets by TVL"
              type="assets"
              usedFallback={breakdownUsedFallback}
            />
            <TVLTopAssetsCard
              data={tvlBreakdown}
              loading={breakdownLoading}
              title="Top Pools by TVL"
              type="pools"
              usedFallback={breakdownUsedFallback}
            />
          </div>

          {/* Debug Information */}
          {showDebugInfo && (
            <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Debug Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TVL Metrics Debug Info */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-md font-medium text-white mb-2">TVL Metrics</h4>
                  <div className="text-xs text-gray-300 font-mono overflow-auto max-h-60">
                    <pre>{JSON.stringify(metricsDebugInfo, null, 2)}</pre>
                  </div>
                </div>

                {/* TVL Breakdown Debug Info */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-md font-medium text-white mb-2">TVL Breakdown ({period})</h4>
                  <div className="text-xs text-gray-300 font-mono overflow-auto max-h-60">
                    <pre>{JSON.stringify(breakdownDebugInfo, null, 2)}</pre>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <p>This debug information is intended for developers and administrators only.</p>
                <p>It shows internal details about the TVL calculation process and data sources.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
