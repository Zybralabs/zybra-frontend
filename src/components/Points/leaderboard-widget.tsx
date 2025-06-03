"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { Award, ChevronRight, Loader2, Medal, RefreshCw, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  name: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getQuestLeaderboard, user } = useUserAccount();

  // Define tier colors
  const tierColors: Record<string, string> = {
    bronze: 'bg-amber-900/20 text-amber-400 border-amber-900/30',
    silver: 'bg-slate-300/20 text-slate-300 border-slate-300/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    diamond: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getQuestLeaderboard();
      if (response?.payload) {
        setLeaderboard(
          response.payload?.leaderboard.slice(0, 5).map((entry: any) => ({
            user_id: entry.user_id,
            username: entry.username,
            name: entry.name,
            total_points: entry.total_points ?? entry.points ?? 0,
            tier: entry.tier as LeaderboardEntry['tier'],
          }))
        ); // Get top 5 users
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [getQuestLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  // Get medal for top positions
  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return <Medal className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-slate-300" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#012b3f] to-[#01223a] rounded-2xl border border-[#0a3b54]/40 shadow-lg h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium text-white/90">Points Leaderboard</h5>
          <div className="p-1 bg-[#0a3b54] rounded-full">
            <User className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </button>
          <Link
            href="/points?tab=leaderboard"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
          >
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      <div className="px-5 pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-[#0a3b54]/30 rounded-lg p-3">
              {leaderboard.slice(0, 3).map((entry, index) => {
                // Check if this entry is the current user
                const isCurrentUser = user && (user.user_id === entry.user_id || user.username === entry.username);

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between py-2 ${index < leaderboard.slice(0, 3).length - 1 ? 'border-b border-[#0a3b54]/30' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{entry.name || entry.username || 'Anonymous'}</span>
                      {isCurrentUser && (
                        <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-md font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{entry.total_points.toLocaleString()} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="h-8 w-8 text-blue-400/50 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No leaderboard data available</p>
            <div className="text-xs text-blue-400 mt-2">
              Complete quests to earn points
            </div>
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <div className="mt-4">
            <Link href="/points?tab=leaderboard" className="block w-full">
              <button className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 bg-[#0a3b54]/30 hover:bg-[#0a3b54]/50 rounded-lg transition-colors">
                View Full Leaderboard
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
