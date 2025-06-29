"use client";

import React from 'react';
import { Trophy, User, Loader2 } from 'lucide-react';

interface UserRankDisplayProps {
  rank: number | null;
  points: number;
  tier: string;
  username?: string;
  loading?: boolean;
  totalUsers?: number;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-900/20 text-amber-400 border-amber-900/30',
  silver: 'bg-slate-300/20 text-slate-300 border-slate-300/30',
  gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  diamond: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const formatPoints = (points: number): string => {
  if (points >= 1000000000000) {
    return `${(points / 1000000000000).toFixed(2)}T`;
  } else if (points >= 1000000000) {
    return `${(points / 1000000000).toFixed(2)}B`;
  } else if (points >= 1000000) {
    return `${(points / 1000000).toFixed(2)}M`;
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(2)}K`;
  }
  return points.toLocaleString();
};

const formatUsername = (username: string | undefined): string => {
  if (!username) return 'Unknown User';

  if (username.startsWith('0x')) {
    return `${username.substring(0, 6)}...${username.substring(username.length - 4)}`;
  }
  return username.length > 20 ? `${username.substring(0, 20)}...` : username;
};

export default function UserRankDisplay({ 
  rank, 
  points, 
  tier, 
  username, 
  loading = false, 
  totalUsers = 0 
}: UserRankDisplayProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#012b3f] to-[#01223a] rounded-2xl border border-[#0a3b54]/40 p-4 sm:p-6">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#012b3f] to-[#01223a] rounded-2xl border border-[#0a3b54]/40 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            {rank ? (
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-medium text-white/90 truncate">
                Your Rank
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${tierColors[tier] || tierColors.bronze}`}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
              <span className="truncate" title={username}>
                {formatUsername(username)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg sm:text-xl font-bold text-white mb-1">
            {rank ? (
              <span className="text-blue-400">
                {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
              </span>
            ) : (
              <span className="text-gray-400">Unranked</span>
            )}
          </div>
          
          <div className="text-xs sm:text-sm text-gray-400">
            {totalUsers > 0 && rank ? `of ${totalUsers.toLocaleString()} users` : ''}
          </div>
          
          <div className="text-sm sm:text-base font-medium text-blue-400 mt-1">
            <span className="text-white">{formatPoints(points)}</span> pts
          </div>
        </div>
      </div>
    </div>
  );
}
