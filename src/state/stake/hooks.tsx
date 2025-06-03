import { useMemo } from "react";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import JSBI from "jsbi";
import { SupportedChainId, ZFI, ZrUSD } from "@/constant/addresses";
import { useZRUSDStaking } from "@/hooks/useStaking";

export const ZFI_TOKEN_MAINNET = new Token(
  SupportedChainId.Base_Mainnet,
  ZFI[SupportedChainId.Base_Mainnet],
  18,
  "ZFI",
  "Zybra Finance Token",
);
export const ZFI_TOKEN_TESTNET = new Token(
  SupportedChainId.Testnet,
  ZFI[SupportedChainId.Testnet],
  18,
  "ZFI",
  "Zybra Finance Token",
);
export const ZRUSD_TOKEN_TESTNET = new Token(
  SupportedChainId.Testnet,
  ZrUSD[SupportedChainId.Testnet],
  18,
  "ZRUSD",
  "Zybra USD",
);
const STAKING_REWARDS_INFO: {
  [chainId in SupportedChainId]?: { token: Token; stakingRewardAddress: string };
} = {
  [SupportedChainId.Base_Mainnet]: {
    token: ZFI_TOKEN_MAINNET,
    stakingRewardAddress: "0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711",
  },
  [SupportedChainId.Testnet]: {
    token: ZFI_TOKEN_TESTNET,
    stakingRewardAddress: "0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711",
  },
  [SupportedChainId.Mainnet]: {
    token: ZFI_TOKEN_TESTNET,
    stakingRewardAddress: "0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711",
  },
  [SupportedChainId.Polygon_Mainnet]: {
    token: ZFI_TOKEN_TESTNET,
    stakingRewardAddress: "0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711",
  },
};

interface StakingInfo {
  stakingRewardAddress: string;
  token: any;
  stakedAmount: string;
  earnedAmount: string;
  totalStakedAmount: string;
  totalRewardRate: string;
  active: boolean;
}

// Fetch staking info for a single-token staking setup
export function useStakingInfo(chainId: SupportedChainId): StakingInfo | null {
  const stakingInfo = STAKING_REWARDS_INFO[chainId];
  if (!stakingInfo) return null;

  const { token, stakingRewardAddress } = stakingInfo;

  const { pendingReward, totalStaked, totalProfitDistributed } =
    useZRUSDStaking(stakingRewardAddress, chainId);

  const active = useMemo(() => {
    // Custom logic to determine if staking is active
    return true; // Assuming it's always active
  }, []);

  const stakedAmount = useMemo(() => {
    if (!totalStaked) return "0";
    const value = (totalStaked as any)?.result ?? 0;
    return CurrencyAmount.fromRawAmount(token, JSBI.BigInt(value)).toSignificant(5);
  }, [token, totalStaked]);

  const earnedAmount = useMemo(() => {
    if (!pendingReward || !("result" in pendingReward)) return "0";
    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.BigInt(pendingReward.result ?? 0),
    ).toSignificant(5);
  }, [token, pendingReward]);

  const totalStakedAmount = useMemo(() => {
    if (!totalStaked || !("result" in totalStaked)) return "0";
    return CurrencyAmount.fromRawAmount(token, JSBI.BigInt(totalStaked?.result ?? 0)).toSignificant(
      5,
    );
  }, [token, totalStaked]);

  const totalRewardRate = useMemo(() => {
    if (!totalProfitDistributed || !("result" in totalProfitDistributed)) return "0";
    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.BigInt(totalProfitDistributed?.result ?? 0),
    ).toSignificant(5);
  }, [token, totalProfitDistributed]);

  return {
    stakingRewardAddress,
    token,
    stakedAmount,
    earnedAmount,
    totalStakedAmount,
    totalRewardRate,
    active,
  };
}
