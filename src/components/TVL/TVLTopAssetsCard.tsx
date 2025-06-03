import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import type { TVLBreakdownData } from '@/hooks/useTVL';

interface TVLTopAssetsCardProps {
  data: TVLBreakdownData | null;
  loading: boolean;
  title: string;
  type: 'assets' | 'pools';
  usedFallback?: boolean;
}

const TVLTopAssetsCard: React.FC<TVLTopAssetsCardProps> = ({ data, loading, title, type, usedFallback }) => {
  if (loading) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-5 bg-gray-700 rounded w-1/3"></div>
              <div className="h-5 bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
        <p className="text-white">No data available</p>
      </div>
    );
  }

  const items = type === 'assets' ? data.top_assets : data.top_pools;

  return (
    <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {usedFallback && (
          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">Simplified Data</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-[#0a3b54]/20 rounded-lg p-4 text-center">
          <p className="text-gray-400">No {type} found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            // Get rank styling based on position
            const getRankStyling = (rank: number) => {
              if (rank === 1) return {
                bg: 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/10',
                border: 'border-yellow-500/30',
                rankBg: 'bg-yellow-600',
                rankText: 'text-yellow-100',
                icon: '👑'
              };
              if (rank === 2) return {
                bg: 'bg-gradient-to-r from-gray-400/20 to-gray-300/10',
                border: 'border-gray-400/30',
                rankBg: 'bg-gray-500',
                rankText: 'text-gray-100',
                icon: '🥈'
              };
              if (rank === 3) return {
                bg: 'bg-gradient-to-r from-amber-600/20 to-amber-500/10',
                border: 'border-amber-500/30',
                rankBg: 'bg-amber-600',
                rankText: 'text-amber-100',
                icon: '🥉'
              };
              return {
                bg: 'bg-[#0a3b54]/20',
                border: 'border-[#0a3b54]/30',
                rankBg: 'bg-[#0a3b54]',
                rankText: 'text-blue-200',
                icon: ''
              };
            };

            const styling = getRankStyling(index + 1);

            return (
              <div
                key={index}
                className={`${styling.bg} ${styling.border} border rounded-lg p-3 transition-all duration-200 hover:bg-opacity-80 hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className={`${styling.rankBg} ${styling.rankText} w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg`}>
                      {index + 1}
                    </div>

                    {/* Icon for top 3 */}
                    {styling.icon && (
                      <span className="text-lg">{styling.icon}</span>
                    )}

                    {/* Address */}
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">
                        {item.address.length > 15
                          ? `${item.address.substring(0, 6)}...${item.address.substring(item.address.length - 4)}`
                          : item.address}
                      </span>
                      <span className="text-gray-400 text-xs capitalize">
                        {type === 'assets' ? 'Asset' : 'Pool'}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      TVL
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TVLTopAssetsCard;
