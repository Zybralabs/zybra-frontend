"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  CircleAlert,
  X,
  ArrowLeft,
  Loader2,
  UserCheck,
  AtSign,
  UserCog
} from "lucide-react";
import { ExportAccountModal } from "./export-account-modal-new";
import { WalletType } from "@/constant/account/enum";
import { QRCodeCanvas } from "qrcode.react";
import { useUserAccount } from "@/context/UserAccountContext";
import { useBalance, useChainId } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/state/hooks";
import { useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { useStockIcon } from "@/hooks/useStockIcon";
import { SwarmIcon } from "../Icons/index";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fromWei } from "@/hooks/formatting";
import { ZFI_TOKEN_TESTNET, ZRUSD_TOKEN_TESTNET } from "@/state/stake/hooks";
import { Input } from "../Swap-new/components/input";
import { Label } from "../Swap-new/components/label";

interface WalletModalProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}

export default function WalletModal({ isOpen, setIsOpen }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState("assets");
  const { address, walletType, zfi_balance, logout, user, getKYCStatus,
    updateUserProfileInfo, isWalletInitialized, createAbstractWallet, exportAccount,
    isExportingAccount, ExportAccountComponent, alertModalOpenHandler } = useUserAccount();
  const router = useRouter();
  const { loading, swarmAssets } = useAppSelector((state) => state.application);
  const balance = useBalance({ address: address as `0x${string}` | undefined });
  const chainId = useChainId();
  const [balances, isLoadingTokenBalances] = useTokenBalancess(
    [ZRUSD_TOKEN_TESTNET.address,...swarmAssets.map((token) => token.address)],
    address
  );
  const totalList = [ ZRUSD_TOKEN_TESTNET,...swarmAssets];
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [KYCStatus, setKYCStatus] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInitializingWallet, setIsInitializingWallet] = useState(false);

  useEffect(() => {
    if (user) {
      const data = getKYCStatus();
      console.log({ data });
    }
  }, [user, getKYCStatus]);

  // Function to copy the address
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const gotoUser = () => {
    router.push("/userDashboard");
    setIsOpen(false);
  };

  const logOut = () => {
    logout();
    setIsOpen(false);
  };

  const handleInitializeWallet = async () => {
    try {
      setIsInitializingWallet(true);
      const result = await createAbstractWallet();

      if (result.success) {
        // Wallet initialized successfully
        console.log("Wallet initialized successfully:", result);
      } else {
        console.error("Failed to initialize wallet:", result.error);
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    } finally {
      setIsInitializingWallet(false);
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const ZfiIcon = useStockIcon("zfi");
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    username: '',
    first_name: '',
    last_name: ''
  });

  // Update profile form data when user changes
  useEffect(() => {
    if (user) {
      setProfileFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  // Add a profile edit button in the existing wallet card
  // Add this right after the address display buttons in the wallet card

  // Add this function to handle input changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Add this function to validate the form
  const validateProfileForm = () => {
    let valid = true;
    const newErrors = { username: '', first_name: '', last_name: '' };

    // Username validation
    if (profileFormData.username) {
      if (profileFormData.username.length < 3 || profileFormData.username.length > 30) {
        newErrors.username = 'Username must be between 3 and 30 characters';
        valid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(profileFormData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
        valid = false;
      }
    } else if (!profileFormData.first_name && !profileFormData.last_name) {
      // Only require username if nothing else is provided
      newErrors.username = 'At least one field is required';
      valid = false;
    }

    // First name validation - optional but if provided must not be too long
    if (profileFormData.first_name && profileFormData.first_name.length > 50) {
      newErrors.first_name = 'First name cannot exceed 50 characters';
      valid = false;
    }

    // Last name validation - optional but if provided must not be too long
    if (profileFormData.last_name && profileFormData.last_name.length > 50) {
      newErrors.last_name = 'Last name cannot exceed 50 characters';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  // Add this function to handle form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    // Only include fields that have values
    const dataToSubmit: {
      username?: string;
      first_name?: string;
      last_name?: string;
    } = {};

    if (profileFormData.username) dataToSubmit.username = profileFormData.username;
    if (profileFormData.first_name !== undefined) dataToSubmit.first_name = profileFormData.first_name;
    if (profileFormData.last_name !== undefined) dataToSubmit.last_name = profileFormData.last_name;

    // Don't submit if no changes were made
    if (
      (user?.username === profileFormData.username || !profileFormData.username) &&
      (user?.first_name === profileFormData.first_name || profileFormData.first_name === undefined) &&
      (user?.last_name === profileFormData.last_name || profileFormData.last_name === undefined)
    ) {
      // Show some kind of alert - you could use your alertModalOpenHandler here
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateUserProfileInfo(dataToSubmit);

      // Close the profile edit modal
      setIsProfileEditOpen(false);

      // Show success modal
      alertModalOpenHandler({
        isSuccess: true,
        title: "Profile Updated",
        message: "Your profile has been successfully updated!"
      });

      // Reload the page after a short delay to show the updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1500); // 1.5 seconds delay to allow the user to see the success message

    } catch (error) {
      console.error("Profile update error:", error);
      // Error notification is handled by the updateUserProfileInfo function
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log({isWalletInitialized},{walletType})
  return (
    <>
      {/* Main Wallet Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-0 bg-gradient-to-b from-[#001C29] to-[#00141d] border-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] sm:max-h-[95vh] flex flex-col">
          <header className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-[#0A3655]/50 flex-shrink-0">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Account</h2>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </header>

          <div className="p-3 sm:p-4 md:p-5 flex-1 overflow-y-auto">
            <AnimatePresence>
              {copySuccess && (
                <motion.div
                  className="absolute top-14 sm:top-16 right-3 sm:right-5 bg-[#002E47] text-white text-xs py-1 px-3 rounded-full z-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet Initialization Alert - Only show if wallet is not initialized */}
            {!isWalletInitialized && walletType === WalletType.MINIMAL && (
              <motion.div
                className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CircleAlert className="h-3.5 w-3.5 mr-2 text-blue-600 flex-shrink-0" />
                <span className="flex-grow text-xs sm:text-sm">Initialize your wallet to use all features</span>
                <Button
                  onClick={handleInitializeWallet}
                  disabled={isInitializingWallet}
                  className="text-blue-700 font-medium hover:text-blue-800 transition-colors whitespace-nowrap ml-2 h-6 sm:h-7 px-2 text-xs bg-blue-100 hover:bg-blue-200 border-0"
                >
                  {isInitializingWallet ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Initializing...</span>
                      <span className="sm:hidden">Init...</span>
                    </>
                  ) : (
                    "Initialize"
                  )}
                </Button>
              </motion.div>
            )}

            {/* Wallet Export Option - Only show if wallet is initialized and is an abstraction wallet */}
            {isWalletInitialized && walletType === WalletType.MINIMAL && (
              <motion.div
                className="w-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <UserCog className="h-3.5 w-3.5 mr-2 text-green-600 flex-shrink-0" />
                <span className="flex-grow text-xs sm:text-sm">Export your wallet to backup your account</span>
                <Button
                  onClick={() => setIsExportModalOpen(true)}
                  className="text-green-700 font-medium hover:text-green-800 transition-colors whitespace-nowrap ml-2 h-6 sm:h-7 px-2 text-xs bg-green-100 hover:bg-green-200 border-0"
                >
                  Export
                </Button>
              </motion.div>
            )}

            {/* KYC Alert */}
            <motion.div
              className="w-full bg-gradient-to-r from-amber-100 to-yellow-100 text-yellow-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CircleAlert className="h-3.5 w-3.5 mr-2 text-amber-600 flex-shrink-0" />
              <span className="flex-grow text-xs sm:text-sm">Add KYC</span>
              <Link
                href="/kyc/onboarding/investor-type"
                onClick={() => setIsOpen(false)}
                className="text-amber-700 font-medium hover:text-amber-800 transition-colors whitespace-nowrap ml-2 text-xs sm:text-sm"
              >
                Go Here
              </Link>
            </motion.div>

            {/* Wallet Card */}
            <motion.div
              className="bg-gradient-to-b from-[#002235] to-[#001824] text-white border border-[#003553]/30 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Decorative elements */}
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-xl"></div>
              <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-gradient-to-tr from-indigo-500/10 to-blue-500/5 rounded-full blur-xl"></div>

              {/* User Display Name Component */}
              <motion.div
                className="flex items-center mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="w-full bg-gradient-to-r from-[#002438] to-[#001824] border border-[#003553]/50 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-300" onClick={() => setIsProfileEditOpen(true)}>
                  {/* Subtle background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mr-2 sm:mr-3">
                    <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400"  />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    {user?.username || user?.first_name || user?.last_name ? (
                      <>
                        <p className="text-xs text-blue-400 font-medium">
                          {user?.username ? `@${user.username}` : ''}
                        </p>
                        <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent truncate">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.first_name || user?.last_name || 'Anonymous User'}
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <p className="text-xs sm:text-sm font-medium text-white/80">
                          Set up your profile
                        </p>
                        <p className="text-xs text-blue-400/70">
                          Add your name or username
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full hover:bg-[#002E47]/60 ml-1"
                    onClick={() => setIsProfileEditOpen(true)}
                  >
                    <UserCog className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                </div>
              </motion.div>

              {/* Address bar */}
              <div className="flex justify-between items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                <div className="flex items-center bg-[#001824]/80 border border-[#003553]/40 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex-1 backdrop-blur-sm">
                  <span role="img" aria-label="fox" className="mr-1.5 sm:mr-2 text-sm sm:text-base">
                    🦊
                  </span>
                  <span className="text-xs sm:text-sm text-white/90 font-medium truncate max-w-[100px] sm:max-w-[130px] md:max-w-[180px]">
                    {formatAddress(address)}
                  </span>
                </div>

                <div className="flex gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60"
                    onClick={gotoUser}
                  >
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60 touch-action-manipulation"
                    onClick={() => {
                      console.log("Logout triggered");
                      logout();
                      setIsOpen(false);
                    }}
                    aria-label="Logout"
                    role="button"
                    tabIndex={0}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-blue-400 sm:w-4 sm:h-4"
                    >
                      <path
                        d="M17.707 8.464L20.535 11.293C20.723 11.481 20.827 11.735 20.827 12C20.827 12.265 20.723 12.52 20.535 12.707L17.707 15.536C17.519 15.724 17.265 15.829 17 15.829C16.735 15.829 16.48 15.723 16.293 15.536C16.105 15.348 16 15.093 16 14.828C16 14.563 16.105 14.309 16.293 14.121L17.414 13H12C11.735 13 11.48 12.895 11.293 12.707C11.105 12.52 11 12.265 11 12C11 11.735 11.105 11.48 11.293 11.293C11.48 11.105 11.735 11 12 11H17.414L16.293 9.879C16.105 9.691 16 9.437 16 9.172C16 8.907 16.105 8.652 16.293 8.465C16.48 8.277 16.734 8.171 17 8.171C17.265 8.171 17.519 8.276 17.707 8.464Z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 3C12.255 3 12.5 3.098 12.685 3.273C12.871 3.448 12.982 3.687 12.997 3.941C13.012 4.196 12.929 4.446 12.766 4.642C12.602 4.837 12.37 4.963 12.117 4.993L12 5H7C6.755 5 6.519 5.09 6.336 5.253C6.153 5.415 6.036 5.64 6.007 5.883L6 6V18C6 18.245 6.09 18.481 6.253 18.664C6.415 18.847 6.64 18.964 6.883 18.993L7 19H11.5C11.755 19 12 19.098 12.185 19.273C12.371 19.448 12.482 19.687 12.497 19.941C12.512 20.196 12.429 20.446 12.266 20.642C12.102 20.837 11.87 20.963 11.617 20.993L11.5 21H7C6.235 21 5.498 20.708 4.942 20.183C4.385 19.658 4.05 18.94 4.005 18.176L4 18V6C4 5.235 4.292 4.498 4.817 3.942C5.342 3.385 6.06 3.05 6.824 3.005L7 3H12Z"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm text-white/60 mb-0.5 sm:mb-1">Balance</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {fromWei(balance?.data?.value ?? 0n) || "0"} {balance?.data?.symbol || "ETH"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-8 sm:h-9 md:h-10 text-xs sm:text-sm shadow-md shadow-blue-800/10 transition-all duration-300"
                  onClick={() => {
                    router.push('swap?tab=buy');
                    setIsOpen(false);
                  }}
                >
                  <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Buy</span>
                  <span className="sm:hidden">Buy</span>
                </Button>
                <Button
                  className="flex-1 bg-[#001A26] hover:bg-[#002235] text-white border border-[#003553]/50 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  onClick={() => setIsReceiveOpen(true)}
                >
                  <ArrowDownLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Receive</span>
                  <span className="sm:hidden">Get</span>
                </Button>
                <Button
                  className="flex-1 bg-[#001A26] hover:bg-[#002235] text-white/50 border border-[#003553]/50 h-8 sm:h-9 md:h-10 text-xs sm:text-sm cursor-not-allowed"
                  disabled
                >
                  <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="relative flex-shrink-0">
            {/* Tab Headers */}
            <div className="border-b border-[#003553]/50 relative">
              <motion.div
                className="absolute bottom-0 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400"
                style={{
                  width: "50%",
                  left: activeTab === "assets" ? "0%" : "50%",
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="flex w-full">
                <button
                  onClick={() => setActiveTab("assets")}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 text-center transition-colors text-xs sm:text-sm md:text-base font-medium ${
                    activeTab === "assets"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Assets
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 text-center transition-colors text-xs sm:text-sm md:text-base font-medium ${
                    activeTab === "history"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[30vh] sm:max-h-[35vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "assets" ? (
                  <motion.div
                    key="assets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 md:space-y-3"
                  >
                    {/* ZFI Token */}
                    <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-[#001824]/80 border border-[#003553]/30 hover:border-[#0066A1]/40 transition-all duration-200 hover:shadow-sm hover:shadow-[#0066A1]/10">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-[#001520] border border-[#003553]/50 flex items-center justify-center">
                          {ZfiIcon ? <ZfiIcon /> : <SwarmIcon />}
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-xs sm:text-sm md:text-base">Zybra Finance Token</h3>
                          <p className="text-xs text-zinc-500">
                            {zfi_balance?.toString() ?? "10"} ZFI · All networks
                          </p>
                        </div>
                      </div>
                      <div className="text-white font-medium text-xs sm:text-sm md:text-base">
                        {zfi_balance?.toString() ?? "10"}
                      </div>
                    </div>

                    {/* Other Assets */}
                    {totalList &&
                      totalList.map((token, index) => {
                        const Symbol = useStockIcon(token.symbol);
                        const tokenBalance = typeof balances === 'object' ? fromWei(balances[token.address] ?? 0) : 0;

                        return (
                          <motion.div
                            key={`${token.symbol}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: { delay: 0.05 * (index + 1) }
                            }}
                            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#001824]/80 border border-[#003553]/30 hover:border-[#0066A1]/40 transition-all duration-200 hover:shadow-sm hover:shadow-[#0066A1]/10"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#001520] border border-[#003553]/50 flex items-center justify-center">
                                {Symbol ? <Symbol /> : <SwarmIcon />}
                              </div>
                              <div>
                                <h3 className="font-medium text-white text-sm sm:text-base">{token.name}</h3>
                                <p className="text-xs sm:text-sm text-zinc-500">
                                  {tokenBalance} {token.symbol} · {token.networks} networks
                                </p>
                              </div>
                            </div>
                            <div className="text-white font-medium text-sm sm:text-base">
                              ${tokenBalance.toString()}
                            </div>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2
                            }}
                          />
                          <div className="w-10 sm:w-12 h-0.5 bg-[#0A3655]" />
                          <motion.div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-cyan-500 rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              delay: 1
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-xs sm:text-sm">No transactions found</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Crypto Modal */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-3 sm:p-4 md:p-5 bg-[#001A26] border border-[#0A3655]/30 rounded-xl shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
            <h2 className="text-sm sm:text-base md:text-lg font-medium text-white">
              Receive Crypto
            </h2>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsReceiveOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>

          <AnimatePresence>
            {copySuccess && (
              <motion.div
                className="absolute top-16 right-5 bg-[#002E47] text-white text-xs py-1 px-3 rounded-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Copied!
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!showQRCode ? (
              <motion.div
                key="receive-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Fund your wallet by transferring crypto from another wallet or account.
                </p>

                <div className="bg-[#001A26] rounded-xl p-2.5 sm:p-3 border border-[#003553]/40 w-full h-12 sm:h-14 flex items-center">
                  <div className="flex items-center w-full max-w-full">
                    <div className="flex items-center flex-1 min-w-0 mr-1 sm:mr-2">
                      <span className="text-green-400 flex-shrink-0 mr-1.5 sm:mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-4 sm:h-4">
                          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="currentColor" opacity="0.2" />
                          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="currentColor" />
                        </svg>
                      </span>
                      <span className="text-xs sm:text-sm text-white font-medium truncate block max-w-[150px] sm:max-w-[230px]">
                        {address}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-[#002E47]/60"
                        onClick={handleCopyAddress}
                      >
                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-[#002E47]/60"
                        onClick={() => setShowQRCode(true)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400 sm:w-4 sm:h-4">
                          <path d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" fill="currentColor" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
                  <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                    <span className="text-blue-400 mr-2">Tip:</span>
                    Make sure you&apos;re sending assets on the correct network to avoid loss of funds.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="qr-code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center py-3 sm:py-5 space-y-4 sm:space-y-6"
              >
                <div className="p-3 sm:p-4 bg-white rounded-xl shadow-lg relative">
                  {/* Decorative elements for QR code */}
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-xl blur-sm -z-10"></div>
                  <QRCodeCanvas
                    value={address || ""}
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : window.innerWidth < 768 ? 160 : 200}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    className="rounded-lg"
                    level="H"
                  />
                </div>

                <div className="w-full">
                  <div className="bg-[#001A26] rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 border border-[#003553]/40 w-full overflow-hidden">
                    <p className="text-[10px] sm:text-xs text-white/90 text-center font-medium break-all max-w-full">
                      {address}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-400 text-center mb-4 sm:mb-5">
                    Scan this code with a wallet app to send tokens to this address
                  </p>

                  <Button
                    variant="outline"
                    className="text-gray-400 hover:text-white hover:bg-[#002E47]/60 border-[#003553]/50 mx-auto flex items-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200"
                    onClick={() => setShowQRCode(false)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    Back
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-3 sm:p-4 md:p-5 bg-gradient-to-b from-[#001C29] to-[#00141d] border border-[#0A3655]/30 rounded-xl shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
            <h2 className="text-sm sm:text-base md:text-lg font-medium text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {user?.username ? 'Edit Profile' : 'Set Up Your Profile'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsProfileEditOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-xs sm:text-sm text-white/80">Username</Label>
                {formErrors.username && (
                  <span className="text-red-400 text-xs">{formErrors.username}</span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  value={profileFormData.username}
                  onChange={handleProfileInputChange}
                  placeholder="Choose a unique username"
                  className={`bg-[#001824]/80 border ${formErrors.username ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                  disabled={isSubmitting}
                />
                <AtSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              </div>
            </div>

            {/* First Name Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="first_name" className="text-xs sm:text-sm text-white/80">First Name</Label>
                {formErrors.first_name && (
                  <span className="text-red-400 text-xs">{formErrors.first_name}</span>
                )}
              </div>
              <Input
                id="first_name"
                name="first_name"
                value={profileFormData.first_name}
                onChange={handleProfileInputChange}
                placeholder="Enter your first name"
                className={`bg-[#001824]/80 border ${formErrors.first_name ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                disabled={isSubmitting}
              />
            </div>

            {/* Last Name Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="last_name" className="text-xs sm:text-sm text-white/80">Last Name</Label>
                {formErrors.last_name && (
                  <span className="text-red-400 text-xs">{formErrors.last_name}</span>
                )}
              </div>
              <Input
                id="last_name"
                name="last_name"
                value={profileFormData.last_name}
                onChange={handleProfileInputChange}
                placeholder="Enter your last name"
                className={`bg-[#001824]/80 border ${formErrors.last_name ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                disabled={isSubmitting}
              />
            </div>

            {/* Info banner */}
            <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
              <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                <span className="text-blue-400 mr-2">Note:</span>
                Setting up your profile helps us personalize your experience and allows others to recognize you in the Zybra ecosystem.
              </p>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-9 sm:h-10 text-xs sm:text-sm shadow-md shadow-blue-800/10 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {user?.username ? 'Update Profile' : 'Save Profile'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Account Modal */}
      <ExportAccountModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
}