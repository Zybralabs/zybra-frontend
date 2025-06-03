import React, { useMemo } from 'react';
import type { User } from '@/context/UserAccountContext';
import { motion } from 'framer-motion';
import { UserCheck, UserCog, Bell, Settings } from 'lucide-react';
import Link from 'next/link';

interface UserProfileHeaderProps {
  user: User | null;
  loading?: boolean;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user, loading = false }) => {
  // Determine what to display based on available user data
  console.log({user})
  const displayName = useMemo(() => {
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

  // Determine greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="w-full mb-6 px-1">
      <motion.div
        className="w-full bg-[#012B3F] backdrop-blur-md border border-[#022e45]/60 rounded-xl shadow-[0_4px_16px_rgba(0,10,20,0.25)] p-4 sm:p-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left side - User info */}
          <div className="flex items-center gap-3">
            {/* Avatar/Icon */}
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0066A1]/30 to-[#00A3FF]/20 flex items-center justify-center ring-2 ring-[#0066A1]/30">
              {loading ? (
                <div className="h-6 w-6 rounded-full bg-[#022e45]/50 animate-pulse"></div>
              ) : (
                <UserCheck className="h-6 w-6 text-[#4BB6EE]" />
              )}
            </div>

            {/* User details */}
            <div>
              {loading ? (
                <>
                  <div className="h-5 w-32 bg-[#022e45]/50 animate-pulse rounded mb-2"></div>
                  <div className="h-7 w-48 bg-[#022e45]/50 animate-pulse rounded"></div>
                </>
              ) : (
                <>
                  <div className="text-sm text-[#4BB6EE]">
                    {greeting}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {displayName}
                    {user?.username && displayName !== user.username && (
                      <span className="ml-2 text-sm font-normal text-[#4BB6EE]">
                        @{user.username}
                      </span>
                    )}
                  </h1>
                </>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!loading && (
              <>
                <button className="p-2 rounded-full bg-[#001E33] hover:bg-[#022e45] border border-[#022e45]/60 text-[#4BB6EE] transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

               
              </>
            )}
          </div>
        </div>

        {/* Status bar - Optional */}
        {!loading && user?.kyc_status && (
          <div className="mt-4 pt-4 border-t border-[#022e45]/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-white/70">
              {user.kyc_status === 'approved' ? (
                <span className="text-green-400">✓ Your account is fully verified</span>
              ) : user.kyc_status === 'pending' ? (
                <span className="text-yellow-400">⟳ KYC verification in progress</span>
              ) : (
                <Link href="/kyc/onboarding/investor-type" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  ⚠ Complete your KYC verification
                </Link>
              )}
            </div>

            <div className="text-xs text-white/50">
              Last login: {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserProfileHeader;
