import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This is a mock implementation of the earned badges tracking endpoint
export async function GET(req: NextRequest) {
  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate the token and get user ID
    // 2. Count total badges earned by the user
    // 3. Check for "ZyOG" (Zybra Original Gangster) badge milestone
    // 4. Award special recognition for badge collectors
    
    // Mock implementation - simulate badge tracking
    const now = new Date();
    
    // Simulate user's badge collection
    const totalBadgesEarned = Math.floor(Math.random() * 15) + 1; // 1-15 badges
    const rareBadgesEarned = Math.floor(Math.random() * 3); // 0-2 rare badges
    const legendaryBadgesEarned = Math.floor(Math.random() * 2); // 0-1 legendary badges
    
    // Mock badge categories
    const badgeCategories = {
      achievement: Math.floor(totalBadgesEarned * 0.4),
      milestone: Math.floor(totalBadgesEarned * 0.3),
      special: Math.floor(totalBadgesEarned * 0.2),
      seasonal: Math.floor(totalBadgesEarned * 0.1)
    };
    
    let pointsAwarded = 0;
    const questsCompleted = [];
    const specialBadgesEarned = [];
    
    // Check for badge collection milestones
    if (totalBadgesEarned >= 5 && totalBadgesEarned < 10) {
      // Badge Collector milestone
      const milestone = {
        badges: 5,
        points: 75,
        title: "Badge Collector",
        description: "Earn 5 badges"
      };
      
      const justAchieved = Math.random() < 0.3; // 30% chance
      if (justAchieved) {
        pointsAwarded += milestone.points;
        questsCompleted.push({
          quest_id: "badge_collector",
          quest_name: milestone.title,
          points: milestone.points,
          completed_at: now.toISOString()
        });
      }
    }
    
    if (totalBadgesEarned >= 10) {
      // ZyOG (Zybra Original Gangster) badge
      const zyogBadge = {
        badges: 10,
        points: 200,
        title: "ZyOG",
        description: "Zybra Original Gangster - Earn 10 or more badges",
        badge_type: "legendary",
        rarity: "legendary"
      };
      
      const justEarned = Math.random() < 0.25; // 25% chance
      if (justEarned) {
        pointsAwarded += zyogBadge.points;
        specialBadgesEarned.push(zyogBadge);
        questsCompleted.push({
          quest_id: "zyog",
          quest_name: zyogBadge.title,
          points: zyogBadge.points,
          completed_at: now.toISOString(),
          type: "legendary_badge"
        });
      }
    }
    
    // Special recognition for rare badge collectors
    if (rareBadgesEarned >= 2) {
      const rareCollector = {
        points: 100,
        title: "Rare Badge Hunter",
        description: "Collect 2 or more rare badges"
      };
      
      const justEarned = Math.random() < 0.2; // 20% chance
      if (justEarned) {
        pointsAwarded += rareCollector.points;
        questsCompleted.push({
          quest_id: "rare_hunter",
          quest_name: rareCollector.title,
          points: rareCollector.points,
          completed_at: now.toISOString(),
          type: "special_recognition"
        });
      }
    }
    
    // Legendary badge bonus
    if (legendaryBadgesEarned >= 1) {
      const legendaryBonus = {
        points: 150,
        title: "Legend Among Us",
        description: "Earn a legendary badge"
      };
      
      const justEarned = Math.random() < 0.15; // 15% chance
      if (justEarned) {
        pointsAwarded += legendaryBonus.points;
        questsCompleted.push({
          quest_id: "legendary_earner",
          quest_name: legendaryBonus.title,
          points: legendaryBonus.points,
          completed_at: now.toISOString(),
          type: "legendary_bonus"
        });
      }
    }
    
    // Calculate next milestone
    let nextMilestone = null;
    if (totalBadgesEarned < 5) {
      nextMilestone = { badges: 5, points: 75, title: "Badge Collector" };
    } else if (totalBadgesEarned < 10) {
      nextMilestone = { badges: 10, points: 200, title: "ZyOG" };
    } else if (totalBadgesEarned < 20) {
      nextMilestone = { badges: 20, points: 400, title: "Badge Master" };
    }
    
    // Calculate badge collection score
    const collectionScore = (
      totalBadgesEarned * 10 +
      rareBadgesEarned * 25 +
      legendaryBadgesEarned * 50
    );
    
    // Log the tracking (for development purposes)
    console.log(`Badge tracking completed:`, {
      total_badges_earned: totalBadgesEarned,
      rare_badges: rareBadgesEarned,
      legendary_badges: legendaryBadgesEarned,
      badge_categories: badgeCategories,
      collection_score: collectionScore,
      points_awarded: pointsAwarded,
      quests_completed: questsCompleted,
      special_badges_earned: specialBadgesEarned,
      timestamp: now.toISOString()
    });
    
    // Return success response with badge details
    return NextResponse.json({
      success: true,
      message: "Badge tracking completed successfully",
      payload: {
        total_badges_earned: totalBadgesEarned,
        rare_badges_earned: rareBadgesEarned,
        legendary_badges_earned: legendaryBadgesEarned,
        badge_categories: badgeCategories,
        collection_score: collectionScore,
        points_awarded: pointsAwarded,
        quests_completed: questsCompleted,
        special_badges_earned: specialBadgesEarned,
        next_milestone: nextMilestone,
        badges_until_next_milestone: nextMilestone ? nextMilestone.badges - totalBadgesEarned : 0,
        collection_completion: Math.min((totalBadgesEarned / 30) * 100, 100), // Assuming 30 total badges
        timestamp: now.toISOString()
      }
    });
  } catch (error) {
    console.error("Error tracking earned badges:", error);
    return NextResponse.json(
      { success: false, message: "Error tracking earned badges" },
      { status: 500 }
    );
  }
}
