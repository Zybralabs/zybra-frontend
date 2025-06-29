import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This is a mock implementation of the user badges endpoint
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

    // Mock implementation - simulate user badge data
    const now = new Date();
    
    // Mock earned badges (these would come from database) - EXACT API NAMES
    const earnedBadges = [
      "first_login",
      "testnet_staker",
      "zrusd_minter",
      "power_user",
      "streak_3_day"
    ];

    // Mock badge progress data (these would come from database) - EXACT API NAMES
    const badgeProgress = {
      // Login and streak badges (exact API names from console)
      "first_login": { progress: 1, required: 1, eligible: true },
      "daily_login": { progress: 15, required: 30, eligible: true },
      "streak_3_day": { progress: 3, required: 3, eligible: true },
      "streak_5_day": { progress: 4, required: 5, eligible: true },
      "streak_7_day": { progress: 5, required: 7, eligible: true },
      "testnet_connected": { progress: 1, required: 1, eligible: true },

      // Product usage badges (exact API names from console)
      "testnet_staker": { progress: 1, required: 1, eligible: true },
      "testnet_lender": { progress: 0, required: 1, eligible: true },
      "zrusd_minter": { progress: 1, required: 1, eligible: true },
      "asset_swapper": { progress: 2, required: 5, eligible: true },
      "power_user": { progress: 4, required: 4, eligible: true },
      "super_staker": { progress: 2, required: 5, eligible: true },

      // Achievement badges (exact API names from console)
      "profile_complete": { progress: 1, required: 1, eligible: true },
      "completionist": { progress: 12, required: 20, eligible: true },
      "test_pilot": { progress: 1, required: 1, eligible: true },
      "zy_og": { progress: 5, required: 10, eligible: true },

      // Social engagement badges (exact API names from console)
      "dazzle_up": { progress: 1, required: 5, eligible: true },
      "zybra_promoter": { progress: 2, required: 3, eligible: true },
      "zybra_evangelist": { progress: 0, required: 1, eligible: true },
      "zybra_referrer": { progress: 1, required: 3, eligible: true },
      "community_participant": { progress: 0, required: 1, eligible: true },

      // Special badges (exact API names from console)
      "feature_explorer": { progress: 3, required: 5, eligible: true },
      "zybra_master": { progress: 8, required: 10, eligible: true },
      "prize_entrant": { progress: 0, required: 1, eligible: true }
    };
    
    // Return success response with badge data
    return NextResponse.json({
      success: true,
      message: "User badges retrieved successfully",
      payload: {
        earned_badges: earnedBadges,
        badge_progress: badgeProgress,
        total_badges_available: Object.keys(badgeProgress).length,
        total_badges_earned: earnedBadges.length,
        completion_percentage: Math.round((earnedBadges.length / Object.keys(badgeProgress).length) * 100),
        timestamp: now.toISOString()
      }
    });
  } catch (error) {
    console.error("Error retrieving user badges:", error);
    return NextResponse.json(
      { success: false, message: "Error retrieving user badges" },
      { status: 500 }
    );
  }
}
