"use client";

import React, { useState } from "react";
import { Copy, Link } from "lucide-react"; // For icons

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUserAccount } from "@/context/UserAccountContext";
import { useRouter } from "next/navigation";

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div>
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    style={{
                      backgroundColor: "#F44336",
                      color: "white",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{
                      backgroundColor: "#1D4ED8", // Darker blue for a polished look
                      color: "white",
                      padding: "10px",
                      borderRadius: "50%", // Makes the button round
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow
                    }}
                    aria-label="Change Network"
                  >
                    {chain.iconUrl ? (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name}
                        style={{ width: "24px", height: "24px", borderRadius: "50%" }} // Ensures icon is round
                      />
                    ) : (
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                        {chain.name?.[0]}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

const Header = () => {
  const { address: walletAddress, user } = useUserAccount();
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useRouter();

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setModalVisible(true);

      // Auto-hide the modal after 3 seconds
      setTimeout(() => setModalVisible(false), 3000);
    }
  };

  const handleClick = () => {
    navigate.push("/userDashboard");
  };
  return (
    <div className="p-4 bg-[#0a192f] text-white rounded-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg font-semibold">
            {user?.first_name?.charAt(0).toUpperCase() || "U"}
          </div>

          {/* Profile Info */}
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold" onClick={handleClick}>
              <span>{user?.first_name || "Anonymous"}</span>
              <span className="text-yellow-400 cursor-pointer">✏️</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{walletAddress || "No wallet connected"}</span>
              {walletAddress && (
                <button
                  onClick={handleCopy}
                  className="flex items-center p-1 rounded-md hover:bg-gray-700"
                  aria-label="Copy Address"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Connect Wallet Button */}
          <CustomConnectButton />

          {/* Deposit Button */}
          {walletAddress && (
            <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
              Deposit
            </button>
          )}
        </div>
      </div>

      {/* Copy Modal */}
      {modalVisible && (
        <div
          className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-md flex items-center"
          role="alert"
        >
          <span className="text-sm">Wallet address copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};

export default Header;
