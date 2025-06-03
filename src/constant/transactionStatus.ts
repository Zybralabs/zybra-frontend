/**
 * Transaction status constants for the application
 * Used to standardize transaction status values across the application
 */

export const TransactionStatus = Object.freeze({
  APPROVAL: "approval",
  DEPOSIT_STAKING: "stake",
  WITHDRAW_STAKING: "unstake",
  COLLECT_FEES_STAKING: "withdrawReward",
  DEPOSIT: "deposit",
  REQUEST_DEPOSIT: "requestDeposit",
  WITHDRAW: "withdraw",
  REQUEST_WITHDRAW: "requestWithdraw",
  CANCEL_WITHDRAW_REQUEST: "cancelWithdrawRequest",
  CANCEL_DEPOSIT_REQUEST: "cancelDepositRequest",
  CLAIM_WITHDRAW: "claim-withdraw",
  REPAY_DEBT: "repay-debt",
  LIQUIDATION: "liquidation",
  MAKE_OFFER: "make-offer",
  TAKE_OFFER: "take-offer",
  WITHDRAW_OFFER: "withdraw-offer",
  CLAIM_OFFER: "claim-offer",
  CANCEL_OFFER: "cancel-offer",
  MINT_ZRUSD: "mint-zrusd",
  COLLECT_FEES: "collect-fees",
  COMPLETED: "completed", // Added for transaction completion
  SUPPLY: "supply", // Added for supply transactions
  BORROW: "borrow", // Added for supply transactions
  PENDING: "PENDING", // Added for pending transactions
  COMPLETED_STATUS: "COMPLETED", // Added for completed transactions
});

/**
 * Color mapping for transaction statuses
 * Each status has a text color and background color for UI display
 */
export const TransactionStatusColors = {
  // Original statuses
  [TransactionStatus.APPROVAL]: { text: "#FFD700", bg: "#423600" },         // Gold
  [TransactionStatus.DEPOSIT_STAKING]: { text: "#00F8DA", bg: "#033F43" },  // Cyan
  [TransactionStatus.WITHDRAW_STAKING]: { text: "#FF9900", bg: "#442200" }, // Orange
  [TransactionStatus.COLLECT_FEES_STAKING]: { text: "#00FF00", bg: "#004400" }, // Green
  [TransactionStatus.DEPOSIT]: { text: "#00F8DA", bg: "#033F43" },          // Cyan
  [TransactionStatus.REQUEST_DEPOSIT]: { text: "#BB86FC", bg: "#2E1F42" },  // Purple
  [TransactionStatus.WITHDRAW]: { text: "#FF6B6B", bg: "#4A0F0F" },         // Red
  [TransactionStatus.REQUEST_WITHDRAW]: { text: "#FF69B4", bg: "#4A0F2F" }, // Pink
  [TransactionStatus.CANCEL_WITHDRAW_REQUEST]: { text: "#FF4500", bg: "#3D1100" }, // Orange Red
  [TransactionStatus.CANCEL_DEPOSIT_REQUEST]: { text: "#FF4500", bg: "#3D1100" }, // Orange Red
  [TransactionStatus.CLAIM_WITHDRAW]: { text: "#32CD32", bg: "#0B3B0B" },   // Lime Green
  [TransactionStatus.REPAY_DEBT]: { text: "#1E90FF", bg: "#0A2A4A" },       // Dodger Blue
  [TransactionStatus.LIQUIDATION]: { text: "#DC143C", bg: "#4A0000" },      // Crimson
  [TransactionStatus.MAKE_OFFER]: { text: "#DDA0DD", bg: "#2F1F2F" },       // Plum
  [TransactionStatus.TAKE_OFFER]: { text: "#98FB98", bg: "#1F3F1F" },       // Pale Green
  [TransactionStatus.WITHDRAW_OFFER]: { text: "#FF69B4", bg: "#4A0F2F" },   // Hot Pink
  [TransactionStatus.CLAIM_OFFER]: { text: "#00CED1", bg: "#0A3F3F" },      // Dark Turquoise
  [TransactionStatus.CANCEL_OFFER]: { text: "#FF6347", bg: "#4A1F1F" },     // Tomato
  [TransactionStatus.MINT_ZRUSD]: { text: "#7B68EE", bg: "#1F1F3F" },       // Medium Slate Blue
  [TransactionStatus.COLLECT_FEES]: { text: "#20B2AA", bg: "#0A3F3F" },     // Light Sea Green
  
  // New statuses
  [TransactionStatus.COMPLETED]: { text: "#32CD32", bg: "#0B3B0B" },        // Lime Green
  [TransactionStatus.SUPPLY]: { text: "#00F8DA", bg: "#033F43" },           // Cyan (similar to deposit)
  [TransactionStatus.BORROW]: { text: "#00000", bg: "#4A0F2F" },           // Cyan (similar to deposit)
  [TransactionStatus.PENDING]: { text: "#FFD700", bg: "#423600" },          // Gold (similar to approval)
  [TransactionStatus.COMPLETED_STATUS]: { text: "#32CD32", bg: "#0B3B0B" }, // Lime Green (same as completed)
};

/**
 * Get color for a transaction status
 * @param status The transaction status
 * @returns Object with text and background colors, or default colors if status not found
 */

export const getTransactionStatusColors = (status: string) => {
  return TransactionStatusColors[status as keyof typeof TransactionStatusColors] || { text: "#FFFFFF", bg: "#000000" }; // Default colors
};

