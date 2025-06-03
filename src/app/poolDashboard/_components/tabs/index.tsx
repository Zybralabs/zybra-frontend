"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import OverviewTab from "./overview";
import Assets from "./assets";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // You'll need to create this utility
import type { PlacementAxis } from "@react-aria/overlays";
import type { TextProps } from "@centrifuge/fabric";
import { Text as FabricText, Positioner, Tooltip as FabricTooltip } from "@centrifuge/fabric";
import styled, { css } from "styled-components";
import { usePool } from "@/hooks/usePools";

function ValueLockedTooltipBody({ poolId }: { poolId?: string }) {
  const params = useParams<{ pid: string }>();
  const poolIdParam = params?.pid;
  const pool = usePool(poolId || poolIdParam || "", false);
  return (
    <>Value locked represents the current total value of pool tokens in {pool?.currency.symbol}.</>
  );
}

const Tabs = () => {
  const tabs = [
    {
      name: "Overview",
      id: "overview",
    },
    {
      name: "Assets",
      id: "assets",
    },
    {
      name: "Liquidity",
      id: "liquidity",
    },
    {
      name: "Reports",
      id: "reports",
    },
    {
      name: "Swap",
      id: "swap",
    },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const { slug } = useParams<Record<string, string>>() || {};
  return (
    <div className={`flex flex-col flex-1 w-full duration-300`}>
      <ul className="flex items-center gap-10">
        {tabs.map((tab, i) => (
          <li
            key={i}
            className={`${activeTab === tab.id ? "text-[#4BB6EE] border-[#4BB6EE]" : "text-white border-transparent"} border-b-2 cursor-pointer text-lg`}
            onClick={() => tab.id !== "swap" && setActiveTab(tab.id)}
          >
            {tab.id === "swap" ? (
              <Link href={`/swap?address=${slug}`}>{tab.name}</Link>
            ) : (
              <>{tab.name}</>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        {/* @ts-ignore */}
        {activeTab === tabs[0]?.id && <OverviewTab poolId={slug} />}
        {activeTab === tabs[1]?.id && <Assets />}
      </div>
    </div>
  );
};

// Replace Box with a div using Tailwind classes
const Box = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    display?: string;
    flexDirection?: string;
    alignItems?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    marginRight?: string;
    width?: string;
    justifyContent?: string;
    border?: string;
  }
>(({ className, children, ...props }, ref) => {
  const styles = cn(
    "flex",
    props.display && `${props.display}`,
    props.flexDirection && `flex-${props.flexDirection}`,
    props.alignItems && `items-${props.alignItems}`,
    props.backgroundColor && `bg-${props.backgroundColor}`,
    props.borderRadius && `rounded-${props.borderRadius}`,
    props.padding && `p-${props.padding}`,
    props.marginRight && `mr-${props.marginRight}`,
    props.width && `w-${props.width}`,
    props.justifyContent && `justify-${props.justifyContent}`,
    props.border && `border ${props.border}`,
    className,
  );

  return (
    <div ref={ref} className={styles} {...props}>
      {children}
    </div>
  );
});
Box.displayName = "Box";

// Replace Shelf with a flex container
const Shelf = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
};

// Replace Stack with a flex column container
const Stack = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {children}
    </div>
  );
};

// Replace IconArrowRightWhite with Lucide ArrowRight
const IconArrowRightWhite = ({ size = 24 }: { size?: number }) => {
  return <ArrowRight className="text-white" size={size} />;
};

// Replace Card with a styled div
const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("rounded-lg border border-gray-200 bg-white p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export type TooltipProps = TextProps & {
  title?: string;
  body: string | React.ReactNode;
  disabled?: boolean;
  delay?: number;
  bodyWidth?: string | number;
  bodyPadding?: string | number;
  triggerStyle?: React.CSSProperties;
};



const placements: {
  [key in PlacementAxis as string]: any;
} = {
  bottom: css({
    top: "calc( var(--size) * -1)",
    left: "calc(50% - var(--size))",
  }),

  top: css({
    bottom: "calc( var(--size) * -1)",
    left: "calc(50% - var(--size))",
  }),

  left: css({
    top: "calc(50% - var(--size))",
    right: "calc( var(--size) * -1)",
  }),

  right: css({
    top: "calc(50% - var(--size))",
    left: "calc( var(--size) * -1)",
  }),
};

const Container = styled(Stack)<{ pointer: PlacementAxis }>`
  background-color: ${({ theme }) => theme.colors.backgroundInverted};
  filter: ${({ theme }) => `drop-shadow(${theme.shadows.cardInteractive})`};
  opacity: 0;
  transform: translateY(-10px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  will-change: opacity, transform;

  &.show {
    opacity: 1;
    transform: translateY(0);
  }

  &::before {
    --size: 5px;
    content: "";
    position: absolute;
    ${({ pointer }) => placements[pointer!]}
    border: ${({ theme }) => `var(--size) solid ${theme.colors.backgroundInverted}`};
    transform: rotate(-45deg);
  }
`;

export const tooltipText = {
  assetType: {
    label: "Asset type",
    body: "This refers to the asset type used to finance the asset. This can e.g. be bullet loans or interest bearing loans. The asset type determines in particular the cash flow profile of the financing.",
  },
  collateralValue: {
    label: "Collateral value",
    body: "Collateral value refers to the value of the collateral underlying the real-world asset onchain.",
  },
  riskGroup: {
    label: "Risk group",
    body: "Risk group set by the issuer for the asset indicating the likelihood of a default. To learn more read about the issuers risk groupings here...",
  },
  assetClass: {
    label: "Asset class",
    body: "Assets can be grouped into classes that exhibit similar characteristics in terms of maturity, volume, type of financing, underlying collateral and/or risk return profile.",
  },
  apy: {
    label: "APY",
    body: 'The Annual Percentage Yield ("APY") of a token is calculated as the effective annualized return of the pool\'s token price.',
  },
  juniorTrancheYields: {
    label: "APR",
    body: "The junior tranche yields variable returns depending on the pools excess returns after fixed senior returns have been served.",
  },
  seniorTokenAPR: {
    label: "APR",
    body: "The Senior token APR is the rate at which the 'Senior token' accrues interest per second.",
  },
  subordination: {
    label: "Subordination",
    body: "The subordination is the minimum value of the junior token in relation to the pool value. It denotes how much of the pool is always protected by the junior tranche against asset defaults.",
  },
  currency: {
    label: "override",
    body: "Select accepted currency for investments into the pool.",
  },
  poolDescription: {
    label: "override",
    body: "Use this space to share more about your company as an issuer.",
  },
  valueLocked: {
    label: "Value locked",
    body: <ValueLockedTooltipBody />,
  },
  tvl: {
    label: "Total value locked (TVL)",
    body: "Total value locked (TVL) represents the sum of all ongoing assets and the amounts locked in the reserve in all Centrifuge pools.",
  },
  tokens: {
    label: "Tokens",
    body: "Number of tokens that can be invested in on Centrifuge.",
  },
  age: {
    label: "Age",
    body: "This indicates the age of the pool from creation date to today.",
  },
  averageAssetMaturity: {
    label: "Average asset maturity",
    body: "This indicates the range of maturities of the pool's underlying assets, i.e. the time period after which the financing of this assets matures and will be paid back.",
  },
  poolValue: {
    label: "Pool value",
    body: 'The pool value is the current value of financed assets ("Asset value") plus the reserve. It is equal to value locked in the tranches of the pool.',
  },
  assetValue: {
    label: "Asset value",
    body: "The asset value or NAV reflects the present value of the outstanding portfolio of financings. It is the sum of the present values of the risk-adjusted expected repayments of all outstanding financings.",
  },
  ongoingAssets: {
    label: "Ongoing assets",
    body: "Number of assets currently being financed in the pool and awaiting repayment.",
  },
  averageAmount: {
    label: "Average amount",
    body: "The average outstanding amount of the assets in the pool.",
  },
  poolReserve: {
    label: "Pool reserve",
    body: "The reserve represents the amount of available liquidity in the pool available for loan originations by the issuer and redemptions by investors.",
  },
  invested30d: {
    label: "Invested (30d)",
    body: "The total amount invested by investors into the pool over the past 30 days.",
  },
  redeemed30d: {
    label: "Redeemed (30d)",
    body: "The total amount redeemed by investors from the pool over the past 30 days.",
  },
  repaid30d: {
    label: "Repaid (30d)",
    body: "The total amount repaid by the issuer over the past 30 days.",
  },
  upcomingRepayments30d: {
    label: "Upcoming repayments (30d)",
    body: "Expected repayments by the issuer in the next 30 days.",
  },
  cashDrag: {
    label: "Cash drag",
    body: "Share of the pool's value locked that is currently in the pool’s reserve and not financing assets. Liquidity in the pool’s reserve does not earn yield and thus drags down investor’s returns.",
  },
  epochTimeRemaining: {
    label: "override",
    body: "Time remaining until the next epoch can be closed and orders executed providing sufficient investment capacity and liquidity.",
  },
  issuerName: {
    label: "override",
    body: "This is the legal entity, usually a special purpose vehicle, that holds the pools assets.",
  },
  tokenSymbol: {
    label: "override",
    body: "Add a 4-to-12 character token symbol that reflects the risk and tranche of the token. Each token symbol of the pool should start with the same 3 characters.",
  },
  minimumInvestment: {
    label: "Minimum investment",
    body: "The minimum amount that can be invested in the token of a pool.",
  },
  advanceRate: {
    label: "Advance rate",
    body: "The advance rate is the percentage amount of the value of the collateral that an issuer can borrow from the pool against the NFT representing the collateral.",
  },
  interestRate: {
    label: "Interest Rate",
    body: "The interest rate is the rate at which the outstanding amount of an individual financing accrues interest. It is expressed as an “APR” (Annual Percentage Rate) and compounds every second.",
  },
  probabilityOfDefault: {
    label: "Prob of default",
    body: "The probablility of default is the likelyhood of a default occuring for an asset in this risk group.",
  },
  lossGivenDefault: {
    label: "Loss given default",
    body: "Loss given default (LGD) is the amount expected to be recovered and repaid to the pool in case of a default of a financing.",
  },
  riskAdjustment: {
    label: "Risk adjustment",
    body: "This is the assumed risk adjustment applied to outstanding financings of the corresponding risk group to calculate the NAV of the asset portfolio. It is calculated as the product of the probability of default and loss given default.",
  },
  discountRate: {
    label: "Discount rate",
    body: "The discount rate is used to determine the present value of a financing by discounting the risk-adjusted expected interest payments and repayments. It usually reflects the rate of return an investor could earn in the marketplace on an investment of comparable size, maturity and risk.",
  },
  averageMaturity: {
    label: "Average maturity",
    body: "This indicates the average maturity of the pools ongoing assets, i.e. the time period after which the financing of this assets matures and will be paid back.",
  },
  id: {
    label: "ID",
    body: "All NFTs locked in a pool are assigned an ascending NFT ID.",
  },
  maxReserve: {
    label: "Max. reserve",
    body: "No investments will be accepted if the current reserve is larger than the max reserve amount.",
  },
  availableFinancing: {
    label: "Available financing",
    body: "The amount available for financing the asset based on the asset value and the advance rate.",
  },
  outstanding: {
    label: "Outstanding",
    body: "The asset's outstanding financing debt.",
  },
  liquidity: {
    label: "Liquidity",
    body: "Allows to set the maximum reserve.",
  },
  asset: {
    label: "Asset",
    body: "Allows to write-off assets.",
  },
  whitelist: {
    label: "Whitelist",
    body: "Allows to whitelist investor addresses.",
  },
  pricing: {
    label: "Pricing",
    body: "Allows to price assets.",
  },
  borrower: {
    label: "Borrower",
    body: "Allows to borrow from the pool against assets.",
  },
  pool: {
    label: "Pool",
    body: "Allows to manage pool configuration and manage other admins.",
  },
  origination: {
    label: "Origination",
    body: "Origination is the process by which the issuer finances a new asset.",
  },
  repayment: {
    label: "Repayment",
    body: "Repayment is a structured repaying of funds that have been given to the issuer over a period of time, typically alongside a payment of interest.",
  },
  investment: {
    label: "Investment",
    body: "An investment is an asset or item acquired with the goal of generating income or appreciation.",
  },
  redemption: {
    label: "Redemption",
    body: "Redemption in a pool means withdrawal of investment by the lender.",
  },
  noTranchProtection: {
    label: "Min. subordination",
    body: "The first, most junior tranche is not protected by subordinated tranches.",
  },
  tranchProtection: {
    label: "Min. subordination",
    body: "Minimum protection required for this tranche by all subordinated tranches.",
  },
  variableTranchInterest: {
    label: "Interest rate",
    body: "The first, most junior tranche receives a variable return.",
  },
  fixedTranchInterest: {
    label: "Fixed interest rate",
    body: "Fixed interest rate (APR) this tranche accrues on deployed capital.",
  },
  issuerRepName: {
    label: "Issuer representive name",
    body: "This is the full legal name of the authorized representive of the pool.",
  },
  appliedWriteOff: {
    label: "Applied write-off",
    body: "The applied write-off is the amount of the outstanding financing that has been written off by the issuer.",
  },
  maturityExtensionDays: {
    label: "Extension period",
    body: "Number of days the maturity can be extended without restrictions.",
  },
  maxPriceVariation: {
    label: "Max price variation",
    body: "The maximum price variation defines the price difference between settlement and oracle price.",
  },
  isin: {
    label: "ISIN",
    body: "An International Securities Identification Number (ISIN) is a code that uniquely identifies a security globally for the purposes of facilitating clearing, reporting and settlement of trades.",
  },
  notionalValue: {
    label: "Notional value",
    body: "The notional value is the total value of the underlying asset.",
  },
  cfgPrice: {
    label: "CFG price",
    body: "CFG price sourced externally from Uniswap.",
  },
  tbillApr: {
    label: "LTF APR",
    body: "Based on 3- to 6-month T-bills returns. See pool details for further information.",
  },
  dyfApr: {
    label: "DYF APR",
    body: "Based on the return of the underlying funds",
  },
  poolType: {
    label: "Pool type",
    body: "An open pool can have multiple unrelated token holders and can onboard third party investors. A closed pool has very limited distributions and is not available for investment on the app.",
  },
  totalPendingFees: {
    label: "Total pending fees",
    body: "The total pending fees represent the sum of all added fees.",
  },
  totalPaidFees: {
    label: "Total paid fees",
    body: "The total paid fees represent the sum of all paid fees since the inception of the fee system.",
  },
  feeType: {
    label: "Fee type",
    body: "The protocol fee is mandatory and will be charged every epoch automatically. The fee amount is dependent on the asset class.",
  },
  feePosition: {
    label: "Fee position",
    body: "Fees are settled using available liquidity before investments or redemptions, prioritizing and paying the highest fees first.",
  },
  totalNav: {
    label: "Total NAV",
    body: "The total Net Asset Value (NAV) reflects the combined present value of assets, cash held in the onchain reserve of the pool, and cash in the bank account designated as offchain cash.",
  },
  onchainReserve: {
    label: "Onchain reserve",
    body: "The onchain reserve represents the amount of available liquidity in the pool available for asset originations and redemptions.",
  },
  offchainCash: {
    label: "Offchain cash",
    body: "Offchain cash represents funds held in a traditional bank account or custody account.",
  },
  averageYtm: {
    label: "Average purchase YTM",
    body: "Weighted average YTM (Yield to Maturity) at time of asset purchases",
  },
  currentYtm: {
    label: "Current YTM",
    body: "YTM (Yield to Maturity) based on latest available price",
  },
  ytm: {
    label: "YTM",
    body: "YTM (Yield to Maturity) at time of purchase based on settlement price",
  },
  nav: {
    label: "NAV",
    body: "The Net Asset Value (NAV) reflects the combined present value of assets, cash held in the onchain reserve of the pool, and cash in the bank account designated as offchain cash.",
  },
  singleTrancheTokenPrice: {
    label: "Token price",
    body: "The token price is equal to the NAV divided by the outstanding supply of tokens.",
  },
  additionalAmountInput: {
    label: "Additional amount",
    body: "This can be used to repay an additional amount beyond the outstanding principal and interest of the asset. This will lead to an increase in the NAV of the pool.",
  },
  repayFormAvailableBalance: {
    label: "Available balance",
    body: "Balance of the asset originator account on Centrifuge.",
  },
  repayFormAvailableBalanceUnlimited: {
    label: "Available balance",
    body: "Unlimited because this is a virtual accounting process.",
  },
  linearAccrual: {
    label: "Linear accrual",
    body: "If enabled, the price of the asset is updated continuously based on linear accrual from the latest known market price to the value at maturity.",
  },
  investorType: {
    label: "Investor type",
    body: "Who is able to participate.",
  },
  targetAPY: {
    label: "Target APY",
    body: "The target APY for the tranche.",
  },
  expenseRatio: {
    label: "Expense ratio",
    body: "The operating expenses of the fund as a percentage of the total NAV",
  },
  totalNavMinusFees: {
    label: "Total NAV",
    body: "Total nav minus accrued fees",
  },
  oneTranche: {
    label: "",
    body: "This pool will only have one investment class where all investors share the same level of risk and return.",
  },
  twoTranches: {
    label: "",
    body: "This pool will have two classes. Senior tranche which has priority in receiving returns. And Junior tranche which is the last to receive returns (after Senior tranche obligations are met) but receives higher yield as compensation for the higher risk.",
  },
  threeTranches: {
    label: "",
    body: "This pool will have three classes. Senior tranche is the safest tranche with priority in repayment. Mezzanine tranche has intermediate risk and receives payment after Senior tranche obligations are met. Junior tranche which only receives returns after both Senior and Mezzanine tranches are paid.",
  },
  singleMultisign: {
    label: "",
    body: "Setup a wallet where only one private key is required to authorise changes to the pool configuration.",
  },
  multiMultisign: {
    label: "",
    body: "Setup a wallet that requires multiple private keys to authorise changes to the pool configuration.",
  },
  centrifugeOnboarding: {
    label: "",
    body: "Investors will go through the Centrifuge onboarding provider, Shuftipro, before they can invest in your pool.",
  },
  externalOnboarding: {
    label: "",
    body: "You can select the provider you want to KYC/onboard your investors.",
  },
  noneOnboarding: {
    label: "",
    body: "You can directly whitelist the addresses that can invest in the pool.",
  },
};

export type TooltipsProps = {
  type?: keyof typeof tooltipText;
  label?: string | React.ReactNode;
  props?: any;
  size?: "med" | "sm" | "xs";
  color?: string;
} & Partial<Pick<TextProps, "textOverflow">>;

export function CustomTooltips({
  type,
  label: labelOverride,
  size = "sm",
  props,
  color,
  ...textProps
}: TooltipsProps) {
  const { label, body } = type
    ? tooltipText[type]
    : { label: labelOverride, body: textProps?.textOverflow };
  return (
    <FabricTooltip
      body={React.isValidElement(body) ? React.cloneElement(body, props) : body}
      {...(textProps as any)}
    >
      {typeof label === "string" ? (
        //@ts-ignore
        <FabricText
          textAlign="left"
          variant={size === "sm" ? "label2" : size === "xs" ? "body4" : "label1"}
          color={size === "sm" && !color ? "textPrimary" : "textSecondary"}
          fontWeight={size === "sm" ? "inherit" : 400}
        >
          {labelOverride || label}
        </FabricText>
      ) : (
        label
      )}
    </FabricTooltip>
  );
}

// Replace Tooltip with Radix UI Tooltip

// Icons replacements using SVG components
const IconMoody = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5.5 6.5h1M9.5 6.5h1M5.5 9.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconParticula = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1v14M1 8h14M4 4l8 8M12 4L4 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconSp = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M13 3H3v10h10V3z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export {
  Box,
  Card,
  IconArrowRightWhite,
  IconMoody,
  IconParticula,
  IconSp,
  Shelf,
  Stack,
  CustomTooltips as Tooltips,
  Tabs,
};
