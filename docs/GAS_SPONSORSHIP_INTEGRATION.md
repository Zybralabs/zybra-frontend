# Gas Sponsorship Integration with Alchemy Gas Manager

This document outlines the complete integration of Alchemy's Gas Manager for sponsoring transaction fees for Account Kit (abstraction wallet) users.

## 🎯 Overview

The gas sponsorship feature automatically covers transaction fees for users who authenticate via:
- Email OTP
- Google OAuth  
- Apple OAuth
- Other Account Kit authentication methods

Web3 wallet users continue to pay their own gas fees as usual.

## 🏗️ Architecture

### Components

1. **`useGasSponsoredClient`** - Custom hook that provides gas-sponsored smart account clients
2. **Gas Manager Policies** - Alchemy policies that define sponsorship rules
3. **Environment Configuration** - Policy IDs for different chains
4. **Enhanced UI Components** - Show gas sponsorship status to users

### Flow

```
User Authentication → Wallet Type Detection → Gas Sponsorship Decision → Transaction Execution
```

## 🔧 Setup Instructions

### 1. Create Gas Manager Policies

Visit [Alchemy Gas Manager Dashboard](https://dashboard.alchemy.com/gas-manager/policy/create) and create policies for each chain:

#### Policy Configuration Recommendations:
- **Spending Rules**: Set daily/monthly limits based on your budget
- **Allowlist**: Leave empty for public access or add specific addresses
- **Blocklist**: Add any addresses you want to exclude
- **Policy Duration**: Set appropriate expiry (e.g., 1 year)

### 2. Environment Variables

Add the following to your `.env.local` file:

```bash
# Alchemy Gas Manager Policy IDs
NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID="your-base-sepolia-policy-id"
NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID="your-ethereum-sepolia-policy-id"  
NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID="your-arbitrum-sepolia-policy-id"
```

### 3. Verify Configuration

Run the test utility to verify your setup:

```typescript
import { runGasSponsorshipTests } from '@/utils/gasSponsorshipTest';

// In development console
runGasSponsorshipTests();
```

## 📝 Usage

### Basic Usage

Replace existing `useSmartAccountClient` calls with `useGasSponsoredClient`:

```typescript
// Before
const { client } = useSmartAccountClient({ type: accountType });

// After  
const { client, isGasSponsored } = useGasSponsoredClient();
```

### Advanced Usage

```typescript
import { useGasSponsoredTransactions } from '@/hooks/useGasSponsoredClient';

function MyComponent() {
  const { executeTransaction, isGasSponsored } = useGasSponsoredTransactions();
  
  const handleTransaction = async () => {
    try {
      const result = await executeTransaction({
        target: "0x...",
        data: "0x...",
        value: 0n,
      });
      
      console.log("Transaction successful:", result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  
  return (
    <div>
      <p>Gas Sponsored: {isGasSponsored ? "Yes" : "No"}</p>
      <button onClick={handleTransaction}>Execute Transaction</button>
    </div>
  );
}
```

## 🔍 How It Works

### 1. Wallet Type Detection

The system automatically detects the wallet type:
- **Account Kit wallets** (`WalletType.MINIMAL`) → Gas sponsorship enabled
- **Web3 wallets** (`WalletType.WEB3`) → User pays gas fees

### 2. Policy ID Resolution

Based on the current chain, the appropriate policy ID is selected:

```typescript
function getGasManagerPolicyId(chainId: number): string | undefined {
  switch (chainId) {
    case SupportedChainId.Testnet: // Base Sepolia
      return process.env.NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID;
    case SupportedChainId.Mainnet: // Ethereum Sepolia  
      return process.env.NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID;
    // ... other chains
  }
}
```

### 3. Smart Account Client Configuration

The client is configured with the policy ID when gas sponsorship is enabled:

```typescript
const { client } = useSmartAccountClient({
  type: accountType,
  opts: {
    txMaxRetries: 20,
    txRetryIntervalMs: 2000,
    ...(shouldSponsorGas && policyId && {
      policyId: policyId,
    }),
  },
});
```

## 🎨 UI Integration

### Gas Sponsorship Status

The `FundingHelper` component now shows gas sponsorship status:

```typescript
{isGasSponsored ? (
  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
    <Shield className="h-5 w-5 text-green-400" />
    <h4>Gas Fees Sponsored</h4>
    <p>Your transactions are sponsored by Alchemy Gas Manager.</p>
  </div>
) : (
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
    <AlertCircle className="h-5 w-5 text-yellow-400" />
    <h4>ETH Required for Gas</h4>
    <p>Your wallet needs ETH to pay for transaction gas fees.</p>
  </div>
)}
```

### Transaction Logging

Enhanced logging shows gas sponsorship status:

```typescript
console.log("Account Kit transaction details:", {
  smartAccountAddress: client.account.address,
  contractAddress,
  isGasSponsored,
  gasSponsorshipInfo: isGasSponsored 
    ? "✅ Gas fees sponsored by Alchemy Gas Manager" 
    : "❌ User pays gas fees",
});
```

## 🚨 Error Handling

### Common Issues

1. **Policy Not Found**: Ensure policy IDs are correctly set in environment variables
2. **Policy Limits Exceeded**: Check spending limits in Alchemy dashboard
3. **Invalid Policy**: Verify policy is active and not expired

### Fallback Behavior

If gas sponsorship fails, the system gracefully falls back to user-paid transactions (when implemented).

## 📊 Monitoring

### Policy Usage

Monitor policy usage in the [Alchemy Gas Manager Dashboard](https://dashboard.alchemy.com/gas-manager):
- Transaction count
- Gas spent
- Remaining budget
- Policy performance

### Logging

The integration provides comprehensive logging:
- Gas sponsorship status per transaction
- Policy ID usage
- Error conditions
- Fallback scenarios

## 🔒 Security Considerations

1. **Policy Limits**: Set appropriate spending limits to prevent abuse
2. **Allowlists**: Consider using allowlists for production environments
3. **Monitoring**: Regularly monitor policy usage and costs
4. **Rotation**: Rotate policy IDs periodically for security

## 🚀 Deployment

### Environment Setup

Ensure all environment variables are set in your deployment environment:

```bash
# Production
NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID="prod-base-policy-id"
NEXT_PUBLIC_SEPOLIA_GAS_MANAGER_POLICY_ID="prod-sepolia-policy-id"
NEXT_PUBLIC_ARBITRUM_GAS_MANAGER_POLICY_ID="prod-arbitrum-policy-id"
```

### Testing

1. Test with Account Kit wallets to verify gas sponsorship
2. Test with Web3 wallets to ensure normal gas payment
3. Monitor policy usage during testing
4. Verify error handling and fallbacks

## 📈 Benefits

### For Users
- **Zero Gas Fees**: Account Kit users don't need ETH for transactions
- **Better UX**: Seamless transaction experience
- **Lower Barrier**: Easier onboarding for new users

### For Platform
- **Increased Adoption**: Lower friction for user onboarding
- **Better Retention**: Users more likely to complete transactions
- **Competitive Advantage**: Superior UX compared to traditional dApps

## 🔗 Resources

- [Alchemy Gas Manager Documentation](https://docs.alchemy.com/docs/gas-manager-services)
- [Account Kit Documentation](https://accountkit.alchemy.com/)
- [Gas Manager Dashboard](https://dashboard.alchemy.com/gas-manager)
- [Policy Creation Guide](https://docs.alchemy.com/docs/setup-a-gas-manager-policy)
