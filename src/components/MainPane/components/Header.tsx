"use client";

import React from "react";
import { Copy, Link } from "lucide-react"; // For icons

const Header = () => {
  const walletAddress = "0xABC7514B1CE5144478BCDE57A4E24B939";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Address copied to clipboard!"); // Replace with a toast notification if needed
  };

  return (
    <div className="p-4 bg-[#0a192f] text-white rounded-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg font-semibold">
            C {/* Placeholder for avatar */}
          </div>

          {/* Profile Info */}
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>cryptotrqader42</span>
              <span className="text-yellow-400 cursor-pointer">✏️</span> {/* Edit icon */}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{walletAddress}</span>
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

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Connect Wallet Button */}
          <button className="flex items-center gap-2 px-6 py-2 bg-[#1e293b] text-gray-200 text-sm font-medium rounded-md hover:bg-[#273445]">
            <Link className="h-4 w-4" />
            Connect Wallet
          </button>

          {/* Deposit Button */}
          <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            Deposit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
