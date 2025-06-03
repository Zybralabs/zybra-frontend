import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import type { TVLMetrics } from '@/hooks/useTVL';
import { GrowthIcon, LossIcon } from '@/components/Icons';

interface TVLOverviewCardProps {
  data: TVLMetrics | null;
  loading: boolean;
  usedFallback?: boolean;
}

const TVLOverviewCard: React.FC<TVLOverviewCardProps> = ({ data, loading, usedFallback }) => {
  if (loading) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-700 rounded w-2/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
        <p className="text-white">No TVL data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-white">Total Value Locked</h2>
        {usedFallback && (
          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">Simplified Data</span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-3xl font-bold text-white">{formatCurrency(data.total)}</span>
        <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-1.5 py-0.5 rounded">
          <GrowthIcon />
          <span>+5.2%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#001a29] p-4 rounded-xl">
          <h3 className="text-gray-400 text-sm mb-2">Staking</h3>
          <p className="text-xl font-semibold text-white">{formatCurrency(data.staking)}</p>
          <div className="mt-2 text-xs text-gray-400">
            {data.transaction_counts.staking} transactions
          </div>
        </div>

        <div className="bg-[#001a29] p-4 rounded-xl">
          <h3 className="text-gray-400 text-sm mb-2">Lending</h3>
          <p className="text-xl font-semibold text-white">{formatCurrency(data.lending)}</p>
          <div className="mt-2 text-xs text-gray-400">
            {data.transaction_counts.lending} transactions
          </div>
        </div>

        <div className="bg-[#001a29] p-4 rounded-xl">
          <h3 className="text-gray-400 text-sm mb-2">Borrowing</h3>
          <p className="text-xl font-semibold text-white">{formatCurrency(data.borrowing)}</p>
          <div className="mt-2 text-xs text-gray-400">
            {data.transaction_counts.borrowing} transactions
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVLOverviewCard;
