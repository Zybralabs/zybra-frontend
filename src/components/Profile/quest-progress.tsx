"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { Award, ChevronRight, Loader2, RefreshCw, Trophy } from 'lucide-react';
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

export default function QuestProgress() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { 
    getUserBadges, 
    trackLoginStreak, 
    trackReferralCount, 
    trackMultiPoolActivity, 
    trackCompletedQuests, 
    trackEarnedBadges 
  } = useUserAccount();

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

  const fetchBadges = useCallback(async () => {
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

        // Sort badges: earned first, then by progress percentage
        const sortedBadges = badgesList.sort((a, b) => {
          if (a.earned && !b.earned) return -1;
          if (!a.earned && b.earned) return 1;
          
          const aProgress = (a.progress / a.required) * 100;
          const bProgress = (b.progress / b.required) * 100;
          return bProgress - aProgress;
        });
        
        setBadges(sortedBadges);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  }, [getUserBadges]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Function to manually refresh badge progress
  const handleRefreshProgress = async () => {
    setRefreshing(true);
    try {
      // Call all tracking endpoints to refresh progress
      await Promise.all([
        trackLoginStreak(),
        trackReferralCount(),
        trackMultiPoolActivity(),
        trackCompletedQuests(),
        trackEarnedBadges()
      ]);
      
      // Fetch updated badge data
      await fetchBadges();
    } catch (error) {
      console.error("Error refreshing badge progress:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-lg">
      <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-400" />
          <span className="font-medium">Quest & Badge Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshProgress}
            disabled={refreshing}
            className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-full flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link 
            href="/points?tab=badges" 
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
          >
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
        ) : badges.length > 0 ? (
          <div className="space-y-4">
            {badges.slice(0, 5).map((badge, index) => (
              <motion.div 
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-[#00233A]/50 rounded-lg p-3 border border-[#003354]/60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${badge.earned ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md' : 'bg-[#002132] opacity-60'}
                  `}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white flex items-center">
                      {badge.title}
                      {badge.earned && <Award className="ml-2 h-4 w-4 text-green-400" />}
                    </h3>
                    <div className={`text-xs px-2 py-0.5 mt-1 inline-block rounded-full ${getCategoryStyle(badge.category)}`}>
                      {badge.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-[#001824] rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${badge.earned ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (badge.progress / badge.required) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{badge.description}</span>
                  <span className="text-white font-medium">
                    {badge.progress}/{badge.required}
                  </span>
                </div>
              </motion.div>
            ))}
            
            <Link href="/points?tab=badges" className="block w-full">
              <button className="w-full py-2 mt-2 text-sm text-blue-400 hover:text-blue-300 bg-[#00233A]/30 hover:bg-[#00233A]/50 rounded-lg border border-[#003354]/40 transition-colors">
                View All Badges
              </button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="h-8 w-8 text-blue-400/50 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-3">No badge progress found</p>
            <Link href="/points?tab=quests" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Start completing quests to earn badges
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
