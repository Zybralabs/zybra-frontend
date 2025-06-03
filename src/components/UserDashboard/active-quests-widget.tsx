"use client";

import React, { useEffect, useState } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { Award, ChevronRight, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Define Quest interface
interface QuestStep {
  step_id: string;
  title: string;
  description: string;
  type: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  progress_percent: number;
  completed_at: string | null;
}

interface QuestReward {
  points: number;
  badge: string | null;
  zrusd_amount: number;
  other_rewards: Record<string, any>;
}

interface Quest {
  quest_id: string;
  title: string;
  description: string;
  steps: QuestStep[];
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
  reward: QuestReward;
  expires_at: string | null;
  user_progress?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
    steps_progress: Array<{
      step_id: string;
      status: 'not_started' | 'in_progress' | 'completed';
      progress: number;
      progress_percent: number;
      completed_at: string | null;
    }>;
    started_at: string | null;
    completed_at: string | null;
    rewards_claimed: boolean;
    rewards_claimed_at: string | null;
  };
}

export default function ActiveQuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserQuests } = useUserAccount();

  useEffect(() => {
    const fetchActiveQuests = async () => {
      setLoading(true);
      try {
        const response = await getUserQuests('in_progress');
        if (response?.payload) {
          // Get only in-progress quests
          let activeQuests: Quest[] = [];
          if (Array.isArray(response.payload)) {
            activeQuests = response.payload as unknown as Quest[];
          } else if (
            typeof response.payload === 'object' &&
            response.payload !== null &&
            Array.isArray((response.payload as any).all_quests)
          ) {
            activeQuests = ((response.payload as any).all_quests as Quest[]).filter(
              (q: Quest) => q.user_progress?.status === 'in_progress'
            );
          }

          // Sort by progress percentage (highest first)
          const sortedQuests = activeQuests.sort((a, b) => {
            const aProgress = a.user_progress?.steps_progress.reduce((sum, step) => sum + step.progress_percent, 0) || 0;
            const bProgress = b.user_progress?.steps_progress.reduce((sum, step) => sum + step.progress_percent, 0) || 0;
            return bProgress - aProgress;
          });

          // Take only the top 3 quests
          setQuests(sortedQuests.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching active quests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveQuests();
  }, [getUserQuests]);

  // Calculate overall progress for a quest
  const calculateQuestProgress = (quest: Quest): number => {
    if (!quest.user_progress?.steps_progress?.length) return 0;

    const totalSteps = quest.steps.length;
    const completedSteps = quest.user_progress.steps_progress.filter(step => step.status === 'completed').length;
    const inProgressSteps = quest.user_progress.steps_progress.filter(step => step.status === 'in_progress');

    let progressSum = completedSteps * 100;
    inProgressSteps.forEach(step => {
      progressSum += step.progress_percent;
    });

    return Math.round(progressSum / totalSteps);
  };

  return (
    <div className="bg-gradient-to-br from-[#012b3f] to-[#01223a] rounded-2xl border border-[#0a3b54]/40 shadow-lg h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium text-white/90">Active Quests</h5>
          <div className="p-1 bg-[#0a3b54] rounded-full">
            <Trophy className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        <Link
          href="/points?tab=quests&filter=in-progress"
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
        ) : quests.length > 0 ? (
          <div className="space-y-4">
            {quests.map((quest, index) => {
              const progress = calculateQuestProgress(quest);
              const stepsCompleted = quest.user_progress?.steps_progress.filter(s => s.status === 'completed').length || 0;

              return (
                <motion.div
                  key={quest.quest_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-[#0a3b54]/30 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-white">{quest.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <Award className="h-3.5 w-3.5" />
                      <span>{quest.reward.points} pts</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#001824] rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">
                      {stepsCompleted} of {quest.steps.length} steps completed
                    </span>
                    <span className="text-white font-medium">{progress}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="h-8 w-8 text-blue-400/50 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No active quests</p>
            <div className="text-xs text-blue-400 mt-2">
              Complete quests to earn points
            </div>
          </div>
        )}

        {!loading && quests.length > 0 && (
          <div className="mt-4">
            <Link href="/points?tab=quests" className="block w-full">
              <button className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 bg-[#0a3b54]/30 hover:bg-[#0a3b54]/50 rounded-lg transition-colors">
                View All Quests
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
