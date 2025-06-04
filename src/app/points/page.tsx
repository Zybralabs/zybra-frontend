"use client";

import { useState, useEffect, type FC, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ErrorModal, SuccessModal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, format } from "date-fns";
import {
  Trophy,
  CloudLightning,
  ArrowRight,
  Clock,
  Gift,
  CheckCircle2,
  Star,
  XCircle,
  Sparkles,
  Award,
  TrendingUp,
  AlertCircle,
  Users,
  Share2,
  Mail,
  Copy,
  ChevronRight,
  Loader2,
  Zap,
  ArrowUpRight,
  Send,
  InfoIcon,
  Check,
  Badge,
  Map,
  MapIcon,
  BarChart,
  User,
  History
} from "lucide-react";
import LoadingContent from "@/components/LoadingContent";
import { useUserAccount, type Badges } from "@/context/UserAccountContext";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

// Type definitions for our points and quests
type QuestReward = {
  points: number;
  badge: string | null;
  zrusd_amount: number;
  other_rewards: Record<string, unknown>;
};
interface PointsActivity {
  activity_type: string;
  points: number;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

interface UserPointsProfile {
  user: string;
  total_points: number;
  lifetime_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tier_progress: number;
  rank: number;
  can_claim_daily_login: boolean;
  next_daily_login_available: string;
  points_by_category?: Record<string, number>;
}

interface QuestStep {
  step_id: string;
  type: 'deposit' | 'mint_zrusd' | 'lend_zrusd' | 'borrow_zrusd' | 'trade_zrusd' | 'hold_zrusd' | 'other';
  description: string;
  required_amount: number;
  required_duration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
  progress?: number;
  progress_percent?: number;
  completed_at?: string | null;
  reward: QuestReward;
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

interface LeaderboardEntry {
  user_id: string;
  username: string;
  name: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface QuestLeaderboardEntry {
  user_id: string;
  username: string;
  name: string;
  completed_quests: number;
  points: number;
  tier: string;
}

interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  tier_requirement: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  available: boolean;
  affordable: boolean;
  duration_days?: number;
  reward_amount?: number;
}

// Activity icon mapping
const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  first_login: Trophy,
  daily_login: Clock,
  profile_completion: CheckCircle2,
  wallet_connection: CloudLightning,

  stake_tokens: TrendingUp,
  swap_assets: TrendingUp,
  mint_zrusd: TrendingUp,
  lend_zrusd: TrendingUp,

  social_share_yield: Share2,
  social_create_thread: Share2,
  referral: Users,
  referral_successful: Users,

  multiple_features_bonus: Sparkles,
  complete_modules: Trophy,
  ama_participation: Users,
  weekly_prize: Award,

  transaction_completed: TrendingUp,
  offer_created: Trophy,
  offer_fulfilled: CheckCircle2,
  kyc_completed: CheckCircle2,
  deposit_made: TrendingUp,
  withdrawal_completed: TrendingUp,
  seasonal_reward: Sparkles,
  special_event: Gift,
  pool_staking: TrendingUp,
  quest_completed: Trophy,
  quest_step_completed: CheckCircle2,
  quest_reward: Trophy,
  points_redemption: Gift,
  frontend_update: Sparkles
};

// Tier badge styles mapping
const tierColors: Record<string, string> = {
  bronze: "bg-amber-700/20 text-amber-500 border-amber-700/30",
  silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  platinum: "bg-cyan-600/20 text-cyan-400 border-cyan-600/30",
  diamond: "bg-indigo-600/20 text-indigo-400 border-indigo-600/30"
};

// Tier icon component
const TierIcon: FC<{ tier: string; size?: "sm" | "md" | "lg" }> = ({ tier, size = "md" }) => {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };

  const iconSizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center ${tierColors[tier]}`}>
      {tier === 'bronze' && <Trophy className={iconSizeMap[size]} />}
      {tier === 'silver' && <Award className={iconSizeMap[size]} />}
      {tier === 'gold' && <Star className={iconSizeMap[size]} />}
      {tier === 'platinum' && <Sparkles className={iconSizeMap[size]} />}
      {tier === 'diamond' && <CloudLightning className={iconSizeMap[size]} />}
    </div>
  );
};




// Badge components
// Badge Card Component
interface Badge {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  earned: boolean;
  progress?: number;
  required?: number;
}

const BadgeCard: FC<{ badge: Badge; index: number }> = ({ badge, index }) => {
  // Map category to icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'exploration': <CloudLightning className="w-6 h-6 text-white" />,
      'product_use': <TrendingUp className="w-6 h-6 text-white" />,
      'social_engagement': <Users className="w-6 h-6 text-white" />,
      'advanced_quests': <Award className="w-6 h-6 text-white" />,
      'achievement': <Trophy className="w-6 h-6 text-white" />,
      'streak': <Clock className="w-6 h-6 text-white" />
    };
    return icons[category] || <Gift className="w-6 h-6 text-white" />;
  };

  return (
    <motion.div
      className={`bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-lg p-5
        ${badge.earned ? 'from-blue-500/10 to-blue-400/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'opacity-70'}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center
            ${badge.earned ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md' : 'bg-[#002132] opacity-60'}
          `}>
            {getCategoryIcon(badge.category)}
          </div>

          <div className="flex-grow">
            <h3 className="text-md font-semibold text-white flex items-center">
              {badge.title}
              {badge.earned && <CheckCircle2 className="ml-2 h-4 w-4 text-green-400" />}
            </h3>
            <div className={`text-xs px-2 py-0.5 mt-1 inline-block rounded-full ${getCategoryStyle(badge.category)}`}>
              {badge.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 flex-grow">{badge.description}</p>

        <div className="flex justify-between items-center">
          <div className="text-blue-400 text-sm font-medium">
            {badge.points} pts
          </div>
          {!badge.earned && badge.progress !== undefined && badge.required !== undefined && (
            <div className="flex-1 ml-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{badge.progress} / {badge.required}</span>
              </div>
              <Progress
                value={(badge.progress / badge.required) * 100}
                max={100}
                className="h-1.5 bg-[#001525]"
                indicatorClassName="bg-blue-500"
              />
            </div>
          )}
        </div>

        {badge.earned && (
          <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg py-2 px-3 text-center text-green-400 text-xs font-medium">
            Badge Earned!
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Badges Section Component
const BadgesSection = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const { getUserBadges } = useUserAccount();

  useEffect(() => {
    const fetchBadges = async () => {
      setBadgeLoading(true);
      try {
        const response = await getUserBadges();
        if (response?.payload) {
          // Transform badge data from API response
          const badgesList = Object.entries(response.payload.badge_progress).map(([id, badge]) => ({
            id,
            title: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description: getBadgeDescription(id, badge.required),
            category: getBadgeCategory(id),
            points: 100, // Default points value
            earned: response.payload.earned_badges.includes(id),
            progress: badge.progress,
            required: badge.required
          }));

          setBadges(badgesList);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setBadgeLoading(false);
      }
    };

    fetchBadges();
  }, [getUserBadges]);

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
  const getBadgeCategory = (id: string | string[]) => {
    if (id.includes('login') || id.includes('streak')) return 'streak';
    if (id.includes('social') || id.includes('refer')) return 'social_engagement';
    if (id.includes('trade') || id.includes('yield') || id.includes('stake')) return 'product_use';
    if (id.includes('early') || id.includes('og')) return 'achievement';
    if (id.includes('complete')) return 'advanced_quests';
    return 'exploration';
  };

  return (
    <div className="space-y-6">
      {badgeLoading ? (
        <div className="flex justify-center py-10">
          <LoadingContent size="md" />
        </div>
      ) : (
        <>
          <div className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 p-5">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-grow text-center md:text-left">
                <div className="text-xl font-medium text-white">
                  Your Badges
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  You&apos;ve earned <span className="text-blue-400 font-semibold">{badges.filter(b => b.earned).length}</span> out of <span className="text-blue-400 font-semibold">{badges.length}</span> badges
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Earned Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.filter(badge => badge.earned).length > 0 ? (
                badges
                  .filter(badge => badge.earned)
                  .map((badge, index) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      index={index}
                    />
                  ))
              ) : (
                <div className="col-span-full bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                  <div className="mb-2 flex justify-center">
                    <Trophy className="w-8 h-8 text-blue-400 opacity-60" />
                  </div>
                  <p>You haven&apos;t earned any badges yet. Complete quests and activities to earn your first badge!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Available Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.filter(badge => !badge.earned).length > 0 ? (
                badges
                  .filter(badge => !badge.earned)
                  .map((badge, index) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      index={index}
                    />
                  ))
              ) : (
                <div className="col-span-full bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                  <div className="mb-2 flex justify-center">
                    <Award className="w-8 h-8 text-green-400 opacity-60" />
                  </div>
                  <p>Congratulations! You&apos;ve earned all available badges!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


// Activity Card Component
const ActivityCard: FC<{ activity: PointsActivity }> = ({ activity }) => {
  const Icon = activityIcons[activity.activity_type] || Gift;

  // Format the activity for display
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get the category and add a corresponding style
  const getCategoryStyle = (metadata: Record<string, unknown> | string) => {
    // Handle both string and object metadata
    const category = typeof metadata === 'string'
      ? metadata
      : (metadata?.category as string) || 'other';

    const styles: Record<string, string> = {
      exploration: "from-blue-500/20 to-blue-600/20 text-blue-400",
      product_use: "from-green-500/20 to-green-600/20 text-green-400",
      social_engagement: "from-purple-500/20 to-purple-600/20 text-purple-400",
      advanced_quests: "from-orange-500/20 to-orange-600/20 text-orange-400",
      other: "from-gray-500/20 to-gray-600/20 text-gray-400"
    };
    return styles[category] || styles.other;
  };

  return (
    <div className="bg-[#001C29] rounded-lg overflow-hidden border border-[#003354]/40 p-4 flex items-center gap-4 hover:bg-[#00233A] transition-colors">
      <div className={`bg-gradient-to-r ${getCategoryStyle(activity.metadata)} rounded-full p-2.5 flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {formatActivityType(activity.activity_type)}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {activity?.created_at && formatDistanceToNow(new Date(activity?.created_at), { addSuffix: true })}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className={`text-sm font-medium ${activity.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {activity.points >= 0 ? '+' : ''}{activity.points} pts
        </div>
        {activity.expires_at && (
          <div className="text-xs text-gray-400 mt-0.5">
            Expires: {new Date(activity.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

const positionColors = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-500/30 to-amber-600/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.2)]'
  },
  2: {
    bg: 'bg-gradient-to-br from-slate-400/30 to-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-400/40',
    shadow: 'shadow-[0_0_8px_rgba(148,163,184,0.15)]'
  },
  3: {
    bg: 'bg-gradient-to-br from-amber-700/30 to-amber-800/20',
    text: 'text-amber-500',
    border: 'border-amber-700/40',
    shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.15)]'
  }
};
const getTierRingColor = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'bronze': return 'amber-500/50';
    case 'silver': return 'slate-300/50';
    case 'gold': return 'yellow-400/50';
    case 'platinum': return 'cyan-400/50';
    case 'diamond': return 'indigo-400/50';
    default: return 'blue-400/50';
  }
};
// Leaderboard Row Component
const LeaderboardRow: FC<{
  position: number;
  username: string | undefined;
  points: number;
  tier: string;
  isCurrentUser?: boolean;
}> = ({ position, username, points, tier, isCurrentUser = false }) => {
  // Truncate long wallet addresses
  const displayUsername = username?.startsWith('0x') ?
    `${username.substring(0, 6)}...${username.substring(username.length - 4)}` :
    username || 'Anonymous';

  // Determine if this is a top 3 position
  const isTopThree = position <= 3;
  const positionStyle = positionColors[position as keyof typeof positionColors] || {
    bg: 'bg-[#002A44]',
    text: 'text-gray-400',
    border: 'border-[#003354]/30',
    shadow: ''
  };

  return (
    <motion.div
      className={`
        flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300
        w-full max-w-full backdrop-blur-sm
        ${isCurrentUser
          ? 'bg-gradient-to-r from-[#002C54] to-[#00233A] border border-[#0071D4]/40 shadow-[0_0_15px_rgba(0,113,212,0.15)]'
          : 'bg-gradient-to-r from-[#001525] to-[#00233A] border border-[#003354]/30'
        }
        ${isTopThree ? positionStyle.shadow : ''}
        hover:shadow-lg
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: position * 0.05 }}
      whileHover={{
        scale: 1.01,
        boxShadow: isCurrentUser
          ? '0 0 20px rgba(0,113,212,0.25)'
          : isTopThree
            ? '0 0 15px rgba(0,53,84,0.3)'
            : '0 0 12px rgba(0,53,84,0.2)'
      }}
    >
      {/* Position Badge */}
      <div
        className={`
          w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center
          rounded-lg font-bold text-base sm:text-lg
          ${positionStyle.bg}
          ${positionStyle.text}
          border ${positionStyle.border}
        `}
      >
        {position}
      </div>

      {/* User Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          {/* Username with optional avatar for visual interest */}
          <div className="flex items-center gap-2 truncate">
            {isTopThree && position === 1 && (
              <span className="text-lg mr-1">👑</span>
            )}

            <span
              className={`
                truncate max-w-[150px] sm:max-w-full font-medium
                ${isCurrentUser
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#4FACFF] to-[#6CBBFF]'
                  : isTopThree ? 'text-white' : 'text-gray-200'
                }
              `}
            >
              {displayUsername}
            </span>

            {/* Tier Badge */}
            <div
              className={`
                px-2 py-0.5 text-xs rounded-full backdrop-blur-sm border
                ${tierColors[tier.toLowerCase()] || tierColors.bronze}
                ${isCurrentUser ? 'border-blue-500/30' : 'border-slate-700/50'}
              `}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </div>

            {/* You Badge */}
            {isCurrentUser && (
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md font-medium border border-blue-500/30">
                You
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Points */}
      <div
        className={`
          text-right font-bold
          ${isCurrentUser
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#4FACFF] to-[#6CBBFF]'
            : isTopThree && position === 1
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300'
              : 'text-white'
          }
        `}
      >
        <span className="text-sm sm:text-base">
          {points?.toLocaleString()}
          <span className="ml-1 text-xs sm:text-sm opacity-80">pts</span>
        </span>
      </div>
    </motion.div>
  );
};


// Helper function to get appropriate ring color for the tier badge

const getCategoryStyle = (category: string) => {
  const styles: Record<string, string> = {
    'Exploration': "bg-blue-500/20 text-blue-400 border-blue-500/30",
    'Product Use': "bg-green-500/20 text-green-400 border-green-500/30",
    'Social': "bg-purple-500/20 text-purple-400 border-purple-500/30",
    'Advanced': "bg-orange-500/20 text-orange-400 border-orange-500/30",
    'Achievement': "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    'Streak': "bg-pink-500/20 text-pink-400 border-pink-500/30"
  };
  return styles[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
};
// Quest Card Component
const QuestCard: FC<{
  quest: Quest;
  onStartQuest: (questId: string) => void;
  onClaimRewards: (questId: string) => void;
  isStarting: boolean;
  isClaiming: boolean;
  index: number;
}> = ({ quest, onStartQuest, onClaimRewards, isStarting, isClaiming, index }) => {
  const userProgress = quest.user_progress;
  const status = userProgress?.status || 'not_started';
  const isStarted = status !== 'not_started';
  const isCompleted = status === 'completed';
  const isClaimed = status === 'claimed';
  const isInProgress = status === 'in_progress';

  // Calculate total reward points (quest reward + sum of steps rewards)
  const totalRewardPoints = quest.reward.points +
    quest.steps.reduce((sum, step) => sum + step.reward.points, 0);

  // Calculate quest completion percentage
  const questCompletionPercent = isInProgress ?
    userProgress ?
      userProgress.steps_progress.reduce((sum, step) => sum + step.progress_percent, 0) /
      userProgress.steps_progress.length : 0
    : isCompleted || isClaimed ? 100 : 0;

  // Get category style


  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      exploration: CloudLightning,
      product_use: TrendingUp,
      social_engagement: Share2,
      advanced_quests: Award
    };
    const Icon = icons[category] || Gift;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <motion.div
      className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)] hover:shadow-[0_0_35px_rgba(0,100,160,0.25)] transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
        <span className="font-semibold text-md">{quest.title}</span>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(quest.steps[0]?.type || 'other')} flex items-center gap-1.5`}>
            {getCategoryIcon(quest.steps[0]?.type || 'other')}
            <span className="capitalize">{quest.steps[0]?.type?.replace('_', ' ') || 'Other'}</span>
          </div>
          <div className="text-xs px-2 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="font-medium text-xs">Testnet</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-gray-400 text-sm mb-4 h-12 line-clamp-2">
          {quest.description}
        </p>

        {/* Progress bar for in-progress quests */}
        {isInProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Completion</span>
              <span>{Math.round(questCompletionPercent)}%</span>
            </div>
            <Progress
              value={questCompletionPercent}
              max={100}
              className="h-1.5 bg-[#001525]"
              indicatorClassName={`bg-gradient-to-r ${['completed', 'claimed'].includes(status) ? 'from-green-500 to-green-400' : 'from-blue-500 to-blue-400'}`}
            />
          </div>
        )}

        <div className="bg-[#00233A] rounded-lg p-3 border border-[#003354]/60 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 z-0"></div>
          <div className="relative ">
            <div className="flex justify-between mb-1">
              <div className="text-gray-400 text-xs">Total Reward</div>
              <div className="text-blue-400 text-xs font-medium">{totalRewardPoints} points</div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              <div className="text-lg font-medium">
                {quest.reward.points} points
                {quest.reward.badge && <span className="ml-2 text-sm text-gray-400">+ &quot;{quest.reward.badge}&quot; badge</span>}
                {quest.reward.zrusd_amount > 0 && <span className="ml-2 text-sm text-purple-400">+ {quest.reward.zrusd_amount} ZrUSD</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quest Steps Accordion */}
        <Accordion type="single" collapsible className="mb-4 bg-[#001A26] rounded-lg border border-[#003354]/60">
          <AccordionItem value="quest-steps" className="border-b-0">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline hover:bg-[#002132]">
              Quest Steps ({quest.steps.length})
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="space-y-1 px-2 pb-2">
                {quest.steps.map((step, idx) => {
                  const stepProgress = userProgress?.steps_progress?.find(p => p.step_id === step.step_id);
                  const stepStatus = stepProgress?.status || 'not_started';
                  const progressPercent = stepProgress?.progress_percent || 0;
                  const isStepCompleted = stepStatus === 'completed';

                  return (
                    <div key={step.step_id} className="bg-[#001525] rounded-lg p-3 border border-[#003354]/40">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {isStepCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center text-xs font-medium text-gray-400">
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                          <div className="flex flex-wrap items-center mb-1 gap-x-2">
                            <div className="text-sm text-white">{step.description}</div>
                            <div className="text-xs text-blue-400 font-medium">+{step.reward.points} pts</div>
                          </div>

                          {isStarted && !isStepCompleted && (
                            <>
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{step.required_amount > 0 ?
                                  `${(stepProgress?.progress || 0).toFixed(2)} / ${step.required_amount} ${step.type === 'lend_zrusd' ? 'ZrUSD' : ''}` :
                                  `${progressPercent.toFixed(0)}%`}
                                </span>
                              </div>
                              <Progress
                                value={progressPercent}
                                max={100}
                                className="h-1.5 bg-[#001525]"
                                indicatorClassName="bg-blue-500"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <AnimatePresence mode="wait">
          {!isStarted && (
            <motion.div
              key="start-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onStartQuest(quest.quest_id)}
                className="w-full py-4 px-6 font-medium text-white rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 shadow-lg shadow-blue-500/30 transition-all duration-300"
                disabled={isStarting}
              >
                {isStarting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Starting...</span>
                  </div>
                ) : (
                  <>
                    <span>Start Quest</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {isCompleted && !isClaimed && (
            <motion.div
              key="claim-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onClaimRewards(quest.quest_id)}
                className="w-full py-4 px-6 font-medium text-white rounded-xl bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 shadow-lg shadow-green-500/30 transition-all duration-300"
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Claiming...</span>
                  </div>
                ) : (
                  <>
                    <span>Claim Rewards</span>
                    <Gift className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {isClaimed && (
            <motion.div
              key="claimed-status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-center text-green-400 font-medium"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Rewards Claimed!</span>
            </motion.div>
          )}

          {isInProgress && (
            <motion.div
              key="in-progress-status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-center text-blue-400 font-medium"
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Quest in Progress</span>
            </motion.div>
          )}
        </AnimatePresence>

        {quest.expires_at && (
          <div className="mt-3 text-xs text-gray-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Expires: {new Date(quest.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Analytics Card Component
const AnalyticsCard: FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}> = ({ title, value, subtitle, icon, bgColor }) => {
  return (
    <motion.div
      className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-5 flex items-start gap-4">
        <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1">{title}</div>
          <div className="text-2xl font-medium text-white mb-1">{value}</div>
          <div className="text-gray-500 text-xs">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Redemption Option Card Component
const RedemptionCard: FC<{
  option: RedemptionOption;
  onRedeem: (optionId: string, pointsCost: number) => void;
  isRedeeming: boolean;
}> = ({ option, onRedeem, isRedeeming }) => {
  return (
    <motion.div
      className={`
        bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-lg p-5
        ${!option.affordable ? 'opacity-60' : 'hover:shadow-[0_0_20px_rgba(0,100,160,0.2)]'}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={option.affordable ? { y: -3, scale: 1.02 } : {}}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-md font-semibold text-white">{option.name}</h3>
            <span className={`
              text-xs px-2 py-0.5 mt-1 inline-block rounded-full
              ${tierColors[option.tier_requirement]}
            `}>
              {option.tier_requirement.charAt(0).toUpperCase() + option.tier_requirement.slice(1)} Tier+
            </span>
          </div>
          <div className="text-right">
            <div className="text-blue-400 font-bold">{option.points_cost} pts</div>
            {option.duration_days && (
              <div className="text-xs text-gray-400">Duration: {option.duration_days} days</div>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 flex-grow">{option.description}</p>

        {option.reward_amount && (
          <div className="bg-[#00233A] rounded-lg p-3 border border-[#003354]/60 mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-medium">{option.reward_amount} ZrUSD</span>
            </div>
          </div>
        )}

        <Button
          onClick={() => onRedeem(option.id, option.points_cost)}
          className={`
            w-full py-2 font-medium rounded-lg transition-all
            ${option.affordable
              ? 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white shadow-md'
              : 'bg-[#001A26] text-gray-500 cursor-not-allowed'}
          `}
          disabled={!option.affordable || isRedeeming}
        >
          {isRedeeming ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Redeeming...</span>
            </div>
          ) : (
            option.affordable ? 'Redeem Reward' : 'Not Enough Points'
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// Referral Card Component

const ReferralCard = () => {
  const { getReferralStats, generateReferralCode } = useUserAccount();
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState({ code: false, link: false });
  const [referralData, setReferralData] = useState({
    referralCode: "",
    referralLink: "",
    successCount: 0,
    pendingCount: 0,
    pointsEarned: 0,
    hasGeneratedCode: false
  });

  // Define fetchReferralData with useCallback
  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReferralStats();

      if (response?.success && response?.payload) {
        setReferralData({
          referralCode: response.payload.referral_code || "",
          referralLink: response.payload.referral_link || "",
          successCount: response.payload.stats.successful_referrals || 0,
          pendingCount: response.payload.stats.pending_referrals || 0,
          pointsEarned: response.payload.stats.total_points_earned || 0,
          hasGeneratedCode: !!response.payload.referral_code
        });
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  }, [getReferralStats, setLoading, setReferralData]);

  // Fetch referral data when component mounts
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      const response = await generateReferralCode();

      if (response?.success && response?.payload) {
        setReferralData(prev => ({
          ...prev,
          referralCode: response.payload.referral_code,
          referralLink: response.payload.referral_link,
          hasGeneratedCode: true
        }));
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    setCopyState({ ...copyState, code: true });
    setTimeout(() => setCopyState({ ...copyState, code: false }), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    setCopyState({ ...copyState, link: true });
    setTimeout(() => setCopyState({ ...copyState, link: false }), 2000);
  };

  const handleSendEmail = () => {
    const subject = "Join me on Zybra Finance";
    const body = `Hey,\n\nI'm inviting you to join Zybra Finance. Sign up using my referral code: ${referralData.referralCode} or visit: ${referralData.referralLink}\n\nWe'll both earn bonus points when you join!\n\nCheers!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <TooltipProvider>
      <motion.div
        className="bg-[#001523] rounded-xl overflow-hidden border border-[#002A43] shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-gradient-to-r from-[#00233A] to-[#001220] py-4 px-5 border-b border-[#002A43] flex justify-between items-center">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-blue-400 mr-2" />
            <span className="font-semibold text-base text-white">Referral Program</span>
          </div>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2.5 py-1 text-xs">
            <Users className="mr-1.5 h-3 w-3" /> 1000 pts per referral
          </Badge>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-medium text-white mb-2">Invite friends & earn rewards</h3>
                <p className="text-gray-400 text-sm">Share your referral code with friends. When they join and complete their first activity, you&apos;ll both earn bonus points!</p>
              </div>

              {referralData.hasGeneratedCode ? (
                <div className="bg-[#00233A] rounded-lg p-5 border border-[#002A43] mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-white">Your Referral Code</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-blue-400 flex items-center cursor-help">
                          <InfoIcon className="w-3.5 h-3.5 mr-1.5" />
                          1000 points per referral
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">You earn 1000 points for each successful referral</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#001525] flex-grow px-4 py-3 rounded-lg border border-[#002A43] font-mono text-blue-300 select-all">
                      {referralData.referralCode}
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      className={`p-3 rounded-lg h-12 w-12 flex items-center justify-center transition-colors duration-200 ${
                        copyState.code
                          ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                          : "bg-[#00314F] hover:bg-[#003b5e] text-blue-300"
                      }`}
                    >
                      {copyState.code ? <Check size={18} /> : <Copy size={18} />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#00233A] rounded-lg p-8 border border-[#002A43] mb-6 flex flex-col items-center justify-center text-center">
                  <div className="bg-blue-500/10 p-3 rounded-full mb-4">
                    <Trophy className="h-10 w-10 text-blue-400" />
                  </div>
                  <h4 className="text-lg text-white font-medium mb-2">Generate Your Referral Code</h4>
                  <p className="text-gray-400 text-sm mb-5 max-w-md">Create your unique referral code to start inviting friends and earning rewards!</p>
                  <Button
                    onClick={handleGenerateCode}
                    className="py-3 px-6 font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Code
                  </Button>
                </div>
              )}

              {referralData.hasGeneratedCode && (
                <>
                  <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <Button
                      onClick={handleCopyLink}
                      className={`flex-1 py-3 font-medium rounded-lg transition-colors duration-200 ${
                        copyState.link
                          ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                          : "bg-[#00314F] hover:bg-[#003b5e] text-blue-300"
                      }`}
                    >
                      {copyState.link ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copyState.link ? "Link Copied!" : "Copy Referral Link"}
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      className="flex-1 py-3 font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email Invite
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#00233A] rounded-lg p-4 border border-[#002A43] text-center">
                      <div className="text-2xl font-bold text-white mb-1">{referralData.successCount}</div>
                      <div className="text-xs text-gray-400">Successful Referrals</div>
                    </div>
                    <div className="bg-[#00233A] rounded-lg p-4 border border-[#002A43] text-center">
                      <div className="text-2xl font-bold text-white mb-1">{referralData.pendingCount}</div>
                      <div className="text-xs text-gray-400">Pending Referrals</div>
                    </div>
                    <div className="bg-[#00233A] rounded-lg p-4 border border-[#002A43] text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{referralData.pointsEarned}</div>
                      <div className="text-xs text-gray-400">Points Earned</div>
                    </div>
                  </div>
                </>
              )}

              {/* Rewards multiplier card */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start mb-6">
                <div className="bg-blue-500/20 p-1.5 rounded-full mr-3 flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Boost your rewards!</h4>
                  <p className="text-xs text-gray-300">Complete social engagement quests to earn a 1.5x multiplier on all referral rewards.</p>
                  {referralData.successCount >= 3 && (
                    <div className="mt-2 text-xs text-green-400 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      You&apos;re on your way to the &quot;Dazzle Up&quot; badge! {referralData.successCount}/5 referrals
                    </div>
                  )}
                </div>
              </div>

              {referralData.hasGeneratedCode && referralData.successCount + referralData.pendingCount === 0 && (
                <div className="mt-6 bg-[#00233A] rounded-lg p-5 border border-dashed border-[#002A43] text-center">
                  <div className="bg-blue-500/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-2">No Referrals Yet</h4>
                  <p className="text-xs text-gray-400 mb-4">Share your code with friends to start earning rewards!</p>
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={() => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(`Join me on Zybra Finance! Sign up using my referral code: ${referralData.referralCode} ${referralData.referralLink}`), '_blank')}
                      className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] text-xs px-3 py-2 rounded-lg"
                      size="sm"
                    >
                      <FaTwitter className="h-3.5 w-3.5 mr-1.5" /> Twitter
                    </Button>
                    <Button
                      onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralData.referralLink)}&text=${encodeURIComponent(`Join me on Zybra Finance! Use my referral code: ${referralData.referralCode}`)}`, '_blank')}
                      className="bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] text-xs px-3 py-2 rounded-lg"
                      size="sm"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Telegram
                    </Button>
                    <Button
                      onClick={() => window.open(`https://discord.com/channels/@me`, '_blank')}
                      className="bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] text-xs px-3 py-2 rounded-lg"
                      size="sm"
                    >
                      <FaDiscord className="h-3.5 w-3.5 mr-1.5" /> Discord
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

// Category Card Component for the dashboard
const CategoryCard: FC<{
  title: string;
  points: number;
  icon: React.ReactNode;
  color: string;
  percentage: number;
  onClick: () => void;
}> = ({ title, points, icon, color, percentage, onClick }) => {
  return (
    <motion.div
      className={`bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 cursor-pointer hover:shadow-[0_0_20px_rgba(0,100,160,0.2)]`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{points}</div>
            <div className="text-xs text-gray-400">points</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-gray-400">{percentage}%</div>
        </div>
        <Progress
          value={percentage}
          max={100}
          className="h-1 mt-2 bg-[#001525]"
          indicatorClassName={`${color.replace('bg-', 'bg-')}`}
        />
      </div>
    </motion.div>
  );
};

// Add this near the top with other interfaces
interface QuestResponse {
  payload: {
    quests?: Record<string, Quest[]>;
    all_quests?: Quest[];
  } | Quest[];
}

// Main Component
const PointsAndQuests: FC = () => {
  const [activeTab, setActiveTab] = useState<string>("points");
  const [pointsSubTab, setPointsSubTab] = useState<string>("profile");
  const [questsSubTab, setQuestsSubTab] = useState<string>("available");
  const [loading, setLoading] = useState(true);
  const [redeemSubTab, setRedeemSubTab] = useState<string>("redeem");
  const [badges, setBadges] = useState<Badges | null>(null);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, { progress: number, required: number }>>({});
  const [badgeLoading, setBadgeLoading] = useState(false);
  // Points state
  const [userPoints, setUserPoints] = useState<UserPointsProfile | null>(null);
  const [pointsLeaderboard, setPointsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsActivity[]>([]);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [pointsByCategory, setPointsByCategory] = useState<Record<string, { points: number, percentage: number }>>({});

  // Quests state
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<Quest[]>([]);
  const [questLeaderboard, setQuestLeaderboard] = useState<QuestLeaderboardEntry[]>([]);
  const [startingQuest, setStartingQuest] = useState<string | null>(null);
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);
  const [categorizedQuests, setCategorizedQuests] = useState<Record<string, Quest[]>>({});

  // Redemption state
  const [redemptionOptions, setRedemptionOptions] = useState<RedemptionOption[]>([]);
  const [redeemingOption, setRedeemingOption] = useState<string | null>(null);

  // Referral state
  const [referralCode, setReferralCode] = useState<string>("ZYBRA123");
  const [referralStats, setReferralStats] = useState({
    successCount: 0,
    pendingCount: 0,
    pointsEarned: 0,
  });
  const [showReferralSuccess, setShowReferralSuccess] = useState(false);

  // UI state
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);

  const {
    address,
    getUserPointsProfile,
    getUserPointsHistory,
    getPointsLeaderboard,
    claimDailyLoginPoints,
    getAvailableQuests,
    getUserQuests,
    startQuest,
    claimQuestRewards,
    getQuestLeaderboard,
    getRedemptionOptions,
    redeemPointsForReward,
    updatePointsFromFrontend,
    getUserBadges,
    trackLoginStreak,
    trackReferralCount,
    trackMultiPoolActivity,
    trackCompletedQuests,
    trackEarnedBadges,
    getBadges
  } = useUserAccount();
  const router = useRouter();

  // Generate referral link
  const referralLink = useMemo(() => {
    return `https://zybra.finance/signup?ref=${referralCode}`;
  }, [referralCode]);

  // Create a persistent ref to track if badges fetch is in progress
  const isBadgesFetchingRef = useRef(false);

  const fetchBadgesData = useCallback(async () => {
    if (!address) return false;

    // If already fetching, don't make another request
    if (isBadgesFetchingRef.current) {
      console.log("Badges fetch already in progress, skipping");
      return false;
    }

    isBadgesFetchingRef.current = true;
    setBadgeLoading(true);

    try {
      let dataFetched = false;

      // Fetch all available badges
      const badgesResponse = await getBadges();
      if (badgesResponse?.payload) {
        setBadges(badgesResponse.payload);
        dataFetched = true;
      }

      // Fetch user-specific badge progress
      const userBadgesResponse = await getUserBadges();
      if (userBadgesResponse?.payload) {
        setUserBadges(userBadgesResponse.payload.earned_badges || []);
        setBadgeProgress(userBadgesResponse.payload.badge_progress || {});
        dataFetched = true;
      }

      return dataFetched;
    } catch (error) {
      console.error("Error fetching badges data:", error);
      // Don't show error to user, just return false
      return false;
    } finally {
      setBadgeLoading(false);
      isBadgesFetchingRef.current = false;
    }
  }, [address, getBadges, getUserBadges]);

  // Use refs to manage API request state
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const retryAttemptsRef = useRef(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const CACHE_DURATION = 80 * 1000; // 30 seconds cache

  // Separate API calls into individual functions with their own error handling
  const fetchPointsProfile = useCallback(async () => {
    try {
      // Check if we have a token in localStorage
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        console.log("No authentication token available, skipping points profile fetch");
        return false;
      }

      const pointsProfileRes = await getUserPointsProfile();
      if (pointsProfileRes?.payload) {
        setUserPoints(pointsProfileRes.payload);

        // Process points by category
        if (pointsProfileRes.payload.points_by_category) {
          const totalPoints = pointsProfileRes.payload.total_points;
          const categories = pointsProfileRes.payload.points_by_category;

          const processedCategories: Record<string, { points: number, percentage: number }> = {};

          for (const category in categories) {
            const points = categories[category];
            const percentage = totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0;
            processedCategories[category] = { points, percentage };
          }

          setPointsByCategory(processedCategories);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching points profile:", error);

      // Check if the error is due to authentication
      // Type assertion for error with response property
      const apiError = error as { response?: { status?: number; data?: { message?: string } } };
      if (apiError?.response?.status === 401) {
        console.log("Authentication error when fetching points profile, user needs to connect wallet");
      }

      return false;
    }
  }, [getUserPointsProfile]);

  const fetchPointsHistory = useCallback(async () => {
    try {
      const pointsHistoryRes = await getUserPointsHistory(1, 10);
      if (pointsHistoryRes?.payload?.history) {
        setPointsHistory(pointsHistoryRes.payload.history);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching points history:", error);
      return false;
    }
  }, [getUserPointsHistory]);

  // Create a persistent ref to track if leaderboard fetch is in progress
  const isLeaderboardFetchingRef = useRef(false);

  const fetchPointsLeaderboard = useCallback(async () => {
    // If we already have leaderboard data, don't fetch again
    if (pointsLeaderboard.length > 0) {
      console.log("Already have points leaderboard data, skipping fetch");
      return true;
    }

    // If already fetching, don't make another request
    if (isLeaderboardFetchingRef.current) {
      console.log("Points leaderboard fetch already in progress, skipping");
      return false;
    }

    isLeaderboardFetchingRef.current = true;

    try {
      console.log("Fetching points leaderboard");
      const pointsLeaderboardRes = await getPointsLeaderboard();
      if (pointsLeaderboardRes?.payload?.leaderboard) {
        setPointsLeaderboard(pointsLeaderboardRes.payload.leaderboard);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching points leaderboard:", error);
      // Don't show error to user, just return false
      return false;
    } finally {
      isLeaderboardFetchingRef.current = false;
    }
  }, [getPointsLeaderboard, pointsLeaderboard]);

  // Use refs to track API call states for quests data
  const isQuestsFetchingRef = useRef(false);
  const isUserQuestsFetchingRef = useRef(false);
  const isQuestLeaderboardFetchingRef = useRef(false);

  const fetchQuestsData = useCallback(async () => {
    try {
      // Track if any data was fetched
      let dataFetched = false;

      // Fetch available quests if not already fetching
      if (!isQuestsFetchingRef.current) {
        try {
          isQuestsFetchingRef.current = true;
          console.log("Fetching available quests");

          const availableQuestsRes = await getAvailableQuests() as QuestResponse;
          if (availableQuestsRes?.payload) {
            if (Array.isArray(availableQuestsRes.payload)) {
              // Process quests with proper typing
              const processedQuests = availableQuestsRes.payload.map((quest: Quest) => {
                // Ensure steps have all required fields
                const processedSteps = quest.steps.map((step: QuestStep) => ({
                  ...step,
                  progress: step.progress || 0,
                  progress_percent: step.progress_percent || 0,
                  completed_at: step.completed_at || null,
                }));

                return {
                  ...quest,
                  steps: processedSteps
                };
              });

              setAvailableQuests(processedQuests);

              // Categorize quests by category
              const categorized: Record<string, Quest[]> = {};
              availableQuestsRes.payload.forEach((quest: Quest) => {
                const category = quest.steps[0]?.type || 'other';
                if (!categorized[category]) {
                  categorized[category] = [];
                }
                categorized[category].push(quest);
              });
              setCategorizedQuests(categorized);
              dataFetched = true;
            } else if (availableQuestsRes.payload.quests) {
              // If it's already categorized
              setCategorizedQuests(availableQuestsRes.payload.quests);
              // Flatten for the available quests
              const allQuests = Object.values(availableQuestsRes.payload.quests).flat();
              setAvailableQuests(allQuests);
              dataFetched = true;
            }
          }
        } finally {
          isQuestsFetchingRef.current = false;
        }
      } else {
        console.log("Available quests fetch already in progress, skipping");
      }

      // Fetch user quests if not already fetching
      if (!isUserQuestsFetchingRef.current) {
        try {
          isUserQuestsFetchingRef.current = true;
          console.log("Fetching user quests");

          const userQuestsRes = await getUserQuests() as QuestResponse;
          if (userQuestsRes?.payload) {
            if (Array.isArray(userQuestsRes.payload)) {
              // Process user quests with proper typing
              const processedUserQuests = userQuestsRes.payload.map((quest: Quest) => {
                // Ensure steps have all required fields
                const processedSteps = quest.steps.map((step: QuestStep) => ({
                  ...step,
                  progress: step.progress || 0,
                  progress_percent: step.progress_percent || 0,
                  completed_at: step.completed_at || null,
                }));

                return {
                  ...quest,
                  steps: processedSteps
                };
              });

              setUserQuests(processedUserQuests);
              dataFetched = true;
            } else if (!Array.isArray(userQuestsRes.payload) && userQuestsRes.payload.all_quests) {
              setUserQuests(userQuestsRes.payload.all_quests);
              dataFetched = true;
            }
          }
        } finally {
          isUserQuestsFetchingRef.current = false;
        }
      } else {
        console.log("User quests fetch already in progress, skipping");
      }

      // Fetch quest leaderboard if not already fetching
      if (!isQuestLeaderboardFetchingRef.current) {
        try {
          isQuestLeaderboardFetchingRef.current = true;
          console.log("Fetching quest leaderboard");

          const questLeaderboardRes = await getQuestLeaderboard();
          if (questLeaderboardRes?.payload?.leaderboard) {
            setQuestLeaderboard(questLeaderboardRes.payload.leaderboard);
            dataFetched = true;
          }
        } finally {
          isQuestLeaderboardFetchingRef.current = false;
        }
      } else {
        console.log("Quest leaderboard fetch already in progress, skipping");
      }

      return dataFetched;
    } catch (error) {
      console.error("Error fetching quests data:", error);
      return false;
    }
  }, [getAvailableQuests, getUserQuests, getQuestLeaderboard]);

  const fetchRedemptionOptions = useCallback(async () => {
    try {
      const redemptionOptionsRes = await getRedemptionOptions();
      if (redemptionOptionsRes?.payload?.options) {
        setRedemptionOptions(redemptionOptionsRes.payload.options);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching redemption options:", error);
      return false;
    }
  }, [getRedemptionOptions]);

  // Main data fetching function with improved caching
  const fetchAllData = useCallback(async () => {
    if (!address) return;

    // If a fetch is already in progress, don't start another one
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    // Check if we've fetched recently and can use cached data
    const now = Date.now();
    if (now - lastFetchTimeRef.current < CACHE_DURATION && retryAttemptsRef.current === 0) {
      console.log(`Using cached data (age: ${Math.round((now - lastFetchTimeRef.current) / 1000)}s), skipping fetch`);
      return;
    }

    // Set fetch in progress flag
    fetchInProgressRef.current = true;
    setLoading(true);

    try {
      console.log("Starting data fetch for points and quests");

      // Execute essential operations first (profile and history)
      const profileResult = await fetchPointsProfile();

      // If profile fetch fails, we might have authentication issues
      if (!profileResult) {
        console.warn("Profile fetch failed, may indicate authentication issues");
      }

      // Continue with other operations even if profile fails
      // We'll execute these sequentially to avoid overwhelming the server
      await fetchPointsHistory();

      // These operations use our improved caching mechanism
      // and will skip if already in progress
      await fetchPointsLeaderboard();
      await fetchQuestsData();
      await fetchRedemptionOptions();
      await fetchBadgesData();

      // Update last fetch time
      lastFetchTimeRef.current = now;
      retryAttemptsRef.current = 0;

      // Set mock referral data (this would come from API in production)
      setReferralCode(`ZYBRA${Math.floor(1000 + Math.random() * 9000)}`);
      setReferralStats({
        successCount: Math.floor(Math.random() * 5),
        pendingCount: Math.floor(Math.random() * 3),
        pointsEarned: Math.floor(Math.random() * 2000),
      });

      console.log("Data fetch completed successfully");
    } catch (err) {
      console.error("Error in fetchAllData:", err);

      // If we haven't exceeded max retries, schedule a retry
      if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        retryAttemptsRef.current++;
        console.log(`Error during fetch, scheduling retry attempt ${retryAttemptsRef.current}`);

        // Wait before retrying (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current), 10000);
        setTimeout(() => {
          fetchAllData();
        }, retryDelay);
      } else {
        // Max retries exceeded, log error but don't show to user
        console.error("Max retry attempts exceeded");

        // Don't show any error modals for API failures
        // Just log the error and let the UI handle the empty state gracefully
        console.log("API failures will be handled with graceful UI fallbacks");

        // Reset retry counter
        retryAttemptsRef.current = 0;
      }
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [
    address,
    fetchPointsProfile,
    fetchPointsHistory,
    fetchPointsLeaderboard,
    fetchQuestsData,
    fetchRedemptionOptions,
    fetchBadgesData,
    CACHE_DURATION
  ]);

  // Fetch initial data
  useEffect(() => {
    // Only fetch data if we have an address
    if (address) {
      console.log("Initial data fetch for points and quests");
      fetchAllData();

      // Set up a refresh interval (every 5 minutes)
      // This is a more reasonable interval that won't overwhelm the server
      const intervalId = setInterval(() => {
        console.log("Scheduled refresh for points and quests data");
        fetchAllData();
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        console.log("Cleaning up points and quests data refresh interval");
        clearInterval(intervalId);
      };
    }
  }, [address, fetchAllData]);


  const combinedBadgesData = useMemo(() => {
    if (!badges?.badges) return [];

    return Object.entries(badges.badges).map(([badgeId, badgeInfo]) => {
      const progress = badgeProgress[badgeId] || { progress: 0, required: 1 };
      return {
        id: badgeId,
        title: badgeInfo.title,
        description: badgeInfo.description,
        category: badgeInfo.category,
        points: badgeInfo.points,
        earned: userBadges.includes(badgeId),
        progress: progress.progress,
        required: progress.required
      };
    });
  }, [badges, userBadges, badgeProgress]);
  // Handle daily login claim
  const handleClaimDailyLogin = async () => {
    try {
      setClaimingDaily(true);

      const response = await claimDailyLoginPoints();

      if (response?.payload) {
        // Refresh user points
        const pointsProfileRes = await getUserPointsProfile();
        if (pointsProfileRes?.payload) {
          setUserPoints(pointsProfileRes.payload);
        }

        setSuccess({
          title: "Points Claimed",
          message: `Successfully claimed ${response.payload.points_awarded} daily login points!`
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to claim daily login points. Please try again later.";
      setError({
        title: "Claim Failed",
        message: errorMsg
      });
    } finally {
      setClaimingDaily(false);
    }
  };

  // Handle starting a quest
  const handleStartQuest = async (questId: string) => {
    if (!address) {
      router.push("/signup");
      return;
    }

    try {
      setStartingQuest(questId);

      const response = await startQuest(questId);

      if (response?.payload) {
        // Refresh quests data
        const availableQuestsRes = await getAvailableQuests();
        if (availableQuestsRes?.payload) {
          if (Array.isArray(availableQuestsRes.payload)) {
            setAvailableQuests(availableQuestsRes.payload);

            // Re-categorize quests
            const categorized: Record<string, Quest[]> = {};
            availableQuestsRes.payload.forEach((quest: Quest) => {
              const category = quest.steps[0]?.type || 'other';
              if (!categorized[category]) {
                categorized[category] = [];
              }
              categorized[category].push(quest);
            });
            setCategorizedQuests(categorized);
          }
        }

        const userQuestsRes = await getUserQuests();
        if (userQuestsRes?.payload) {
          if (Array.isArray(userQuestsRes.payload)) {
            setUserQuests(userQuestsRes.payload);
          }
        }

        setSuccess({
          title: "Quest Started",
          message: "You've successfully started the quest. Complete all steps to earn rewards!"
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to start quest. Please try again later.";
      setError({
        title: "Failed to Start Quest",
        message: errorMsg
      });
    } finally {
      setStartingQuest(null);
    }
  };
  const fetchUserBadges = async () => {
    if (!address) return;

    try {
      setBadgeLoading(true);
      const userBadgesRes = await getUserBadges();

      if (userBadgesRes?.payload) {
        //@ts-ignore
        const badgesList: Badges[] = Object.entries(userBadgesRes.payload.badge_progress).map(([id, badge]: [string, { progress: number; required: number; eligible: boolean }]) => ({
          id,
          title: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          description: `Complete ${badge.required} actions to earn this badge`,
          category: 'achievement',
          points: 100,
          earned: userBadgesRes.payload.earned_badges.includes(id),
          progress: badge.progress,
          required: badge.required
        }));
//@ts-ignore
        setBadges(badgesList);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      setError({
        title: "Error Loading Badges",
        message: "Failed to load badges data. Please try again later."
      });
    } finally {
      setBadgeLoading(false);
    }
  };
  // Handle claiming quest rewards
  const handleClaimQuestRewards = async (questId: string) => {
    if (!address) {
      router.push("/signup");
      return;
    }

    try {
      setClaimingQuest(questId);

      const response = await claimQuestRewards(questId);

      if (response?.payload) {
        // Refresh quests data
        const userQuestsRes = await getUserQuests();
        if (userQuestsRes?.payload) {
          if (Array.isArray(userQuestsRes.payload)) {
            setUserQuests(
              userQuestsRes.payload.map((quest: Quest) => ({
                ...quest,
                steps: quest.steps.map((step: QuestStep) => ({
                  ...step,
                  progress: step.progress || 0,
                  progress_percent: step.progress_percent || 0,
                  completed_at: step.completed_at || null,
                })),
              }))
            );
          } else if ((userQuestsRes.payload as { all_quests: Quest[] }).all_quests) {
            setUserQuests((userQuestsRes.payload as { all_quests: Quest[] }).all_quests);
          }
        }

        // Refresh points data as well
        const pointsProfileRes = await getUserPointsProfile();
        if (pointsProfileRes?.payload) {
          setUserPoints(pointsProfileRes.payload);
        }

        setSuccess({
          title: "Rewards Claimed",
          message: `Successfully claimed quest rewards: ${response.payload.rewards.points} points${response.payload.rewards.badge ? ` and "${response.payload.rewards.badge}" badge` : ''
            }${response.payload.rewards.zrusd_amount > 0 ? ` and ${response.payload.rewards.zrusd_amount} ZrUSD` : ''
            }!`
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to claim quest rewards. Please try again later.";
      setError({
        title: "Failed to Claim Rewards",
        message: errorMsg
      });
    } finally {
      setClaimingQuest(null);
    }
  };

  // Handle redemption of rewards
  const handleRedeemReward = async (optionId: string, pointsCost: number) => {
    if (!address) {
      router.push("/signup");
      return;
    }

    try {
      setRedeemingOption(optionId);

      const response = await redeemPointsForReward(optionId, pointsCost);

      if (response?.payload) {
        // Refresh user points
        const pointsProfileRes = await getUserPointsProfile();
        if (pointsProfileRes?.payload) {
          setUserPoints(pointsProfileRes.payload);
        }

        // Refresh redemption options
        const redemptionOptionsRes = await getRedemptionOptions();
        if (redemptionOptionsRes?.payload?.options) {
          setRedemptionOptions(redemptionOptionsRes.payload.options);
        }

        setSuccess({
          title: "Reward Redeemed",
          message: `Successfully redeemed reward for ${pointsCost} points!`
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to redeem reward. Please try again later.";
      setError({
        title: "Failed to Redeem Reward",
        message: errorMsg
      });
    } finally {
      setRedeemingOption(null);
    }
  };

  // Handle copy referral code to clipboard
  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setSuccess({
        title: "Code Copied",
        message: "Referral code copied to clipboard!"
      });
    });
  };

  // Handle copy referral link to clipboard
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setSuccess({
        title: "Link Copied",
        message: "Referral link copied to clipboard!"
      });
    });
  };

  // Handle sending referral email
  const handleSendReferralEmail = () => {
    // This would typically open a modal for entering the recipient's email
    // For now, we'll just show a success message
    setSuccess({
      title: "Email Invitation",
      message: "Email invitation modal would appear here!"
    });
  };

  // Handle social sharing
  const handleSocialShare = async (platform: string) => {
    // Mock API call to record social sharing activity
    try {
      const response = await updatePointsFromFrontend(500, {
        platform,
        action: 'social_share',
        category: 'social_engagement'
      });

      if (response?.payload) {
        // Refresh user points
        const pointsProfileRes = await getUserPointsProfile();
        if (pointsProfileRes?.payload) {
          setUserPoints(pointsProfileRes.payload);
        }

        setSuccess({
          title: "Sharing Rewarded",
          message: `Earned ${response.payload.points_added} points for sharing on ${platform}!`
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to record sharing activity. Please try again later.";
      setError({
        title: "Sharing Failed",
        message: errorMsg
      });
    }
  };
  // This useEffect has been replaced by the main fetchAllData implementation above

  // Modal close handlers
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccess(null);
  }, []);

  // Render category stats boxes
  const renderCategoryStats = () => {
    const categories = [
      {
        id: 'exploration',
        title: 'Exploration',
        icon: <CloudLightning className="w-5 h-5 text-white" />,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600'
      },
      {
        id: 'product_use',
        title: 'Product Use',
        icon: <TrendingUp className="w-5 h-5 text-white" />,
        color: 'bg-gradient-to-br from-green-500 to-green-600'
      },
      {
        id: 'social_engagement',
        title: 'Social',
        icon: <Share2 className="w-5 h-5 text-white" />,
        color: 'bg-gradient-to-br from-purple-500 to-purple-600'
      },
      {
        id: 'advanced_quests',
        title: 'Advanced',
        icon: <Trophy className="w-5 h-5 text-white" />,
        color: 'bg-gradient-to-br from-amber-500 to-amber-600'
      }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(category => {
          const stats = pointsByCategory[category.id] || { points: 0, percentage: 0 };

          return (
            <CategoryCard
              key={category.id}
              title={category.title}
              points={stats.points}
              icon={category.icon}
              color={category.color}
              percentage={stats.percentage}
              onClick={() => setPointsSubTab("history")}
            />
          );
        })}
      </div>
    );
  };

  // Check if user has connected wallet or is authenticated
  const isWalletConnected = !!address;

  // Debug authentication state
  useEffect(() => {
    if (!isWalletConnected) {
      console.log("No wallet connected, checking localStorage for token");
      const storedToken = localStorage.getItem("authToken");
      console.log(`Token in localStorage: ${storedToken ? 'Yes' : 'No'}`);
    }
  }, [isWalletConnected]);



  return (
    <div className="flex-1 text-white flex flex-col items-center justify-center py-12 min-h-screen bg-gradient-to-b from-[#001525] to-[#001A20]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full space-y-10 px-4 relative ">
        {/* Header with subtle animation */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Points & Quests
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-base">
            Earn points by completing quests, making transactions, and engaging with Zybra Finance. Claim rewards and climb the leaderboards!
          </p>
        </motion.div>

        {/* Show Connect Wallet message if wallet is not connected */}
        {!isWalletConnected ? (
          <motion.div
            className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-lg p-8 text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <CloudLightning className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Connect your wallet to see your points, quests, and rewards. Start earning points by completing quests and engaging with Zybra Finance.
                </p>
              </div>

              <Button
                onClick={() => router.push("/signup")}
                className="py-2.5 px-6 bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-300 hover:shadow-blue-500/20 hover:shadow-xl"
              >
                <CloudLightning className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Main Tabs */
          <Tabs
            defaultValue="points"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
        <div className="relative mb-10">
  {/* Subtle background line */}
  <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-px bg-[#002040]/30"></div>

  <TabsList className="relative z-10 grid grid-cols-4 max-w-3xl mx-auto rounded-full overflow-hidden bg-[#001525]/80 border border-[#003354]/40">
    {[
      { value: "points", icon: Trophy, label: "Points" },
      { value: "quests", icon: MapIcon, label: "Quests" },
      { value: "badges", icon: Award, label: "Badges" },
      { value: "rewards", icon: Gift, label: "Referrals" }
    ].map(({ value, icon: Icon, label }) => (
      <TabsTrigger
        key={value}
        value={value}
        className="group relative px-3 py-2.5 rounded-full data-[state=active]:bg-[#0060df] data-[state=active]:text-white transition-all duration-300 text-sm font-medium"
      >
        <div className="flex items-center justify-center space-x-2">
          <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:scale-110" />
          <span className="transition-all duration-300">{label}</span>
        </div>

        {/* Subtle hover effect for inactive tabs */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 group-data-[state=active]:bg-transparent rounded-full transition-all duration-300"></div>
      </TabsTrigger>
    ))}
  </TabsList>

  {/* Subtle animated glow under the active tab */}
  <div className="absolute -bottom-1 left-0 right-0 flex justify-center pointer-events-none">
    <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-[#0060df]/60 to-transparent rounded-full"></div>
  </div>
</div>

          {/* Points & Leaderboard Tab Content */}
          <TabsContent value="points" className="space-y-6">
            {/* Points Sub-tabs */}
            <Tabs
              defaultValue="profile"
              value={pointsSubTab}
              onValueChange={setPointsSubTab}
              className="w-full"
            >
              {/* Sub-tabs Navigation */}
              <div className="relative mb-8">
                {/* Subtle background line */}
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-px bg-[#002040]/30"></div>

                <TabsList className="relative z-10 grid grid-cols-4 max-w-2xl mx-auto rounded-full overflow-hidden bg-[#001525]/80 border border-[#003354]/40">
                  {[
                    { value: "profile", label: "My Profile", icon: User, shortLabel: "Profile" },
                    { value: "redeem", label: "Redeem", icon: Gift, shortLabel: "Redeem" },
                    { value: "history", label: "History", icon: History, shortLabel: "History" },
                    { value: "leaderboard", label: "Leaderboard", icon: BarChart, shortLabel: "Board" }
                  ].map(({ value, label, icon: Icon, shortLabel }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="group relative px-2 py-2 rounded-full data-[state=active]:bg-[#0060df] data-[state=active]:text-white transition-all duration-300 text-sm font-medium"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:scale-110" />
                        <span className="hidden sm:inline transition-all duration-300">{label}</span>
                        <span className="sm:hidden text-xs transition-all duration-300">{shortLabel}</span>
                      </div>

                      {/* Subtle hover effect for inactive tabs */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 group-data-[state=active]:bg-transparent rounded-full transition-all duration-300"></div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Subtle animated glow under the active tab */}
                <div className="absolute -bottom-1 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#0060df]/60 to-transparent rounded-full"></div>
                </div>
              </div>

              {/* Points Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <>
                    {/* User Points Profile */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Points Overview Card */}
                      <div className="lg:col-span-2">
                        <motion.div
                          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-5">
                              <div className="flex-shrink-0">
                                <TierIcon tier={userPoints?.tier || 'bronze'} size="lg" />
                              </div>
                              <div className="flex-grow">
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                                  {userPoints?.total_points.toLocaleString() || 0} Points
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`
                                   px-2.5 py-1 text-xs rounded-full
                                   ${tierColors[userPoints?.tier || 'bronze']}
                                 `}>
                                    {userPoints?.tier ? userPoints.tier.charAt(0).toUpperCase() + userPoints.tier.slice(1) : 'Bronze'} Tier
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Rank #{userPoints?.rank || 0}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Tier Progress</span>
                                    <span>{userPoints?.tier_progress || 0}%</span>
                                  </div>
                                  <Progress
                                    value={userPoints?.tier_progress || 0}
                                    max={100}
                                    className="h-2 bg-[#001525]"
                                    indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-400"
                                  />
                                </div>
                                {userPoints?.can_claim_daily_login && (
                                  <div className="mt-4">
                                    <Button
                                      onClick={handleClaimDailyLogin}
                                      className="w-full md:w-auto py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white rounded-lg text-sm"
                                      disabled={claimingDaily}
                                    >
                                      {claimingDaily ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          Claiming...
                                        </>
                                      ) : (
                                        <>
                                          <Gift className="w-4 h-4 mr-2" />
                                          Claim Daily Login Reward
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Lifetime Points Card */}
                      <div className="lg:col-span-1">
                        <AnalyticsCard
                          title="Lifetime Points"
                          value={userPoints?.lifetime_points.toLocaleString() || "0"}
                          subtitle="Total points earned"
                          icon={<Trophy className="w-6 h-6 text-yellow-400" />}
                          bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
                        />
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-medium">Points by Category</h3>
                      {renderCategoryStats()}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Recent Activity</h3>
                        <Button
                          variant="link"
                          onClick={() => setPointsSubTab("history")}
                          className="text-blue-400 text-sm flex items-center"
                        >
                          View All
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {pointsHistory.length > 0 ? (
                          pointsHistory.slice(0, 5).map((activity, index) => (
                            <ActivityCard key={index} activity={activity} />
                          ))
                        ) : (
                          <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                            <div className="mb-2 flex justify-center">
                              <Sparkles className="w-8 h-8 text-blue-400 opacity-60" />
                            </div>
                            <p>No points activity yet. Start using Zybra Finance to earn points!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Redeem Points Tab */}
              <TabsContent value="redeem" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <>
                    {/* User Points Overview */}
                    <div className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 p-5">
                      <div className="flex flex-col md:flex-row items-center gap-5">
                        <div className="flex-shrink-0">
                          <TierIcon tier={userPoints?.tier || 'bronze'} />
                        </div>
                        <div className="flex-grow text-center md:text-left">
                          <div className="text-lg font-medium">
                            You have <span className="text-blue-400 font-bold">{userPoints?.total_points.toLocaleString() || 0}</span> points to redeem
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Your tier: <span className={`text-${userPoints?.tier === 'bronze' ? 'amber' : userPoints?.tier === 'silver' ? 'slate' : userPoints?.tier === 'gold' ? 'yellow' : userPoints?.tier === 'platinum' ? 'cyan' : 'indigo'}-400`}>
                              {userPoints?.tier ? userPoints.tier.charAt(0).toUpperCase() + userPoints.tier.slice(1) : 'Bronze'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Redemption Options */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-medium">Available Rewards</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {redemptionOptions.length > 0 ? (
                          redemptionOptions.map(option => (
                            <RedemptionCard
                              key={option.id}
                              option={option}
                              onRedeem={handleRedeemReward}
                              isRedeeming={redeemingOption === option.id}
                            />
                          ))
                        ) : (
                          <div className="col-span-full bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                            <div className="mb-2 flex justify-center">
                              <Gift className="w-8 h-8 text-blue-400 opacity-60" />
                            </div>
                            <p>No redemption options available yet. Check back soon!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              {/* Points History Tab */}
              <TabsContent value="history" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pointsHistory.length > 0 ? (
                      pointsHistory.map((activity, index) => (
                        <ActivityCard key={index} activity={activity} />
                      ))
                    ) : (
                      <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <Sparkles className="w-8 h-8 text-blue-400 opacity-60" />
                        </div>
                        <p>No points activity yet. Start using Zybra Finance to earn points!</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium">Global Leaderboard</h3>
                    <div className="space-y-3">
                      {pointsLeaderboard.length > 0 ? (
                        pointsLeaderboard.map((entry, index) => (
                          <LeaderboardRow
                            key={entry.user_id}
                            position={index + 1}
                            username={entry.username}
                            points={entry.total_points}
                            tier={entry.tier}
                            isCurrentUser={entry.user_id === userPoints?.user}
                          />
                        ))
                      ) : (
                        <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                          <div className="mb-2 flex justify-center">
                            <Trophy className="w-8 h-8 text-blue-400 opacity-60" />
                          </div>
                          <p>Leaderboard data is being updated. Check back soon!</p>
                          {/* Add a retry button that doesn't show errors */}
                          <button
                            onClick={() => {
                              setLoading(true);
                              fetchPointsLeaderboard().finally(() => setLoading(false));
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-md text-sm transition-colors"
                          >
                            Refresh Leaderboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Quests Tab Content */}
          <TabsContent value="quests" className="space-y-8">
            {/* Quests Sub-tabs */}
            <Tabs
              defaultValue="available"
              value={questsSubTab}
              onValueChange={setQuestsSubTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 max-w-sm mx-auto mb-6">
                <TabsTrigger value="available" className="text-xs">
                  Available
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="text-xs">
                  In Progress
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  Completed
                </TabsTrigger>
              </TabsList>

              {/* Available Quests Tab */}
              <TabsContent value="available" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Exploration Quests */}
                    {categorizedQuests.exploration && categorizedQuests.exploration.length > 0 && (
                      <div className="space-y-5">
                        <h3 className="text-lg font-medium flex items-center">
                          <CloudLightning className="text-blue-400 mr-2 h-5 w-5" />
                          Exploration Quests
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categorizedQuests.exploration
                            .filter(quest => quest.user_progress?.status !== 'claimed')
                            .map((quest, index) => (
                              <QuestCard
                                key={quest.quest_id}
                                quest={quest}
                                onStartQuest={handleStartQuest}
                                onClaimRewards={handleClaimQuestRewards}
                                isStarting={startingQuest === quest.quest_id}
                                isClaiming={claimingQuest === quest.quest_id}
                                index={index}
                              />
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Product Use Quests */}
                    {categorizedQuests.product_use && categorizedQuests.product_use.length > 0 && (
                      <div className="space-y-5">
                        <h3 className="text-lg font-medium flex items-center">
                          <TrendingUp className="text-green-400 mr-2 h-5 w-5" />
                          Product Use Quests
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categorizedQuests.product_use
                            .filter(quest => quest.user_progress?.status !== 'claimed')
                            .map((quest, index) => (
                              <QuestCard
                                key={quest.quest_id}
                                quest={quest}
                                onStartQuest={handleStartQuest}
                                onClaimRewards={handleClaimQuestRewards}
                                isStarting={startingQuest === quest.quest_id}
                                isClaiming={claimingQuest === quest.quest_id}
                                index={index}
                              />
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Social Engagement Quests */}
                    {categorizedQuests.social_engagement && categorizedQuests.social_engagement.length > 0 && (
                      <div className="space-y-5">
                        <h3 className="text-lg font-medium flex items-center">
                          <Share2 className="text-purple-400 mr-2 h-5 w-5" />
                          Social Engagement Quests
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categorizedQuests.social_engagement
                            .filter(quest => quest.user_progress?.status !== 'claimed')
                            .map((quest, index) => (
                              <QuestCard
                                key={quest.quest_id}
                                quest={quest}
                                onStartQuest={handleStartQuest}
                                onClaimRewards={handleClaimQuestRewards}
                                isStarting={startingQuest === quest.quest_id}
                                isClaiming={claimingQuest === quest.quest_id}
                                index={index}
                              />
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Advanced Quests */}
                    {categorizedQuests.advanced_quests && categorizedQuests.advanced_quests.length > 0 && (
                      <div className="space-y-5">
                        <h3 className="text-lg font-medium flex items-center">
                          <Award className="text-amber-400 mr-2 h-5 w-5" />
                          Advanced Quests
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categorizedQuests.advanced_quests
                            .filter(quest => quest.user_progress?.status !== 'claimed')
                            .map((quest, index) => (
                              <QuestCard
                                key={quest.quest_id}
                                quest={quest}
                                onStartQuest={handleStartQuest}
                                onClaimRewards={handleClaimQuestRewards}
                                isStarting={startingQuest === quest.quest_id}
                                isClaiming={claimingQuest === quest.quest_id}
                                index={index}
                              />
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* If no quests are available */}
                    {Object.keys(categorizedQuests).length === 0 && (
                      <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <Trophy className="w-8 h-8 text-blue-400 opacity-60" />
                        </div>
                        <p>No quests available at the moment. Check back soon!</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* In Progress Quests Tab */}
              <TabsContent value="in-progress" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userQuests
                        .filter(quest => quest.user_progress?.status === 'in_progress')
                        .map((quest, index) => (
                          <QuestCard
                            key={quest.quest_id}
                            quest={quest}
                            onStartQuest={handleStartQuest}
                            onClaimRewards={handleClaimQuestRewards}
                            isStarting={startingQuest === quest.quest_id}
                            isClaiming={claimingQuest === quest.quest_id}
                            index={index}
                          />
                        ))
                      }
                    </div>

                    {/* If no in-progress quests */}
                    {userQuests.filter(quest => quest.user_progress?.status === 'in_progress').length === 0 && (
                      <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <Clock className="w-8 h-8 text-blue-400 opacity-60" />
                        </div>
                        <p>You don&apos;t have any quests in progress. Start a new quest to earn rewards!</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Completed Quests Tab */}
              <TabsContent value="completed" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userQuests
                        .filter(quest => quest.user_progress?.status === 'completed' || quest.user_progress?.status === 'claimed')
                        .map((quest, index) => (
                          <QuestCard
                            key={quest.quest_id}
                            quest={quest}
                            onStartQuest={handleStartQuest}
                            onClaimRewards={handleClaimQuestRewards}
                            isStarting={startingQuest === quest.quest_id}
                            isClaiming={claimingQuest === quest.quest_id}
                            index={index}
                          />
                        ))
                      }
                    </div>

                    {/* If no completed quests */}
                    {userQuests.filter(quest => quest.user_progress?.status === 'completed' || quest.user_progress?.status === 'claimed').length === 0 && (
                      <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <CheckCircle2 className="w-8 h-8 text-blue-400 opacity-60" />
                        </div>
                        <p>You haven&apos;t completed any quests yet. Start a quest to earn rewards!</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Rewards Tab Content */}
          <TabsContent value="rewards" className="space-y-8">
            {/* Rewards Sub-tabs */}
            <Tabs
              defaultValue="referral"
              value={redeemSubTab}
              onValueChange={setRedeemSubTab}
              className="w-full"
            >
             

            

              {/* Referral Program Tab */}
              <TabsContent value="referral" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <ReferralCard />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="badges" className="space-y-8">
            {badgeLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : combinedBadgesData.length > 0 ? (
              <>
                <div className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 p-5">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow text-center md:text-left">
                      <div className="text-xl font-medium text-white">
                        Your Badges
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        You&apos;ve earned <span className="text-blue-400 font-semibold">{combinedBadgesData.filter(b => b.earned).length}</span> out of <span className="text-blue-400 font-semibold">{combinedBadgesData.length}</span> badges
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Earned Badges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combinedBadgesData.filter(badge => badge.earned).length > 0 ? (
                      combinedBadgesData
                        .filter(badge => badge.earned)
                        .map((badge, index) => (
                          <BadgeCard
                            key={badge.id}
                            badge={badge}
                            index={index}
                          />
                        ))
                    ) : (
                      <div className="col-span-full bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <Trophy className="w-8 h-8 text-blue-400 opacity-60" />
                        </div>
                        <p>You haven&apos;t earned any badges yet. Complete quests and activities to earn your first badge!</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Available Badges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combinedBadgesData.filter(badge => !badge.earned).length > 0 ? (
                      combinedBadgesData
                        .filter(badge => !badge.earned)
                        .map((badge, index) => (
                          <BadgeCard
                            key={badge.id}
                            badge={badge}
                            index={index}
                          />
                        ))
                    ) : (
                      <div className="col-span-full bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                        <div className="mb-2 flex justify-center">
                          <Award className="w-8 h-8 text-green-400 opacity-60" />
                        </div>
                        <p>Congratulations! You&apos;ve earned all available badges!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#001C29] rounded-lg p-6 text-center text-gray-400">
                <div className="mb-2 flex justify-center">
                  <Award className="w-8 h-8 text-blue-400 opacity-60" />
                </div>
                <p>Badge data is being updated. Check back soon!</p>
                {/* Add a retry button that doesn't show errors */}
                <button
                  onClick={() => {
                    setBadgeLoading(true);
                    fetchBadgesData().finally(() => setBadgeLoading(false));
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-md text-sm transition-colors"
                >
                  Refresh Badges
                </button>
              </div>
            )}
          </TabsContent>

        </Tabs>
        )}
      </div>

      {/* Error Modal */}
      {error && (
        <ErrorModal
          isOpen={!!error}
          onClose={handleErrorClose}
          title={error.title}
          message={error.message}
        />
      )}

      {/* Success Modal */}
      {success && (
        <SuccessModal
          isOpen={!!success}
          onClose={handleSuccessClose}
          title={success.title}
          message={success.message}
        />
      )}
    </div>
  );
};

export default PointsAndQuests;