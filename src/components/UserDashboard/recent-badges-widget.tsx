"use client";

import React, { useEffect, useState } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { Award, ChevronRight, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Badge {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  earned: boolean;
  progress: number;
  required: number;
}

export default function RecentBadgesWidget() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserBadges } = useUserAccount();

  // Helper function to get badge category style
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      'exploration': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'product_use': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'social_engagement': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'advanced_quests': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      'achievement': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      'streak': 'bg-red-500/20 text-red-300 border border-red-500/30'
    };
    return styles[category] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  // Helper function to get badge description based on ID
  const getBadgeDescription = (id: string, required: number) => {
    const descriptions = {
      'early_adopter': 'Joined during platform beta and completed at least one transaction',
      'login_streak_7': `Log in for ${required} consecutive days`,
      'login_streak_30': `Log in for ${required} consecutive days`,
      'dazzle_up': `Successfully refer ${required} friends who complete a transaction`,
      'super_staker': `Stake in ${required} different pools simultaneously`,
      'completionist': `Complete ${required} different quests`,
      'yield_seeker': `Lend ZrUSD for at least ${required} days`,
      'master_trader': `Complete ${required} trades with ZrUSD`,
      'social_butterfly': `Share ${required} achievements on social media`,
      'zy_og': 'Collect all available badges'
    };

    return descriptions[id as keyof typeof descriptions] || `Complete ${required} actions to earn this badge`;
  };

  // Helper function to get badge category based on ID
  const getBadgeCategory = (id: string) => {
    if (id.includes('login') || id.includes('streak')) return 'streak';
    if (id.includes('social') || id.includes('refer')) return 'social_engagement';
    if (id.includes('trade') || id.includes('yield') || id.includes('stake')) return 'product_use';
    if (id.includes('early') || id.includes('og')) return 'achievement';
    if (id.includes('complete')) return 'advanced_quests';
    return 'exploration';
  };

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const response = await getUserBadges();
        if (response?.payload) {
          // Transform badge data from API response
          const badgesList = Object.entries(response.payload.badge_progress).map(([id, badge]: [string, any]) => ({
            id,
            title: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description: getBadgeDescription(id, badge.required),
            category: getBadgeCategory(id),
            points: 100, // Default points value
            earned: response.payload.earned_badges.includes(id),
            progress: badge.progress,
            required: badge.required
          }));

          // Filter only earned badges and sort by most recently earned (assuming higher progress means more recent)
          const earnedBadges = badgesList
            .filter(badge => badge.earned)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3); // Take only the top 3 badges

          setBadges(earnedBadges);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [getUserBadges]);

  return (
    <div className="bg-gradient-to-br from-[#012b3f] to-[#01223a] rounded-2xl border border-[#0a3b54]/40 shadow-lg h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium text-white/90">Your Badges</h5>
          <div className="p-1 bg-[#0a3b54] rounded-full">
            <Award className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        <Link
          href="/points?tab=badges"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
        >
          View All <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </div>

      <div className="px-5 pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
        ) : badges.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-[#0a3b54]/30 rounded-lg p-4 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-2">
                {badges.slice(0, 3).map((badge, index) => (
                  <div key={badge.id} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-1">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-center text-white truncate max-w-full">
                      {badge.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="h-8 w-8 text-blue-400/50 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No badges earned yet</p>
            <div className="text-xs text-blue-400 mt-2">
              Complete quests to earn badges
            </div>
          </div>
        )}

        {!loading && badges.length > 0 && (
          <div className="mt-4">
            <Link href="/points?tab=badges" className="block w-full">
              <button className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 bg-[#0a3b54]/30 hover:bg-[#0a3b54]/50 rounded-lg transition-colors">
                View All Badges
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
