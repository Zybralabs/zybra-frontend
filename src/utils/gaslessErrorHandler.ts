import { WalletType } from "@/constant/account/enum";

/**
 * Utility to handle transaction errors for gasless (abstract wallet) users
 * Prevents showing "insufficient funds" modals when gas sponsorship is available
 */

export interface ErrorHandlerOptions {
  walletType: WalletType;
  isGasSponsored?: boolean;
  smartAccountAddress?: string;
  originalError: Error;
}

export interface ErrorHandlerResult {
  shouldShowFundingHelper: boolean;
  shouldShowErrorModal: boolean;
  errorTitle: string;
  errorMessage: string;
}

/**
 * Handles transaction errors with special logic for gasless transactions
 * @param options - Error handling configuration
 * @returns Error handling result with modal display decisions
 */
export function handleTransactionError(options: ErrorHandlerOptions): ErrorHandlerResult {
  const { walletType, isGasSponsored, smartAccountAddress, originalError } = options;
  const errorMessage = originalError.message || "Transaction failed";
  
  // Check if this is an abstract wallet user with gas sponsorship
  const isAbstractWalletUser = walletType === WalletType.MINIMAL;
  const hasGasSponsorship = isAbstractWalletUser && isGasSponsored;
  
  // Default result
  const result: ErrorHandlerResult = {
    shouldShowFundingHelper: false,
    shouldShowErrorModal: true,
    errorTitle: "Transaction Failed",
    errorMessage: errorMessage
  };

  // Handle user rejection - always show error modal regardless of wallet type
  if (errorMessage.includes("user rejected") ||
      errorMessage.includes("user denied") ||
      errorMessage.includes("user cancelled")) {
    result.errorTitle = "Transaction Cancelled";
    result.errorMessage = "Transaction was cancelled by user.";
    result.shouldShowErrorModal = true;
    result.shouldShowFundingHelper = false;
    return result;
  }

  // Handle insufficient funds errors
  const isInsufficientFundsError = 
    errorMessage.includes("insufficient funds") ||
    errorMessage.includes("sender balance and deposit together is 0") ||
    errorMessage.includes("insufficient balance") ||
    errorMessage.includes("not enough funds") ||
    errorMessage.includes("needs ETH for gas fees") ||
    errorMessage.includes("Send Base Sepolia ETH to:");

  if (isInsufficientFundsError) {
    // For abstract wallet users with gas sponsorship, this might be a different issue
    if (hasGasSponsorship) {
      // If gas is sponsored but still getting insufficient funds, it might be:
      // 1. Insufficient token balance (not gas)
      // 2. Gas sponsorship policy limits exceeded
      // 3. Network issues with gas manager
      
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        // This is specifically a gas fee issue, but user has sponsorship
        // For gasless users with active sponsorship, don't show blocking modals
        result.errorTitle = "Network Issue";
        result.errorMessage = "network_retry: Gas sponsorship temporarily unavailable. Please try again in a moment.";
        result.shouldShowErrorModal = false; // Don't show modal for gasless users
        result.shouldShowFundingHelper = false;
      } else if (errorMessage.includes("sender balance and deposit together is 0")) {
        // This is a gas-related error for gasless users with sponsorship
        result.errorTitle = "Network Issue";
        result.errorMessage = "network_retry: Gas sponsorship temporarily unavailable. Please try again in a moment.";
        result.shouldShowErrorModal = false; // Don't show modal for gasless users
        result.shouldShowFundingHelper = false;
      } else {
        // This might be insufficient token balance, not gas
        result.errorTitle = "Insufficient Balance";
        result.errorMessage = "You don't have enough tokens to complete this transaction.";
        result.shouldShowErrorModal = true;
        result.shouldShowFundingHelper = false;
      }
    } else {
      // Regular wallet or abstract wallet without gas sponsorship
      // Show funding helper
      result.shouldShowFundingHelper = true;
      result.shouldShowErrorModal = false;
      result.errorMessage = smartAccountAddress 
        ? `Your Account Kit smart wallet needs ETH for gas fees. Send Base Sepolia ETH to: ${smartAccountAddress} or switch to a Web3 wallet.`
        : "Your wallet needs ETH for gas fees.";
    }
    
    return result;
  }

  // For all other errors, show the error modal with the original message
  result.shouldShowErrorModal = true;
  result.shouldShowFundingHelper = false;
  return result;
}

/**
 * Simplified error handler for components that just need to know if they should show funding helper
 * @param walletType - User's wallet type
 * @param isGasSponsored - Whether gas is sponsored for this user
 * @param error - The error that occurred
 * @returns true if funding helper should be shown, false otherwise
 */
export function shouldShowFundingHelper(
  walletType: WalletType,
  isGasSponsored: boolean | undefined,
  error: Error
): boolean {
  const result = handleTransactionError({
    walletType,
    isGasSponsored,
    originalError: error
  });
  
  return result.shouldShowFundingHelper;
}

/**
 * Check if an error is related to gas fees specifically
 * @param error - The error to check
 * @returns true if the error is gas-related
 */
export function isGasRelatedError(error: Error): boolean {
  const errorMessage = error.message || "";
  
  return errorMessage.includes("needs ETH for gas fees") ||
         errorMessage.includes("Send Base Sepolia ETH to:") ||
         errorMessage.includes("insufficient funds") ||
         errorMessage.includes("sender balance and deposit together is 0") ||
         errorMessage.includes("gas");
}

/**
 * Check if user should be able to proceed with gasless transactions
 * @param walletType - User's wallet type
 * @param isGasSponsored - Whether gas sponsorship is active
 * @returns true if user can make gasless transactions
 */
export function canMakeGaslessTransactions(
  walletType: WalletType,
  isGasSponsored: boolean | undefined
): boolean {
  return walletType === WalletType.MINIMAL && isGasSponsored === true;
}
