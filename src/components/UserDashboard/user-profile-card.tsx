import React from 'react';
import type { User } from '@/context/UserAccountContext';
import { UserCheck, UserCog } from 'lucide-react';
import Link from 'next/link';

interface UserProfileCardProps {
  user: User | null;
  loading?: boolean;
}

export function UserProfileCard({ user, loading = false }: UserProfileCardProps) {
  // Determine what to display based on available user data
  const displayName = React.useMemo(() => {
    if (!user) return 'Anonymous User';

    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    } else if (user.username) {
      return user.username;
    }

    return 'Anonymous User';
  }, [user]);

  // Determine user status based on profile and KYC status
  const userStatus = React.useMemo(() => {
    if (!user) return { text: 'Guest User', color: 'text-gray-400', bgColor: 'bg-gray-800/50' };

    if (user.kyc_status === 'approved') {
      return { text: 'Verified User', color: 'text-green-400', bgColor: 'bg-green-900/20' };
    } else if (user.kyc_status === 'pending') {
      return { text: 'KYC Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    } else if (user.kyc_status === 'rejected') {
      return { text: 'KYC Rejected', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    } else if (user.profile_status === 'complete') {
      return { text: 'Profile Complete', color: 'text-blue-400', bgColor: 'bg-blue-900/20' };
    }

    return { text: 'Profile Incomplete', color: 'text-gray-400', bgColor: 'bg-gray-800/50' };
  }, [user]);

  return (
    <div className="rounded-lg bg-gradient-to-b from-[#1D212F] to-[#171B27] p-5 text-white overflow-hidden relative border border-gray-800/50">
      {/* Background gradient decoration */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Left side - User info */}
        <div className="flex items-center gap-3">
          {/* Avatar/Icon */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center ring-2 ring-blue-500/20">
            {loading ? (
              <div className="h-6 w-6 rounded-full bg-gray-700/50 animate-pulse"></div>
            ) : (
              <UserCheck className="h-6 w-6 text-blue-400" />
            )}
          </div>

          {/* User details */}
          <div>
            {loading ? (
              <>
                <div className="h-6 w-48 bg-gray-700/50 animate-pulse rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-700/50 animate-pulse rounded"></div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white">
                  {displayName}
                </h2>
                {user?.username && (
                  <div className="text-sm text-blue-400">
                    @{user.username}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right side - Status and actions */}
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              <span className={`text-xs px-3 py-1 rounded-full ${userStatus.bgColor} ${userStatus.color} font-medium`}>
                {userStatus.text}
              </span>

              {user?.kyc_status !== 'approved' && (
                <Link
                  href="/kyc/onboarding/investor-type"
                  className="text-xs px-3 py-1 rounded-full bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30 transition-colors font-medium"
                >
                  Complete KYC
                </Link>
              )}

              <Link
                href="/profile"
                className="text-xs px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors font-medium flex items-center gap-1"
              >
                <UserCog className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Welcome message */}
      {!loading && (
        <div className="mt-4 pt-4 border-t border-gray-800/50 text-sm text-gray-400 flex justify-between items-center">
          <div>
            Welcome to your Zybra Finance dashboard
          </div>
          <div className="text-xs text-gray-500">
            Last login: {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
