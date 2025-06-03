import { AnemoyIcon, PopupIcon, RatingAIcon, RatingAPlusIcon } from "@/components/Icons/index";
import { CurrencyBalance, type PoolMetadata, Rate, type Token } from "@centrifuge/centrifuge-js";
import {
  formatAmount,
  formatBalance,
  formatBalanceAbbreviated,
  formatNumber,
  formatPercentage,
} from "@/utils/formatters";
import Link from "next/link";
import { useMemo } from "react";
import { daysBetween } from "@/utils/date";
import Image from "next/image";
import type { PoolStatusKey } from "../MainPane";

type TrancheWithCurrency = Pick<
  Token,
  "yield30DaysAnnualized" | "interestRatePerSec" | "currency" | "id" | "seniority"
>;

export type PoolCardProps = {
  poolId?: string;
  name?: string;
  assetClass?: string;
  valueLocked?: any;
  currencySymbol?: string;
  apr?: Rate | null | undefined;
  status?: PoolStatusKey;
  iconUri?: string;
  isArchive?: boolean;
  tranches?: TrancheWithCurrency[];
  metaData?: PoolMetadata;
  createdAt?: string;
};

enum StatusEnum {
  "Open for investments" = "Open for investments",
  Closed = "Closed",
  Upcoming = "Upcoming",
  Archived = "Archived",
}

export const DYF_POOL_ID = "1655476167";
export const NS3_POOL_ID = "1615768079";
export const centrifugeTargetAPYs = {
  [DYF_POOL_ID]: ["15%"],
  [NS3_POOL_ID]: ["16%", "8%"],
};

const FirstVariant = ({ data }: { data: any[] }) => {
  return (
    <div className="flex w-full justify-between flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="flex w-full justify-between mb-2">
        <div className="text-white w-1/3 text-xs sm:text-sm font-medium">Tranche</div>
        <div className="text-white w-1/3 text-xs sm:text-sm font-medium text-center">APY</div>
        <div className="text-white w-1/3 text-xs sm:text-sm font-medium text-right pr-1">Min.Investment</div>
      </div>
      <div className="space-y-2 sm:space-y-3 w-full">
        {!!data?.length &&
          data.map((item, i) => (
            <div className="flex w-full justify-between items-center border-b border-[#002842]/40 pb-2 last:border-0 last:pb-0" key={i}>
              <div className="text-white w-1/3 text-xs sm:text-sm font-medium truncate pr-1">
                {item?.name}
              </div>
              <div className="text-white w-1/3 text-xs sm:text-sm flex items-center justify-center">
                <span className={item?.apr !== "-" ? "text-midGreen" : "text-white"}>
                  {item?.apr}
                </span>
                {item?.apr !== "-" && (
                  <abbr
                    title="The target APY for the tranche."
                    className="cursor-pointer text-[10px] sm:text-xs text-gray-400 ml-1"
                  >
                    target
                  </abbr>
                )}
              </div>
              <div className="flex justify-end items-center text-white w-1/3 text-xs sm:text-sm font-medium">
                {item?.minInvestment}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default function PoolCard({
  name,
  status,
  currencySymbol,
  valueLocked,
  tranches,
  createdAt,
  poolId,
  iconUri,
  metaData,
  assetClass,
}: PoolCardProps) {
  const active = [StatusEnum["Open for investments"], StatusEnum.Upcoming].includes(
    status as StatusEnum,
  );
  const isOneTranche = tranches && tranches?.length === 1;
  //@ts-ignore
  const ratings = metaData?.pool?.poolRatings ?? [];
  const tranchesData = useMemo(() => {
    return tranches
      ?.map((tranche: TrancheWithCurrency) => {
        const words = tranche.currency.name.trim().split(" ");
        const metadata = metaData?.tranches[tranche.id] ?? null;
        const trancheName = words[words.length - 1];
        const investmentBalance = new CurrencyBalance(
          metadata?.minInitialInvestment ?? 0,
          tranche.currency.decimals,
        ).toDecimal();

        const calculateApy = (tranche: TrancheWithCurrency) => {
          const daysSinceCreation = createdAt ? daysBetween(createdAt, new Date()) : 0;
          if (poolId === DYF_POOL_ID) return centrifugeTargetAPYs[DYF_POOL_ID][0];
          if (poolId === NS3_POOL_ID && tranche.seniority === 0)
            return centrifugeTargetAPYs[NS3_POOL_ID][0];
          if (poolId === NS3_POOL_ID && tranche.seniority === 1)
            return centrifugeTargetAPYs[NS3_POOL_ID][1];
          if (daysSinceCreation > 30 && tranche.yield30DaysAnnualized)
            return formatPercentage(tranche.yield30DaysAnnualized, true, {}, 1);
          if (tranche.interestRatePerSec) {
            return formatPercentage(tranche.interestRatePerSec.toAprPercent(), true, {}, 1);
          }
          return "-";
        };

        return {
          seniority: tranche.seniority,
          name: trancheName,
          apr: calculateApy(tranche),
          minInvestment:
            metadata && metadata.minInitialInvestment
              ? `$${formatBalanceAbbreviated(investmentBalance, "", 0)}`
              : "-",
        };
      })
      .reverse();
  }, [metaData?.tranches, tranches, createdAt, poolId]);

  return (
    <div className="bg-[#001C29] text-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl w-full flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-[#003553]/20 border border-[#0A3655]/30 hover:border-[#0A3655]/50">
      {/* Header Section */}
      <div className="flex flex-col xs:flex-row justify-between items-start gap-2 mb-3 sm:mb-4">
        <div className="space-y-2 sm:space-y-3 w-full xs:w-auto">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-md bg-[#001620]/90 border-[0.25px] ${
              active ? "border-midGreen/50 text-midGreen" : "border-midRed/50 text-midRed"
            } text-[10px] sm:text-xs whitespace-nowrap`}
            role="status"
            aria-label={`Status: ${status}`}
          >
            <span
              className={`${active ? "bg-midGreen" : "bg-midRed"} w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2`}
            ></span>
            <p className="text-[10px] sm:text-xs truncate"> {status} </p>
          </div>

          {/* Pool Name and Icon */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {iconUri && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center relative overflow-hidden shadow-sm flex-shrink-0">
                <Image
                  src={iconUri}
                  alt={name || "Pool icon"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 28px, 32px"
                />
              </div>
            )}
            <h3 className="text-base sm:text-lg md:text-xl font-semibold truncate max-w-[200px] xs:max-w-[180px] sm:max-w-none">{name}</h3>
          </div>
        </div>

        {/* Logo SVG - Smaller on mobile */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 43 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="sm:w-[36px] sm:h-[35px] md:w-[43px] md:h-[41px] flex-shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.96087 32.642C3.7019 29.9649 2.99868 26.9782 2.99868 23.8284C2.99868 12.3133 12.3966 2.97858 23.9896 2.97858C30.4447 2.97858 36.2191 5.87297 40.0697 10.4262L42.3668 8.51168C37.9662 3.30789 31.3669 0 23.9896 0C10.7405 0 0 10.6683 0 23.8284C0 27.4282 0.803648 30.8416 2.24249 33.9011L4.96087 32.642Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23.9896 37.9769C16.123 37.9769 9.7458 31.6426 9.7458 23.8288C9.7458 16.015 16.123 9.68072 23.9896 9.68072C28.3699 9.68072 32.2876 11.6452 34.9005 14.735L37.1982 12.8199C34.0353 9.07972 29.292 6.70215 23.9896 6.70215C14.4668 6.70215 6.74707 14.37 6.74707 23.8288C6.74707 33.2876 14.4668 40.9555 23.9896 40.9555V37.9769Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M29.1578 28.1356C27.9202 29.5992 26.0644 30.5297 23.9895 30.5297C20.2632 30.5297 17.2424 27.5293 17.2424 23.828C17.2424 20.1267 20.2632 17.1262 23.9895 17.1262C26.0644 17.1262 27.9202 18.0568 29.1578 19.5204L31.742 17.3666C29.8855 15.1713 27.1018 13.7754 23.9895 13.7754C18.4 13.7754 13.8689 18.2761 13.8689 23.828C13.8689 29.3799 18.4 33.8806 23.9895 33.8806C26.8418 33.8806 29.4175 32.7077 31.257 30.822L29.1578 28.1356Z"
            fill="white"
          />
        </svg>
      </div>

      {/* TVL Section */}
      <div className="mb-3 sm:mb-4 md:mb-5 pt-3 flex items-center justify-between border-t border-[#313E44]/60">
        <div className="text-white/90 text-xs sm:text-sm mb-0">TVL ({currencySymbol})</div>
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent pr-1">
          {valueLocked ? formatBalance(valueLocked, "") : "-"}
        </div>
      </div>

      {/* Tranche Section */}
      {!isOneTranche ? (
        <FirstVariant data={tranchesData || []} />
      ) : (
        <div className="flex justify-between items-start gap-2 sm:gap-3 w-full mb-3 sm:mb-4 md:mb-5">
          {/* APY */}
          <div className="flex-1 min-w-0">
            <div className="text-gray-400 text-[10px] sm:text-xs mb-1">APY</div>
            <div className="flex items-center">
              <span
                className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold ${tranchesData?.[0]?.apr !== "-" ? "text-midGreen" : "text-white"}`}
              >
                {tranchesData?.[0]?.apr}
                {tranchesData?.[0]?.apr !== "-" && (
                  <abbr
                    title="The target APY for the tranche."
                    className="cursor-pointer text-[8px] sm:text-[10px] md:text-xs text-gray-400 ml-1"
                  >
                    target
                  </abbr>
                )}
              </span>
            </div>
          </div>

          {/* Min Investment */}
          <div className="flex-1 min-w-0">
            <div className="text-gray-400 text-[10px] sm:text-xs mb-1">Min.Investment</div>
            <div className="flex items-center">
              <span
                className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold truncate pr-1 ${tranchesData?.[0]?.minInvestment !== "-" ? "text-midGreen" : "text-white"}`}
              >
                {tranchesData?.[0]?.minInvestment}
              </span>
            </div>
          </div>

          {/* Chart - Hidden on smallest screens */}
          <div className="relative h-8 sm:h-10 md:h-12 flex-shrink-0 self-end overflow-hidden hidden xs:block">
            <svg
              width="80"
              height="32"
              viewBox="0 0 163 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="sm:w-[100px] sm:h-[40px] md:w-[120px] md:h-[48px] lg:w-[140px] lg:h-[56px]"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.49976 46.0824C1.49976 46.0824 7.82431 32.8204 12.7501 32.8204C17.676 32.8204 17.1278 14.5691 24.2061 14.5691C31.2843 14.5691 29.8187 1 35.4565 1C41.0942 1 38.7419 18.2311 46.5013 17.7489C54.2607 17.2668 51.4189 21.7386 57.9572 21.7386C64.4955 21.7386 62.5062 18.0466 69.002 17.4058C75.4979 16.7651 73.4827 23.2272 80.6635 23.2317C87.8443 23.2361 86.144 29.4834 91.7084 29.4834C97.2727 29.4834 98.1071 22.991 102.959 22.991C107.81 22.991 109.743 25.1395 114.209 25.1395C118.675 25.1395 120.103 20.7178 125.665 20.7178C131.227 20.7178 130.794 22.5131 136.71 22.2853C142.626 22.0576 144.341 30.4171 148.161 30.4171C151.981 30.4171 159 42.3144 159 42.3144V64H1.50491L1.49976 46.0824Z"
                fill="url(#paint0_linear_4398_2506)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_4398_2506"
                  x1="80.2498"
                  y1="1"
                  x2="80.2498"
                  y2="73.3727"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#660000" />
                  <stop offset="1" stopColor="#002232" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {/* Asset Info Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 border-t border-[#313E44]/30 pt-3">
        <div>
          <div className="text-gray-400 text-[10px] sm:text-xs mb-1">Asset type</div>
          <div className="text-xs sm:text-sm md:text-base truncate">{assetClass ?? "-"}</div>
        </div>
        <div>
          <div className="text-gray-400 text-[10px] sm:text-xs mb-1">Investor type</div>
          <div className="text-xs sm:text-sm md:text-base truncate">
            {/* @ts-ignore */}
            {metaData?.pool?.investorType ?? "-"}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-3 md:gap-4">
        {/* Ratings */}
        {!!ratings?.length && (
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <div className="text-gray-400 text-[10px] sm:text-xs mr-1">Rating</div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {ratings.map((rating: any, i: number) => (
                <div
                  key={i}
                  className="px-1.5 sm:px-2 md:px-3 py-0.5 rounded-2xl outline outline-[.25px] outline-[#6B6B6C]/50 text-white flex items-center gap-1"
                >
                  {rating?.agency === "Moody's" ? (
                    <RatingAIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  ) : (
                    <RatingAPlusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  )}
                  <p className="text-[10px] sm:text-xs">{rating?.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invest Button */}
        <Link
          href={`/poolDashboard/${poolId}`}
          className="w-full sm:w-auto gap-1 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full border border-white/30 bg-[#001620] text-white text-[10px] sm:text-xs md:text-sm flex justify-center items-center hover:bg-[#001220] hover:border-white/50 transition-all duration-200 group"
          aria-label={`Invest in ${name || 'this pool'}`}
        >
          Invest
          <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">
            <PopupIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}