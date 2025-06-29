# Enhanced Gas Sponsorship Integration

This document describes the comprehensive gas sponsorship integration using Alchemy's Gas Manager API for completely gasless smart account transactions.

## Overview

The enhanced gas sponsorship system provides:

1. **Automatic Gas Sponsorship**: Seamless integration with Alchemy Gas Manager
2. **Smart Fallback**: Automatic fallback to user-paid transactions when sponsorship fails
3. **Optimized Performance**: Efficient gas estimation and transaction preparation
4. **Complete Coverage**: Works across all transaction types (minting, lending, swapping, etc.)

## Architecture

### Core Components

1. **GasManagerService** (`src/services/gasManager.ts`)
   - Direct integration with Alchemy Gas Manager API
   - Handles `alchemy_requestGasAndPaymasterAndData` calls
   - Manages EntryPoint versions and dummy signatures

2. **useGasSponsorship Hook** (`src/hooks/useGasSponsorship.ts`)
   - React hook for gas sponsorship utilities
   - Provides transaction preparation and sponsorship checking
   - Handles both v0.6 and v0.7 EntryPoint versions

3. **Enhanced SmartAccountClientContext** (`src/context/SmartAccountClientContext.tsx`)
   - Integrated gas sponsorship into the main client context
   - Provides `executeTransaction`, `executeSponsoredTransaction`, and `canSponsorTransaction`
   - Automatic sponsorship detection and application

## Configuration

### Environment Variables

```env
# Required for gas sponsorship
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_BASE_GAS_MANAGER_POLICY_ID=your_policy_id
```

### Gas Manager Policy Setup

1. Create a Gas Manager Policy in Alchemy Dashboard
2. Configure spending rules and limits
3. Set the policy ID in environment variables
4. Ensure the policy covers your target chains

## Usage Examples

### Basic Sponsored Transaction

```typescript
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';

function MyComponent() {
  const { executeSponsoredTransaction, isGasSponsored } = useSmartAccountClientSafe();

  const handleTransaction = async () => {
    if (!isGasSponsored) {
      console.log('Gas sponsorship not available');
      return;
    }

    try {
      const result = await executeSponsoredTransaction({
        target: "0x...",
        data: "0x...",
        value: 0n,
      }, {
        entryPointVersion: '0.7',
        overrides: {
          callGasLimit: { multiplier: 1.2 },
          maxFeePerGas: { multiplier: 1.1 },
        },
      });
      
      console.log('Sponsored transaction successful:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
}
```

### Smart Transaction with Fallback

```typescript
import { useSmartAccountClientSafe } from '@/context/SmartAccountClientContext';

function SmartTransactionComponent() {
  const { 
    executeTransaction, 
    canSponsorTransaction, 
    isGasSponsored 
  } = useSmartAccountClientSafe();

  const handleSmartTransaction = async () => {
    const transactionData = {
      target: "0x..." as `0x${string}`,
      data: "0x..." as `0x${string}`,
      value: 0n,
    };

    try {
      // Check if sponsorship is available
      const canSponsor = await canSponsorTransaction(transactionData);
      
      if (canSponsor && isGasSponsored) {
        console.log('Using sponsored transaction');
      } else {
        console.log('Using regular transaction');
      }

      // executeTransaction automatically handles sponsorship
      const result = await executeTransaction(transactionData, {
        entryPointVersion: '0.7',
        overrides: {
          callGasLimit: { multiplier: 1.1 },
        },
      });
      
      console.log('Transaction successful:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
}
```

### Advanced Gas Sponsorship Information

```typescript
import { useGasSponsorship } from '@/hooks/useGasSponsorship';

function AdvancedGasInfo() {
  const { 
    getGasSponsorshipData, 
    shouldSponsorGas,
    isGasSponsorshipAvailable 
  } = useGasSponsorship();

  const checkSponsorshipDetails = async () => {
    if (!shouldSponsorGas || !isGasSponsorshipAvailable) {
      console.log('Gas sponsorship not available');
      return;
    }

    const transactionData = {
      target: "0x..." as `0x${string}`,
      data: "0x..." as `0x${string}`,
      value: 0n,
    };

    try {
      const sponsorshipData = await getGasSponsorshipData(
        transactionData,
        userAddress,
        {
          entryPointVersion: '0.7',
          overrides: {
            callGasLimit: { multiplier: 1.2 },
          },
        }
      );

      if (sponsorshipData.isSponsored) {
        console.log('Sponsorship Details:', {
          paymaster: sponsorshipData.paymaster,
          paymasterData: sponsorshipData.paymasterData,
          gasLimits: sponsorshipData.gasLimits,
          feeData: sponsorshipData.feeData,
        });
      }
    } catch (error) {
      console.error('Failed to get sponsorship data:', error);
    }
  };
}
```

## Integration in Existing Hooks

### Updated Transaction Hooks

All existing transaction hooks have been updated to use enhanced gas sponsorship:

- `useMintTransactions` - Automatic sponsorship for token minting
- `useLendingTransactions` - Sponsored lending operations
- `useCentrifugeVault` - Sponsored vault interactions
- `useSwapTransactions` - Sponsored token swaps

### Migration Guide

For existing components using transaction hooks:

1. **No changes required** - Enhanced sponsorship is automatic
2. **Optional**: Use new `executeSponsoredTransaction` for explicit sponsorship
3. **Optional**: Use `canSponsorTransaction` to check sponsorship availability

## Gas Manager API Integration

### Request Flow

1. **Transaction Preparation**: Encode transaction data
2. **Sponsorship Check**: Call `alchemy_requestGasAndPaymasterAndData`
3. **Response Processing**: Extract paymaster data and gas limits
4. **Transaction Execution**: Send UserOperation with sponsorship data

### Supported Features

- **EntryPoint v0.6 and v0.7**: Full support for both versions
- **Gas Estimation**: Automatic gas limit calculation with multipliers
- **Fee Optimization**: Dynamic fee adjustment based on network conditions
- **Error Handling**: Graceful fallback when sponsorship fails

### Gas Policy Configuration

```typescript
// Example policy configuration
{
  "rules": [
    {
      "type": "contract_method",
      "contract": "0x...", // Your contract address
      "method": "claimTokens", // Specific method
      "maxSpend": "0.01", // Max ETH per transaction
      "maxSpendPerDay": "0.1" // Daily limit
    }
  ],
  "sponsorshipPolicy": {
    "sponsorshipPercentage": 100, // 100% sponsorship
    "maxGasPrice": "50000000000" // 50 gwei max
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Policy Limit Exceeded**: User has exceeded daily/monthly limits
2. **Gas Price Too High**: Network congestion exceeds policy limits
3. **Contract Not Whitelisted**: Transaction target not in policy
4. **Insufficient Paymaster Balance**: Paymaster needs funding

### Error Recovery

```typescript
try {
  const result = await executeSponsoredTransaction(transactionData);
} catch (error) {
  if (error.message.includes('policy limit exceeded')) {
    // Show user-friendly message about limits
    showMessage('Daily gas limit reached. Transaction will use your ETH.');
    // Fallback to regular transaction
    const result = await executeTransaction(transactionData);
  } else if (error.message.includes('gas price too high')) {
    // Suggest waiting or using regular transaction
    showMessage('Network congestion detected. Try again later or pay gas fees.');
  }
}
```

## Performance Optimization

### Best Practices

1. **Batch Transactions**: Combine multiple operations when possible
2. **Gas Multipliers**: Use conservative multipliers (1.1-1.2x)
3. **Caching**: Cache sponsorship data for similar transactions
4. **Fallback Strategy**: Always have a fallback to user-paid transactions

### Monitoring

- Monitor gas sponsorship success rates
- Track policy limit usage
- Alert on paymaster balance low
- Monitor transaction failure rates

## Security Considerations

1. **Policy Limits**: Set appropriate spending limits
2. **Contract Whitelisting**: Only sponsor trusted contracts
3. **Method Filtering**: Restrict to specific contract methods
4. **Rate Limiting**: Implement per-user rate limits
5. **Monitoring**: Monitor for unusual spending patterns

## Troubleshooting

### Common Issues

1. **"Gas sponsorship not available"**
   - Check policy ID configuration
   - Verify API key is correct
   - Ensure user wallet type is MINIMAL

2. **"Policy limit exceeded"**
   - Check daily/monthly spending limits
   - Review policy configuration
   - Consider increasing limits

3. **"Transaction failed with sponsored gas"**
   - Check contract is whitelisted in policy
   - Verify gas limits are sufficient
   - Check paymaster balance

### Debug Mode

Enable debug logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Gas Sponsorship Debug:', {
    shouldSponsorGas,
    policyId,
    isGasSponsorshipAvailable,
    walletType,
  });
}
```

## Future Enhancements

1. **Multi-Chain Support**: Expand to more chains
2. **Dynamic Policies**: Runtime policy updates
3. **User Analytics**: Detailed sponsorship analytics
4. **Batch Operations**: Optimized batch transaction sponsorship
5. **Custom Paymasters**: Support for custom paymaster contracts
