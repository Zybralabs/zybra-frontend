"use client";

import React, { useState } from "react";
import { Copy } from "lucide-react"; // For icons
import { DepositIcon, WithdrawIcon } from "@/components/Icons";
import { useUserAccount } from "@/context/UserAccountContext";
import { useRouter } from "next/navigation";
import WalletModal from "@/components/Modal/account-modal";
import { WalletType } from "@/constant/account/enum";

type HeaderProps = {
  showAddress?: boolean;
};

const WalletInfoHeader: React.FC<HeaderProps> = ({ showAddress = true }) => {
  // const {  } = useENSAddress(); // Disconnect function
  const { address, logout, user, walletType } = useUserAccount();
  const router = useRouter();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert("Address copied to clipboard!"); // Replace with a toast notification if needed
    }
  };
  const direct = () => {
    router.push("/signup");
  };
  return (
    <div className="py-4 text-white rounded-lg">
      {/* Header Section */}
      <WalletModal isOpen={isWalletModalOpen} setIsOpen={setIsWalletModalOpen} />
      <div className="flex items-center justify-between">
        {/* Profile Section */}
        {address && (
          <div className="flex items-center gap-4">
            {/* Profile Avatar */}
            <div
              className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg font-semibold"
              onClick={() => setIsWalletModalOpen(true)}
            >
              {address?.slice(0, 1).toUpperCase() || "C"}
            </div>

            {/* Profile Info */}
            <div>
              <div className="flex items-center gap-2 text-xl font-semibold">
                <span>
                  {walletType == WalletType.WEB3
                    ? address?.slice(0, 6) + "..." + address?.slice(-4)
                    : walletType == WalletType.MINIMAL
                      ? user.email?.slice(0, 6) + "..." + user.email?.slice(-4)
                      : "Wallet"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{address}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center p-1 rounded-md hover:bg-gray-700"
                  aria-label="Copy Address"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletInfoHeader;

//   <div className="flex gap-4">
//   {/* Connect/Disconnect Wallet Button */}
//   {!address ? (<button
//     onClick={() => direct()}
//     className="flex items-center gap-2 px-6 py-2.5 text-gray-200 font-medium rounded-xl hover:bg-[#273445]"
//   >
//     <WithdrawIcon />
//     Connect
//   </button>) : (
//     <button
//       onClick={() => logout()}
//       className="flex items-center gap-2 px-6 py-2.5 text-gray-200 font-medium rounded-xl hover:bg-[#273445]"
//     >
//       <WithdrawIcon />
//       Disconnect Wallet
//     </button>

//   )}
//   {/* Action Buttons */}
//   <div className="flex gap-4">
//     {/* Connect/Disconnect Wallet Button */}

//     {/* Deposit Button */}
//     <button className="flex items-center gap-2 px-6 py-2.5 bg-[#013853] text-white font-medium rounded-xl hover:bg-[#012b3f]">
//       <DepositIcon />
//       Deposit
//     </button>
//   </div>
// </div>
