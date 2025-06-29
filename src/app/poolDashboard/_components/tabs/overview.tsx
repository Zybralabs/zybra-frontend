import React, { useEffect, useMemo, useState } from "react";
import OverviewChart from "@/components/OverviewChart";
import { BaseChainIcon, ChevronRight, NetworkIcon } from "@/components/Icons";
import { formatBalanceAbbreviated, useCentrifuge } from "@centrifuge/centrifuge-react";
// import {  NetworkIcon } from '@centrifuge/centrifuge-react'
import Link from "next/link";
import {
  Card,
  IconArrowRightWhite,
  IconMoody,
  IconParticula,
  IconSp,
  Shelf,
  Stack,
  Tooltips,
} from "./index";
import { useDailyTranchesStates, usePool, usePoolFees, usePoolMetadata } from "@/hooks/usePools";
import { useActiveDomains } from "@/hooks/useLiquidityPools";
import dynamic from 'next/dynamic';

import { ClientOnly, ClientText, ClientBox } from '@/components/ClientSideOnly';
import {
  CurrencyBalance,
  Price,
  type DailyTrancheState,
  type PoolMetadata,
  type Tranche,
  Perquintill,
} from "@centrifuge/centrifuge-js";
import { evmChains } from "@/config";
import { PoolStatus, type PoolStatusKey } from "../../PoolStatus";
import { Loader } from "lucide-react";
import { useAverageMaturity } from "@/utils/useAverageMaturity";
import { formatBalance, formatPercentage } from "@/utils/formatters";
import {
  DYF_POOL_ID,
  NS3_POOL_ID,
  centrifugeTargetAPYs,
} from "@/components/MainPane/components/PoolCard";
import { capitalize, startCase } from "lodash";
import { getPoolStatus } from "@/components/MainPane/MainPane";
// Use ClientText instead of Text component
const Text = ClientText;
import { useStockIcon } from "@/hooks/useStockIcon";
import Image from "next/image";
import type Decimal from "decimal.js-light";
import { daysBetween } from "@/utils/date";
import { Dec } from "@/hooks/Decimal";
import { useUserAccount } from "@/context/UserAccountContext";
import { useCentrifugeVault } from "@/hooks/useCentrifugeVault";
import { useChainId } from "wagmi";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import {
  CENTRIFUGE_VAULT_ADDRESS,
  USDC_ADDRESS,
  type SupportedChainId,
} from "@/constant/addresses";
import { toWei } from "@/hooks/formatting";
import { ErrorModal, SuccessModal } from "@/components/Modal";
import { LoadingSpinner } from "@/components/Modal/loading-spinner";
import StatusSection from "@/components/ui/status";
import { useRouter } from "next/navigation";
// import { Text, Tooltip } from "@centrifuge/fabric";

type PartialDailyTrancheState = Pick<DailyTrancheState, "yield30DaysAnnualized"> & {
  tokenPrice: Price;
  timestamp: string;
};
type RatingProps = { agency: string; value: string; reportUrl?: string; reportFile?: any };
type DailyTrancheStateArr = Record<string, PartialDailyTrancheState[]>;
type OverviewTabProps = {
  poolId: string;
  metrics: Array<{ metric: string | React.ReactNode; value: React.ReactNode }>;
  ratings?: Array<{ agency: string; value: string; reportUrl?: string; reportFile?: any }>;
  availableNetworks?: React.ReactNode;
  status: PoolStatusKey | undefined;
  description: string;
  blockchain: string;
  assetType: string;
  tokenAddress: string;
  tokenStandard: string;
  redemptionAssetTicker: string;
  redemptionAssetBlockchain: string;
  agentName: string;
  reports: Array<{ title: string; url: string }>;
  chartData?: any; // Placeholder for chart data, pass appropriate type
};

export type Token = {
  poolId: string;
  apy: Decimal;
  protection: Decimal;
  ratio: number;
  name: string;
  symbol: string;
  seniority: number;
  valueLocked: Decimal;
  id: string;
  capacity: CurrencyBalance;
  tokenPrice: Price | null;
  yield30DaysAnnualized?: string | null;
};

type Row = {
  tokenName: string;
  apy: Decimal;
  tvl: Decimal;
  tokenPrice: Decimal;
  subordination: Decimal;
  trancheId: string;
  isTarget: boolean;
};

const getTodayValue = (
  data: DailyTrancheStateArr | null | undefined,
): DailyTrancheStateArr | undefined => {
  if (!data) return;
  if (!Object.keys(data).length) return;

  const today = new Date();

  const filteredData: DailyTrancheStateArr = Object.keys(data).reduce((result, key) => {
    const filteredValues = data[key].filter((obj) => {
      const objDate = new Date(obj.timestamp);
      return (
        objDate.getDate() === today.getDate() &&
        objDate.getMonth() === today.getMonth() &&
        objDate.getFullYear() === today.getFullYear()
      );
    });

    if (filteredValues.length > 0) {
      result[key] = filteredValues;
    }

    return result;
  }, {} as DailyTrancheStateArr);

  return filteredData;
};

type Props = {
  poolId: string;
};

export const KeyMetrics = ({ poolId }: Props) => {
  const isTinlakePool = poolId.startsWith("0x");
  const pool = usePool(poolId);
  const { data: metadata } = usePoolMetadata(pool);
  const poolFees = usePoolFees(poolId);
  const tranchesIds = pool.tranches.map((tranche) => tranche.id);
  const dailyTranches = useDailyTranchesStates(tranchesIds) as DailyTrancheStateArr;
  const averageMaturity = useAverageMaturity(poolId);

  const expenseRatio = useMemo(() => {
    return (
      poolFees
        ?.map((f) => f.amounts?.percentOfNav.toPercent().toNumber())
        .reduce((acc, f) => acc + (f ?? 0), 0) ?? 0
    );
  }, [poolFees]);

  const tranchesAPY = useMemo(() => {
    const thirtyDayAPY = getTodayValue(dailyTranches);
    if (!thirtyDayAPY) return null;

    return Object.keys(thirtyDayAPY)
      .map((key) => {
        return thirtyDayAPY[key][0].yield30DaysAnnualized
          ? thirtyDayAPY[key][0].yield30DaysAnnualized.toPercent().toNumber()
          : 0;
      })
      .sort((a, b) => a - b);
  }, [dailyTranches]);

  const minInvestmentPerTranche = useMemo(() => {
    if (!metadata?.tranches) return null;

    return Object.values(metadata.tranches).map((item) => {
      const minInv = new CurrencyBalance(
        item.minInitialInvestment ?? 0,
        pool.currency.decimals,
      ).toDecimal();
      return item.minInitialInvestment ? minInv : null;
    });
  }, [metadata?.tranches, pool.currency.decimals]);

  const isBT3BT4 =
    poolId === "0x53b2d22d07E069a3b132BfeaaD275b10273d381E" ||
    poolId === "0x90040F96aB8f291b6d43A8972806e977631aFFdE" ||
    poolId === "0x55d86d51Ac3bcAB7ab7d2124931FbA106c8b60c7";

  const metrics = [
    {
      metric: "Asset type",
      value: `${capitalize(startCase(metadata?.pool?.asset?.class))} - ${metadata?.pool?.asset?.subClass}`,
    },
    {
      metric: centrifugeTargetAPYs[poolId as keyof typeof centrifugeTargetAPYs]
        ? "Target APY"
        : metadata?.tranches
          ? // @ts-ignore

          Object.values(metadata?.tranches)[0]?.apy
          : "30-day APY",
      value: centrifugeTargetAPYs[poolId as keyof typeof centrifugeTargetAPYs]
        ? centrifugeTargetAPYs[poolId as keyof typeof centrifugeTargetAPYs].reverse().join(" - ")
        : tranchesAPY?.length
          ? tranchesAPY.map((tranche, index) => {
            const formatted = formatPercentage(tranche);
            return formatted && `${formatted} ${index !== tranchesAPY?.length - 1 ? "-" : ""}`;
          })
          : "-",
    },
    ...(isBT3BT4
      ? []
      : [
        {
          metric: "Average asset maturity",
          value: averageMaturity,
        },
      ]),
    {
      metric: "Min. investment",
      value: minInvestmentPerTranche?.length
        ? minInvestmentPerTranche
          .sort((a, b) => Number(a) - Number(b))
          .map((tranche, index) => {
            const formatted = formatBalanceAbbreviated(tranche?.toNumber() ?? 0, "", 0);
            return (
              tranche &&
              `$${formatted} ${index !== minInvestmentPerTranche?.length - 1 ? "-" : ""} `
            );
          })
        : "-",
    },
    {
      metric: "Investor type",
      // @ts-ignore
      value: isBT3BT4 ? "Private" : (metadata?.pool?.investorType ?? "-"),
    },
    ...(!isTinlakePool
      ? [
        {
          metric: "Available networks",
          value: <AvailableNetworks poolId={poolId} />,
        },
      ]
      : []),

    {
      metric: "Pool structure",
      // value: isBT3BT4 ? "Revolving" : (metadata?.pool?.poolStructure ?? "-"),
      value: isBT3BT4 ? "Revolving" : (metadata?.pool?.details ?? "-"),
    },
    // @ts-ignore
    ...(metadata?.pool?.poolRatings?.length
      ? [
        {
          metric: "Rating",
          value: (
            // @ts-ignore
            <Shelf gap={1}>
              {/* @ts-ignore */}
              {metadata?.pool?.poolRatings?.map((rating) => (
                <RatingPill key={rating.agency} {...(rating as RatingProps)} />
              ))}
            </Shelf>
          ),
        },
      ]
      : []),

    {
      // metric: <Tooltip title="Expense Ratio" body="Expense ratio details" />,
      metric: "Expense Ratio",
      value: expenseRatio ? `${formatBalance(expenseRatio, "", 2)}%` : "-",
    },
  ];

  return (
    <div className="flex flex-col gap-5 justify-between border border-[#072A3C] bg-darkGrassGreen rounded-xl xl:col-span-2 px-6 pt-7 pb-5">
      <div className="flex w-full justify-between items-center mb-3 gap-10">
        <h6 className="text-base text-white font-medium">Overview</h6>
        <PoolStatus status={getPoolStatus(pool)} />
      </div>
      {metrics?.map(({ metric, value }, index) => (
        <div className="flex w-full justify-between gap-10" key={index}>
          <span className="text-base text-darkSlate font-medium">{metric}</span>
          <span className="text-base text-white font-light text-right">{value}</span>
        </div>
      ))}
    </div>
  );
};
const TooltipBody = ({
  title,
  subtitle = "View transactions",
  url,
  links,
}: {
  title: string;
  subtitle?: string;
  url?: string;
  links?: { text: string; url: string }[];
}) => {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ClientOnly>
      <div className="bg-[#001425] flex items-center rounded-lg p-3">
        <div className="flex flex-col mr-3">
          <span className="text-white font-medium">
            {title}
          </span>
          {links ? (
            links?.map((link, index) => (
              <div className="flex items-center" key={`${link.text}-${index}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-white mr-2"
                >
                  {link.text}
                </a>
                <IconArrowRightWhite />
              </div>
            ))
          ) : (
            <div className="flex items-center">
              <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className="text-white mr-2">
                {subtitle}
              </a>
              <IconArrowRightWhite />
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
};
export const RatingPill = ({ agency, reportUrl, reportFile, value }: RatingProps) => {
  const cent = useCentrifuge();
  const ratingIcons: { [key: string]: JSX.Element } = {
    "Moody's": <IconMoody size={16} />,
    Particula: <IconParticula size={16} />,
  };
  return (
    <ClientOnly>
      <div key={`${agency}-${reportUrl}`} className="inline-block">
        <div
          className="border border-white px-2 py-1 flex items-center justify-center"
          title={`${agency || ''} - ${value}`}
        >
          {agency && ratingIcons[agency] ? ratingIcons[agency] : <IconSp size={16} />}
          <span className="ml-1 text-white">{value}</span>
        </div>
      </div>
    </ClientOnly>
  );
};

const IconText = ({ id = "centrifuge" }: { id: string }) => {
  const Icon = useStockIcon(id);
  return Icon ? <Icon /> : null;
};

export const AvailableNetworks = ({ poolId }: { poolId: string }) => {
  const activeDomains = useActiveDomains(poolId);
  // const pool = usePool(poolId);

  const renderTooltipBody = (networkName: string, tranches: Tranche[], baseUrl: string) => {
    const links = tranches
      ?.map(
        (tranche) =>
          activeDomains?.data?.find((domain) => domain.trancheTokens[tranche.id])?.trancheTokens[
          //@ts-ignore
          tranche.idNetworkIcon
          ],
      )
      ?.filter(Boolean)
      ?.map((tokenAddress) => ({
        text: `View Transactions`,
        url: `${baseUrl}token/${tokenAddress}`,
      }));

    return <TooltipBody title={networkName} links={links} />;
  };

  return (
    <Shelf>
      {/* @ts-ignore */}
      {activeDomains.data?.length || !!process.env.NEXT_PUBLIC_COLLATOR_WSS_URL?.includes("dev") ? (
        <IconText id="centrifuge" />
      ) : (
        <Loader size="iconSmall" />
      )}
      {activeDomains.data
        ?.filter((domain) => domain.isActive && domain.chainId !== 5)
        ?.map((domain, key) => {
          const chain = (evmChains as any)[domain.chainId];
          return <IconText key={key} id={(domain.chainId || "").toString()} />;
        })}
    </Shelf>
  );
};

interface ErrorState {
  title?: string;
  message: string;
}

interface SuccessState {
  title?: string;
  message: string;
  txHash?: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  poolId,
  metrics,
  ratings = [],
  availableNetworks,
  status,
  description,
  blockchain,
  assetType,
  tokenAddress,
  tokenStandard,
  redemptionAssetTicker,
  redemptionAssetBlockchain,
  agentName,
  reports,
  chartData,
}) => {
  const active = status === ("Open for investments" as PoolStatusKey);
  const pool = usePool(poolId);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(1); // Default to "1"
  const  navigation = useRouter();
  const [depositAmount, setDepositAmount] = useState(10);
  const [ZrUSDmintAmount, setZrUSDmintAmount] = useState(10);

  const metadata = usePoolMetadata(pool);
  const chainId = useChainId();
  const { address, user, walletType } = useUserAccount();
  const links = [
    {
      label: "Website",
      href: metadata?.data?.pool?.links.website,
      show: !!metadata?.data?.pool?.links.website,
    },
    {
      label: "Forum",
      href: metadata?.data?.pool?.links.forum,
      show: !!metadata?.data?.pool?.links.forum,
    },
    {
      label: "Email",
      href: `mailto:${metadata?.data?.pool?.issuer.email}`,
      show: !!metadata?.data?.pool?.issuer.email,
    },
    {
      label: "Executive summary",
      show: !!metadata?.data?.pool?.links.executiveSummary,
      // onClick: () => setIsDialogOpen(true),
    },
  ];
  const cent = useCentrifuge();
  const imgUri = metadata?.data?.pool?.issuer.logo?.uri;
  const vaultAddress = "0x87f925157B1F87accdE9C973DFdbC60D33aC2bBD";
  const tokens: Token[] = pool?.tranches
    .map((tranche) => {
      const protection = tranche.minRiskBuffer?.toDecimal() ?? Dec(0);
      return {
        poolId: tranche.poolId,
        apy: tranche?.interestRatePerSec ? tranche?.interestRatePerSec.toAprPercent() : Dec(0),
        protection: protection.mul(100),
        ratio: tranche.ratio.toFloat(),
        name: tranche.currency.name,
        symbol: tranche.currency.symbol,
        seniority: Number(tranche.seniority),
        valueLocked: tranche?.tokenPrice
          ? tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal())
          : Dec(0),
        id: tranche.id,
        capacity: tranche.capacity,
        tokenPrice: tranche.tokenPrice,
        yield30DaysAnnualized: tranche?.yield30DaysAnnualized?.toString() || "",
      };
    })
    .reverse();

  const columns = useMemo(() => {
    return [
      {
        header: "Token",
        width: "40%",
        align: "left",
        cell: (row: Row) => {
          return (
            <span className="py-2 font-normal">
              {row.tokenName}
            </span>
          );
        },
      },
      {
        header: "APY",
        align: "left",
        cell: (row: Row) => {
          return (
            <div>
              <span className="mr-1 font-semibold">
                {typeof row.apy === 'object' ? row.apy.toString() : row.apy}
              </span>
              {row.isTarget && <Tooltips label="target" type="targetAPY" size="xs" />}
            </div>
          );
        },
      },
      {
        header: `TVL (${pool?.currency.symbol})`,
        align: "left",
        cell: (row: Row) => {
          return (
            <span className="py-2 font-normal">
              {formatBalance(row.tvl)}
            </span>
          );
        },
      },
      {
        header: `Token price (${pool?.currency.symbol})`,
        align: "left",
        cell: (row: Row) => {
          return (
            <span className="py-2 font-normal">
              {formatBalance(row.tokenPrice, undefined, 6)}
            </span>
          );
        },
      },
      ...(pool.tranches.length > 1
        ? [
          {
            header: "Subordination",
            align: "left",
            cell: (row: Row) => {
              return (
                <span className="py-2 font-normal">
                  {formatPercentage(row.subordination)}
                </span>
              );
            },
          },
        ]
        : []),
      {
        header: "",
        align: "right",
        cell: (row: Row) => {
          // return <InvestButton poolId={poolId} trancheId={row.trancheId} metadata={metadata} />;
        },
      },
    ];
  }, [pool.tranches, pool?.currency.symbol]);

  console.log("ssssss",success,error)
  const daysSinceCreation = pool?.createdAt ? daysBetween(new Date(pool.createdAt), new Date()) : 0;
  const {
    approvalState,
    approveCallback,
    loading: approvalLoading,
    error: approvalError,
    receipt: approvalReceipt,
  } = useApproveCallback(
    toWei(1000000000000),
    address,
    CENTRIFUGE_VAULT_ADDRESS[chainId as SupportedChainId],
    USDC_ADDRESS[chainId as SupportedChainId],
    walletType,
    "USDC",
  );
  const getTrancheText = (trancheToken: Token) => {
    if (trancheToken.seniority === 0) return "junior";
    if (trancheToken.seniority === 1) return "senior";
    return "mezzanine";
  };
  const isTinlakePool = poolId.startsWith("0x");

  const dataTable = useMemo(() => {
    const getTarget = (tranche: Token) =>
      (isTinlakePool && tranche.seniority === 0) ||
      poolId === DYF_POOL_ID ||
      poolId === NS3_POOL_ID;
    return tokens.map((tranche) => {
      const calculateApy = (trancheToken: Token) => {
        if (isTinlakePool && getTrancheText(trancheToken) === "senior")
          return formatPercentage(trancheToken.apy);
        if (isTinlakePool && trancheToken.seniority === 0) return "15%";
        if (poolId === DYF_POOL_ID) return centrifugeTargetAPYs[poolId][0];
        if (poolId === NS3_POOL_ID && trancheToken.seniority === 0)
          return centrifugeTargetAPYs[poolId][0];
        if (poolId === NS3_POOL_ID && trancheToken.seniority === 1)
          return centrifugeTargetAPYs[poolId][1];
        if (daysSinceCreation < 30) return "N/A";
        return trancheToken.yield30DaysAnnualized
          ? formatPercentage(new Perquintill(trancheToken.yield30DaysAnnualized))
          : "-";
      };
      return {
        tokenName: tranche.name,
        apy: calculateApy(tranche),
        tvl: tranche.valueLocked,
        tokenPrice: tranche.tokenPrice,
        subordination: tranche.protection,
        trancheId: tranche.id,
        isTarget: getTarget(tranche),
      };
    });
  }, [tokens, daysSinceCreation, isTinlakePool, poolId]);

  console.log(dataTable, columns, "___table");
  const isWalletConnected = false;
  const isDeposited = false;

  const {
    requestDeposit,
    deposit,
    requestWithdraw,
    withdraw,
    loading: loadingVault,
    receipt,
    setOperator,
    cancelDepositRequest,
    cancelWithdrawRequest,
    claimCancelDepositRequest,
    repayingDebt,
    poolTotalCirculationResult,
    userTrancheAssetResult,
    borrowedResult,
    userDepReqVaultCollatAsset,
    userVaultTrancheAsset,
    claimableDepositRequestResult,
    pendingDepositRequestResult,
    pendingCancelDepositRequestResult,
    claimableRedeemRequestResult,
    onRedeemClaimableResult,
    isOperator,
    error: vaultError,
  } = useCentrifugeVault(chainId);

  const vaultData: {
    vaultErr: any;
    vaultReceipt: any;
    totalCirculation: any;
    userTrancheAsset: any;
    userVaultAsset: any;
    userDepositRequest: any;
    claimableDeposit: any;
    pendingDeposit: any;
    pendingCancelDeposit: any;
    claimableRedeem: any;
    onRedeemClaimable: any;
    borrowed: any;
    isOperatorCall: any;
  } = useMemo(
    () => ({
      // Vault status
      totalCirculation: poolTotalCirculationResult,
      vaultErr: vaultError,
      vaultReceipt: receipt,
      // User assets and requests
      userTrancheAsset: userTrancheAssetResult,
      userVaultAsset: userVaultTrancheAsset,
      userDepositRequest: userDepReqVaultCollatAsset,

      // Request statuses
      claimableDeposit: claimableDepositRequestResult,
      pendingDeposit: pendingDepositRequestResult,
      pendingCancelDeposit: pendingCancelDepositRequestResult,
      claimableRedeem: claimableRedeemRequestResult,
      onRedeemClaimable: onRedeemClaimableResult,

      // Batch and transaction data
      borrowed: borrowedResult,
      repayingDebt,
      isOperatorCall: isOperator,
      // Receipt for transaction tracking
    }),
    [
      poolTotalCirculationResult,
      vaultError,
      userTrancheAssetResult,
      userVaultTrancheAsset,
      userDepReqVaultCollatAsset,
      claimableDepositRequestResult,
      pendingDepositRequestResult,
      pendingCancelDepositRequestResult,
      claimableRedeemRequestResult,
      onRedeemClaimableResult,
      borrowedResult,
      repayingDebt,
      isOperator,
      receipt,
    ],
  );
  const {
    vaultErr,
    vaultReceipt,
    totalCirculation,
    userTrancheAsset,
    userVaultAsset,
    userDepositRequest,
    claimableDeposit,
    pendingDeposit,
    pendingCancelDeposit,
    claimableRedeem,
    onRedeemClaimable,
    borrowed,
    isOperatorCall,
  } = vaultData;

  console.log({ pendingDeposit }, approvalState, vaultErr, vaultReceipt);
  // Then use the memoized values

  // Handle approval errors and success
  useEffect(() => {
    if (approvalError) {
      setError({
        title: "Approval Failed",
        message: approvalError.message || "Failed to approve token",
      });
    }
    if (vaultErr) {
      setError({
        title: "Transaction Failed",
        message: vaultErr.message || "Failed in Action",
      });
    }
  }, [approvalError, vaultErr]);

  useEffect(() => {
    if (approvalReceipt) {
      setSuccess({
        title: "Approval Successful",
        message: "Token approval completed",
        txHash: approvalReceipt.hash,
      });
    }
  }, [approvalReceipt]);

  // Action handlers
  const handleDeposit = async () => {
    try {
      setIsProcessing(true);
      const tx = await deposit(vaultAddress, ZrUSDmintAmount);
      setSuccess({
        title: "Deposit Successful",
        message: "Your deposit has been processed",
        txHash: vaultReceipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Deposit Failed",
        message: err.message || "Failed to process deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestDeposit = async () => {
    try {
      setIsProcessing(true);
      const tx = await requestDeposit(depositAmount, vaultAddress);
      setSuccess({
        title: "Deposit Requested",
        message: "Your deposit request has been submitted",
        txHash: vaultReceipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Request Failed",
        message: err.message || "Failed to request deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDeposit = async () => {
    try {
      setIsProcessing(true);
      const tx = await cancelDepositRequest();
      setShowDetails(false);
    } catch (err: any) {
    } finally {
      if (vaultReceipt) {
        setSuccess({
          title: "Deposit Cancelled",
          message: "Your deposit request has been cancelled",
          txHash: vaultReceipt,
        });
      }
      setIsProcessing(false);
      setShowDetails(false);
    }
  };
  const handleSetOperator = async () => {
    try {
      setIsProcessing(true);
      const tx = await setOperator();
      if (tx) {
        setSuccess({
          title: "Operator Set Successfully",
          message: "You can now proceed with borrowing ZrUSD",
          txHash: vaultReceipt,
        });
      }
    } catch (err: any) {
      setError({
        title: "Failed to Set Operator",
        message: err.message || "Failed to set operator",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const [pendingRedeemRequest, setPendingRedeemRequest] = useState(0);

  // Handler functions for withdraw operations
  const handleRequestWithdraw = async (trancheAmount: number, onBehalfOf: string) => {
    try {
      setIsProcessing(true);
      const tx = await requestWithdraw(trancheAmount, onBehalfOf);
      setSuccess({
        title: "Withdraw Requested",
        message: "Your withdraw request has been submitted",
        txHash: vaultReceipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Request Failed",
        message: err.message || "Failed to request withdraw",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (vaultAddress: string) => {
    try {
      setIsProcessing(true);
      const tx = await withdraw(vaultAddress);
      setSuccess({
        title: "Withdrawal Successful",
        message: "Your withdrawal has been processed",
        txHash: vaultReceipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Withdrawal Failed",
        message: err.message || "Failed to process withdrawal",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelWithdraw = async () => {
    try {
      setIsProcessing(true);
      const tx = await cancelWithdrawRequest();
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Cancel Failed",
        message: err.message || "Failed to cancel withdraw request",
      });
    } finally {
      if (vaultReceipt) {
        setSuccess({
          title: "Withdraw Cancelled",
          message: "Your withdraw request has been cancelled",
          txHash: vaultReceipt,
        });
      }
      setIsProcessing(false);
      setShowDetails(false);
    }
  };

  // Effect to fetch pending redeem request data
  useEffect(() => {
    // You would typically get this from contract data
    // For this example, we're setting a placeholder value
    if (claimableRedeemRequestResult && claimableRedeemRequestResult > 0) {
      setPendingRedeemRequest(0); // No pending request if there's a claimable one
    } else {
      // Set pending redeem request from contract data if available
      const pendingRedeem = 0; // Replace with actual data from contract
      setPendingRedeemRequest(pendingRedeem);
    }
  }, [claimableRedeemRequestResult]);
  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await approveCallback();
      // Success will be handled by the approvalReceipt effect
    } catch (err) {
      // Error will be handled by the approvalError effect
    } finally {
      setIsProcessing(false);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        event.target &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener);
    };
  }, [activeDropdown]);

  // Function to render the action button with dropdown

  // Updated renderActionButton function to include withdraw functionality

  // Status Section component for dropdown


  return (
    <div className="grid grid-cols-1 xl:grid-cols-7 gap-4 w-full">
      {/* Market Overview Section */}
      <div className="px-5 py-7 md:p-7 lg:p-10 border border-[#072A3C] bg-darkGrassGreen rounded-xl w-full xl:col-span-5">
        <div className="mb-10">
          <h3 className="text-white font-medium text-lg">Market Overview</h3>
        </div>
        <OverviewChart />
      </div>
      <KeyMetrics poolId={poolId} />
      <div className="col-span-1 xl:col-span-7">
        <div className="w-full overflow-x-auto rounded-xl border border-[#022e45]/60 shadow-[0_4px_20px_rgba(0,10,20,0.25)]">
          <table className="w-full text-white border-collapse overflow-hidden rounded-xl">
            {/* Table Header */}
            <thead>
              <tr className="text-left bg-gradient-to-r from-[#001C29] to-[#012339]">
                {columns.map(({ header }, i) => (
                  <th
                    key={i}
                    className={`px-5 py-4 text-sm font-semibold text-[#4BB6EE] first:rounded-tl-xl ${i === columns.length - 1 ? "rounded-tr-xl text-right pr-6" : ""
                      }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-[#001425]/90">
              {dataTable.map(({ apy, subordination, tokenName, tokenPrice, tvl }, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#022e45]/30 hover:bg-[#012339]/50 transition-colors duration-150 cursor-pointer ${i === dataTable.length - 1 ? "last:border-b-0" : ""
                    }`}
                >
                  {/* Token Name Column */}
                  <td className="px-5 py-4 first:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#013853] rounded-full flex items-center justify-center text-[#4BB6EE] text-xs font-bold">
                        {tokenName.substring(0, 2)}
                      </div>
                      <span className="font-medium">{tokenName}</span>
                    </div>
                  </td>

                  {/* APY Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <span
                        className={`font-semibold ${parseFloat(apy) > 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {apy}
                      </span>
                    </div>
                  </td>

                  {/* TVL Column */}
                  <td className="px-5 py-4">
                    <span className="text-[#4BB6EE] font-medium">{formatBalance(tvl)}</span>
                  </td>

                  {/* Token Price Column */}
                  <td className="px-5 py-4">
                    {tokenPrice ? (
                      <div className="font-medium">{formatBalance(tokenPrice)}</div>
                    ) : (
                      <div className="text-white/50">-</div>
                    )}
                  </td>

                  {/* Subordination Column */}
                  <td className="px-5 py-4">
                    <div className="font-medium">{formatBalance(subordination)}</div>
                  </td>

                  {/* Action Button Column */}
                  <td className="px-5 py-4 last:pr-6">
                    <div className="flex justify-end">
                      {/* @ts-ignore */}
                      <span className="flex items-center gap-2 justify-center" >

                      <div className="flex justify-end mt-4" onClick={() => navigation.push("/swap?tab=pool&subTab=deposit")}>
            <button className="bg-[#4BB6EE] hover:bg-[#5bc0f4] text-white px-5 py-2 rounded-md text-sm md:text-base transition-all duration-300">
              Go to Pools
            </button>
          </div>
          </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Empty State */}
            {dataTable.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-white/50">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-10 h-10 text-[#013853]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="font-medium">No data available</p>
                    <p className="text-sm">Check back later for updates</p>
                  </div>
                </td>
              </tr>
            )}
          </table>
        </div>
      </div>

      {/* Description and Details Section */}
      <div className="xl:col-span-5 p-0 overflow-hidden border border-[#072A3C] bg-gradient-to-br from-[#001820] to-[#00131b] rounded-xl shadow-lg">
        {/* Header with gradient overlay */}
        <div className="relative p-5 md:p-7 lg:px-10 py-6 border-b border-[#072A3C]/50 bg-gradient-to-r from-[#001820] via-[#002A30] to-[#001820]">
          <div className="flex justify-between items-center w-full gap-4">
            <div className="relative w-[120px] h-[34px] bg-[#072A3C]/20 rounded-md overflow-hidden p-1 shadow-inner">
              <Image
                src={
                  imgUri
                    ? cent.metadata.parseMetadataUrl(metadata?.data?.pool?.issuer.logo?.uri || "")
                    : "/img/logo_transparent.png"
                }
                alt={metadata?.data?.pool?.name || ""}
                fill
                className="object-contain"
              />
              {/* Subtle glow effect behind logo */}
              <div className="absolute -bottom-6 -left-2 w-24 h-16 bg-[#00A396]/10 rounded-full blur-xl"></div>
            </div>

            <div className="flex flex-wrap gap-2 items-center text-white/80">
              {links.map((link, i) => (
                <Link
                  href={link.href || ""}
                  key={i}
                  className="border border-[#072A3C] bg-[#072A3C]/20 hover:bg-[#072A3C]/40 transition-all duration-300 rounded-full px-4 py-2 text-sm md:text-base flex items-center gap-1.5"
                >
                  {/* Simple icon could be added here */}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="p-5 md:p-7 lg:px-10 py-6 space-y-5 bg-[#001425]">
          {/* Title and description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#4BB6EE] rounded-full"></div>
              <h5 className="text-xl md:text-2xl text-white font-medium">
                {metadata?.data?.pool?.issuer?.name || "Charles the Third"}
              </h5>
            </div>

            <p className="text-white/70 text-base md:text-lg leading-relaxed pl-4 border-l border-[#013853]/70">
              {metadata?.data?.pool?.issuer?.description ||
                "Charlie is the pool creator. Dave is whitelisted on junior tranche. Eve manages the NAV and all things assets."}
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#013853]/50">
            {[
              { label: "Market Cap", value: "$650B" },
              { label: "Type", value: "Pool Token" },
              { label: "Rating", value: "A+" },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-[#001A29] rounded-lg p-3 flex flex-col border border-[#013853]/30"
              >
                <span className="text-[#4BB6EE] text-sm">{metric.label}</span>
                <span className="text-white font-medium text-lg">{metric.value}</span>
              </div>
            ))}
          </div>

          {/* Actions row */}
          <div className="flex justify-end mt-4">
            <button className="bg-[#4BB6EE] hover:bg-[#5bc0f4] text-white px-5 py-2 rounded-md text-sm md:text-base transition-all duration-300">
              View Full Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="xl:col-span-2 px-5 py-4 border border-[#072A3C] bg-darkGrassGreen rounded-xl flex flex-col gap-5 justify-between">
        <h4 className="text-lg font-medium text-white">Reports</h4>
        <ul className="px-5 text-white">
          {reports?.map((report, index) => (
            <li key={index}>
              <Link
                href={report.url}
                className="w-full flex justify-between items-center py-4 border-b border-white/10"
              >
                <span>{report.title}</span>
                <ChevronRight />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Available Networks Section */}
      <div className="xl:col-span-2 px-5 py-4 border border-[#072A3C] bg-darkGrassGreen rounded-xl flex flex-col gap-5">
        <h4 className="text-lg font-medium text-white">Available Networks</h4>
        {availableNetworks}
      </div>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title="Error"
        message={error?.message || "Error: Undefined Properties"}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={success != null && success.txHash != null}
        onClose={() => setSuccess(null)}
        title={success?.title || "Success"}
        message={success?.message || "Transaction Successful"}
        txHash={success?.txHash}
        chainId={chainId}
      />
    </div>
  );
};

export default OverviewTab;
