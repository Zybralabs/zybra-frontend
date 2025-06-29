"use client";

import * as React from "react";
import { ArrowLeftRightIcon, BarChart2, FileText, User2, Activity, HandHelping, Menu, X, ChevronDown, LayoutDashboard, ArrowLeft, TrendingUp, Droplets, ShoppingCart } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WalletModal } from "../Modal";
import { useUserAccount } from "@/context/UserAccountContext";
import ChainSwitcher from "../chainSwitch";

import { WalletType } from "@/constant/account/enum";
import { LoadingSpinner } from "../Modal/loading-spinner";

import Avatar from 'boring-avatars';

// Avatar component that generates cool avatars based on address
const UserAvatar: React.FC<{ address: string; size?: "sm" | "md" | "lg" }> = ({ address, size = "md" }) => {
  // Size mapping for boring-avatars
  const sizeMapping = {
    sm: 32, // 8 * 4 = 32px
    md: 40, // 10 * 4 = 40px
    lg: 48  // 12 * 4 = 48px
  };

  // Size classes for the container
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  // Custom colors that match the app's theme
  const colors = [
    "#0066A1", // Blue
    "#001C29", // Dark Green
    "#4BB6EE", // Light Blue
    "#022333", // Dark Blue
    "#059669"  // Grass Green
  ];

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <Avatar
        size={sizeMapping[size]}
        name={address || "anonymous"}
        variant="beam" // Options: marble, beam, pixel, sunset, ring, bauhaus
        colors={colors}
        square={false}
      />
      <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-yellow-400 border-2 border-darkGrassGreen"></div>
    </div>
  );
};

const navigation = [
  // {
  //   title: "Dashboard",
  //   icon: LayoutDashboard,
  //   href: "/userDashboard",
  // },
  {
    title: "Earn",
    icon: BarChart2,
    hasSubmenu: true,
    submenu: [
      {
        title: "Staking",
        href: "/stake",
        description: "Earn rewards by staking your tokens",
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-1.5-2.5-3-2.5" />
            <path d="M15 12c0 1.38 1.5 2.5 3 2.5" />
            <path d="M12 15.5V12" />
            <path d="M4 9.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-15" />
            <path d="M18 16.5V17a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-.5" />
          </svg>
        )
      },
      {
        title: "Lend / Borrow",
        href: "/lending",
        description: "Lend your assets and earn interest",
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22v-7l-2-2" />
            <path d="M17 8.5L12 12l-5-3.5" />
            <path d="M12 22V12" />
            <path d="M20.5 8.5l-8.5 4.5" />
            <path d="M3.5 8.5l8.5 4.5" />
            <path d="M12 2l10 5-10 5L2 7z" />
          </svg>
        )
      }
    ]
  },
  {
    title: "Swap",
    icon: ArrowLeftRightIcon,
    hasSubmenu: true,
    submenu: [
      {
        title: "Stocks",
        href: "/swap?tab=stock&subTab=deposit",
        description: "Trade stocks and equity markets",
        icon: TrendingUp,
      },
      {
        title: "Pools",
        href: "/swap?tab=pool&subTab=deposit",
        description: "Investment pools and liquidity provision",
        icon: Droplets,
      },
      {
        title: "Buy",
        href: "/swap?tab=buy",
        description: "Buy crypto and digital assets",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "Offers",
    icon: FileText,
    href: "/offers",
  },
  {
    title: "Test Mint",
    icon: Activity,
    href: "/mint",
  },
  {
    title: "Points",
    icon: HandHelping,
    href: "/points",
  },
  {
    title: "TVL",
    icon: BarChart2,
    href: "/tvl-dashboard",
  },
];

export function AppHeader({ ...props }: React.HTMLAttributes<HTMLElement>) {
  const { user, address, zfi_balance, balanceLoading, walletType, loading, token } = useUserAccount();
  const { push } = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  // Check if user is authenticated - need both user data and address
  const isAuthenticated = !!user && !!address && !!token;
  const [isOpen, setIsOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

  // Auto-open submenu when on a submenu page
  React.useEffect(() => {
    // Check if we're on a page that should have an open submenu
    if (pathName.includes('/swap') || pathName === '/stake' || pathName === '/lending') {
      if (pathName.includes('/swap')) {
        setOpenSubmenu('Swap');
      } else if (pathName === '/stake') {
        setOpenSubmenu('Earn');
      } else if (pathName === '/lending') {
        setOpenSubmenu('Earn');
      }
    } else {
      // Close submenu when navigating away from submenu pages
      setOpenSubmenu(null);
    }
  }, [pathName, searchParams]);



  // Track window size for responsive adjustments
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Close submenu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only process if a submenu is open
      if (openSubmenu) {
        const target = event.target as Element;
        // Check if the click is outside the submenu container
        if (!target.closest('.submenu-container')) {
          // Delay closing to avoid race conditions
          setTimeout(() => {
            setOpenSubmenu(null);
          }, 50);
        }
      }
    };

    // Use mousedown for better responsiveness
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSubmenu]);

  // Reference to track button elements for dropdown positioning
  const buttonRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Function to toggle submenu
  const toggleSubmenu = React.useCallback((title: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setOpenSubmenu(prev => prev === title ? null : title);
  }, []);

  return (
    <>
      <header
        className="w-full bg-darkGrassGreen text-white flex justify-between items-center px-3 sm:px-4 h-[68px] sticky top-0 z-50 shadow-lg"
        {...props}
      >
        <div className="flex items-center h-full">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2 h-full py-4 mr-2 sm:mr-3 xl:mr-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 relative group">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 76 67"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10"
              >
                <path
                  d="M23.3565 1.46275C24.2084 2.26649 26.3142 4.45264 28.0342 6.3173C31.9885 10.6574 34.8981 13.4223 39.1096 16.8462C46.8415 23.1475 56.7596 27.15 70.2623 29.4005C71.8054 29.6577 73.5736 29.9309 74.2006 29.9792L75.3579 30.0917L75.4544 30.8311C75.583 31.7795 75.583 36.9556 75.4383 37.6146L75.3419 38.1451L73.5576 38.0326C54.6699 36.8913 43.6427 33.6603 34.5766 26.6357C30.0596 23.1314 27.134 20.2862 22.9707 15.3191C20.1576 11.9595 16.2515 7.87654 14.2421 6.17263L13.2937 5.36889L14.5636 4.34011C16.7016 2.62013 20.897 0.016037 21.54 -3.8147e-05C21.6686 -3.8147e-05 22.4884 0.659019 23.3565 1.46275ZM7.26574 14.7083C10.561 15.8335 14.7887 18.1965 17.0391 20.1736C17.3445 20.4308 19.2896 22.3598 21.3793 24.4495C23.4529 26.5231 25.9445 28.8539 26.8929 29.6095C33.387 34.7533 39.9616 37.8075 47.3398 39.0613C50.2493 39.5597 53.7697 39.7043 64.9094 39.8169L75.2293 39.9133L75.1329 40.492C74.9239 41.6654 74.6185 43.0961 74.5703 43.1443C74.5381 43.1604 73.4611 43.7391 72.1752 44.3981C67.3528 46.9058 62.5304 49.96 57.6276 53.625C52.2747 57.6436 48.5776 60.1834 45.6198 61.9356C40.3474 65.0219 34.7373 66.6937 31.1205 66.2275C26.0891 65.5845 20.8649 62.7875 14.0653 57.081C11.4612 54.8949 9.62871 53.1749 5.03136 48.6418L1.62354 45.2822L1.18952 43.4497C0.948402 42.4531 0.803728 41.5851 0.868027 41.5208C1.02877 41.36 2.52372 42.1155 4.16333 43.2247C6.20481 44.591 10.2878 47.7738 15.6728 52.2265C23.2118 58.4634 26.4428 60.0388 31.5063 60.0227C35.7179 60.0227 39.8008 58.7528 46.2146 55.4736C49.3652 53.8661 55.6665 50.3136 55.57 50.2171C55.5379 50.185 54.7502 50.5065 53.834 50.9405C49.4295 53.0141 44.5589 54.6698 40.7492 55.3932C38.6756 55.779 35.5732 55.7468 33.4996 55.3128C28.6289 54.3001 24.5138 52.13 17.5214 46.8897C15.3513 45.2662 15.3834 45.2983 11.6541 41.6494C7.60331 37.6789 4.75809 35.6374 1.3342 34.2229L0.0160738 33.6763L0 32.31C0 31.5545 0.0482235 30.5579 0.0964474 30.1078C0.225045 29.1272 0.0160742 29.1433 2.49157 29.8988C4.5652 30.5418 6.57453 31.3777 8.08555 32.2457C9.35544 32.9691 11.622 34.5444 12.2971 35.1552C12.4739 35.316 13.2777 36.0232 14.0653 36.7305C14.869 37.4378 15.8817 38.3541 16.3158 38.7559C20.7684 42.9032 26.8447 46.7932 31.1044 48.2078C37.1164 50.2011 43.0479 50.1046 53.3517 47.806C59.8138 46.3753 69.764 43.7391 70.1658 43.3694C70.2623 43.2729 70.1819 43.2568 69.9247 43.3051C69.0084 43.5301 63.3823 44.3821 60.8908 44.6875C56.3416 45.2501 52.6605 45.4912 48.5454 45.4912C41.2636 45.4912 37.3092 44.6714 31.7474 41.9709C26.7 39.5275 24.6264 37.8397 16.155 29.3201C11.6702 24.8192 10.7861 24.0155 9.27507 23.0028C7.52293 21.8454 5.41715 20.7684 3.60072 20.1093L2.60409 19.7396L3.08633 18.6787C3.52034 17.7142 5.46538 14.1456 5.56182 14.1456C5.5779 14.1456 6.34948 14.4028 7.26574 14.7083Z"
                  fill="white"
                ></path>
              </svg>
            </div>
            <div className="text-base sm:text-lg md:text-xl font-semibold text-white hidden xs:block">
              <span className="text-white">zybra</span>
            </div>
          </Link>

          {/* Dashboard Button for Small Screens - Visible on xs and sm screens */}
          {isAuthenticated && windowWidth < 768 && (
            <Link
              href="/userDashboard"
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-r from-[#0D2E3D] to-[#142936] hover:from-[#0F3245] hover:to-[#1A3448] transition-all duration-300 mr-2 border border-[#1a3634] shadow-md"
              title="My Dashboard"
            >
              <LayoutDashboard className="h-4 w-4 text-[#4BB6EE]" />
            </Link>
          )}

          {/* Desktop Navigation - Hidden on mobile, visible on md and larger */}
          <nav className="hidden md:flex items-center h-full overflow-x-auto max-w-[calc(100vw-320px)] xl:max-w-[calc(100vw-400px)]">
            {navigation.map((item) => {
              // For items with submenu
             // Replace the existing dropdown implementation with this proper dropdown
// For items with submenu
if (item.hasSubmenu && item.submenu) {
  const isSubmenuOpen = openSubmenu === item.title;
  // Enhanced active state detection for submenu items
  const isActive = item.submenu.some(subItem => {
    // Direct path match
    if (pathName === subItem.href) return true;

    // For swap routes, check if current path starts with /swap and matches the expected tab
    if (subItem.href.includes('/swap')) {
      const currentTab = searchParams?.get('tab');

      // Default stocks page (no tab parameter or tab=stock)
      if (subItem.href === '/swap' && (pathName === '/swap' && (!currentTab || currentTab === 'stock'))) return true;

      // Pool tab
      if (subItem.href.includes('tab=pool') && pathName.includes('/swap') && currentTab === 'pool') return true;

      // Buy tab
      if (subItem.href.includes('tab=buy') && pathName.includes('/swap') && currentTab === 'buy') return true;
    }

    return false;
  });

  return (
    <div key={item.title} className="relative h-full submenu-container group">
      <button
        ref={el => { buttonRefs.current[item.title] = el; return undefined; }}
        className={`flex items-center gap-1 md:gap-1.5 text-xs lg:text-sm font-medium h-full py-4 border-b-2
          ${windowWidth >= 768 && windowWidth < 900
            ? 'px-1.5'
            : windowWidth >= 900 && windowWidth < 1200
              ? 'px-2'
              : 'px-2 lg:px-3 xl:px-4'
          }
          whitespace-nowrap ${
          isActive
            ? "text-white border-white/90"
            : "text-white/80 border-transparent hover:border-white/40"
        }`}
        onClick={(e) => toggleSubmenu(item.title, e)}
        aria-expanded={isSubmenuOpen}
        aria-haspopup="true"
      >
        <item.icon className={`${windowWidth >= 768 && windowWidth < 1024 ? 'h-3.5 w-3.5' : 'h-4 w-4 lg:h-5 lg:w-5'} ${isActive ? 'text-[#4BB6EE]' : 'text-white/70'}`} />
        <span className="truncate max-w-[80px] lg:max-w-none">
          {windowWidth >= 768 && windowWidth < 900
            ? item.title.substring(0, 4) + (item.title.length > 4 ? '.' : '')
            : item.title}
        </span>
        <ChevronDown className={`h-3 w-3 ml-0.5 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu - UPDATED POSITIONING */}
      {isSubmenuOpen && (
        <div
          className="fixed bg-[#0A1721] border border-[#1a3634]/30 rounded-md shadow-lg z-[9999] w-48 animate-fadeIn overflow-hidden"
          style={{
            top: '115px',
            // Center the dropdown under the button
            left: (() => {
              const btn = buttonRefs.current[item.title];
              if (btn) {
                const rect = btn.getBoundingClientRect();
                return rect.left + (rect.width) - 19; // Half of w-48 (192px)
              }
              return 0;
            })()
          }}
        >
          {item.submenu.map(subItem => {
            // Enhanced submenu item active state detection
            const isSubItemActive = (() => {
              // Direct path match
              if (pathName === subItem.href) return true;

              // For swap routes, check if current path starts with /swap and matches the expected tab
              if (subItem.href.includes('/swap')) {
                const currentTab = searchParams?.get('tab');

                // Default stocks page (no tab parameter or tab=stock)
                if (subItem.href === '/swap' && pathName === '/swap' && (!currentTab || currentTab === 'stock')) return true;

                // Pool tab
                if (subItem.href.includes('tab=pool') && pathName.includes('/swap') && currentTab === 'pool') return true;

                // Buy tab
                if (subItem.href.includes('tab=buy') && pathName.includes('/swap') && currentTab === 'buy') return true;
              }

              return false;
            })();
            const SubIcon = subItem.icon;

            return (
              <Link
                key={subItem.title}
                href={subItem.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#142936]/70 transition-colors
                  ${isSubItemActive ? "bg-[#142936] text-[#4BB6EE]" : "text-white/90"}`}
                onClick={() => setOpenSubmenu(null)}
              >
                <div className="w-5 h-5 flex-shrink-0">
                  <SubIcon className={`w-full h-full ${isSubItemActive ? 'text-[#4BB6EE]' : 'text-white/80'}`} />
                </div>
                <span className="truncate">{subItem.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

              // For regular items without submenu
              const isActive = pathName === item.href;
              return (
                <Link
                  key={item.title}
                  href={item.href || '#'}
                  className={`flex items-center gap-1 md:gap-1.5 text-xs lg:text-sm font-medium h-full py-4 border-b-2
                    ${windowWidth >= 768 && windowWidth < 900
                      ? 'px-1.5'
                      : windowWidth >= 900 && windowWidth < 1200
                        ? 'px-2'
                        : 'px-2 lg:px-3 xl:px-4'
                    }
                    whitespace-nowrap ${
                    isActive
                      ? "text-white border-white/90"
                      : "text-white/80 border-transparent hover:border-white/40"
                  }`}
                >
                  <item.icon className={`${windowWidth >= 768 && windowWidth < 1024 ? 'h-3.5 w-3.5' : 'h-4 w-4 lg:h-5 lg:w-5'} ${isActive ? 'text-[#4BB6EE]' : 'text-white/70'}`} />
                  <span className="truncate max-w-[80px] lg:max-w-none">
                    {windowWidth >= 768 && windowWidth < 900
                      ? item.title.substring(0, 4) + (item.title.length > 4 ? '.' : '')
                      : item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {pathName !== "/signup" && (
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 h-full">
            {loading ? (
              <div className="mr-1 md:mr-2">
                <LoadingSpinner className="w-5 h-5" />
              </div>
            ) : (
              <>
                {isAuthenticated && (
                  <>
                    {/* Chain Switcher - Responsive */}
                    <div className="mr-1 sm:mr-2 hidden xs:block">
                      <ChainSwitcher />
                    </div>

                    {/* ZFI Balance - Visible on medium screens and up */}
                    <div className={`hidden ${windowWidth >= 900 ? 'sm:flex' : 'lg:flex'} items-center mr-1 md:mr-2`}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#0D2E3D] to-[#142936] hover:from-[#0F3245] hover:to-[#1A3448] transition-all duration-300 border border-[#1a3634] shadow-lg shadow-[#001525]/20 group">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm group-hover:bg-blue-500/30 transition-all duration-300"></div>
                          <div className="w-4 h-4 relative z-10">
                            <svg
                              viewBox="0 0 76 67"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-full h-full"
                            >
                              <path
                                d="M23.3565 1.46275C24.2084 2.26649 26.3142 4.45264 28.0342 6.3173C31.9885 10.6574 34.8981 13.4223 39.1096 16.8462C46.8415 23.1475 56.7596 27.15 70.2623 29.4005C71.8054 29.6577 73.5736 29.9309 74.2006 29.9792L75.3579 30.0917L75.4544 30.8311C75.583 31.7795 75.583 36.9556 75.4383 37.6146L75.3419 38.1451L73.5576 38.0326C54.6699 36.8913 43.6427 33.6603 34.5766 26.6357C30.0596 23.1314 27.134 20.2862 22.9707 15.3191C20.1576 11.9595 16.2515 7.87654 14.2421 6.17263L13.2937 5.36889L14.5636 4.34011C16.7016 2.62013 20.897 0.016037 21.54 -3.8147e-05C21.6686 -3.8147e-05 22.4884 0.659019 23.3565 1.46275ZM7.26574 14.7083C10.561 15.8335 14.7887 18.1965 17.0391 20.1736C17.3445 20.4308 19.2896 22.3598 21.3793 24.4495C23.4529 26.5231 25.9445 28.8539 26.8929 29.6095C33.387 34.7533 39.9616 37.8075 47.3398 39.0613C50.2493 39.5597 53.7697 39.7043 64.9094 39.8169L75.2293 39.9133L75.1329 40.492C74.9239 41.6654 74.6185 43.0961 74.5703 43.1443C74.5381 43.1604 73.4611 43.7391 72.1752 44.3981C67.3528 46.9058 62.5304 49.96 57.6276 53.625C52.2747 57.6436 48.5776 60.1834 45.6198 61.9356C40.3474 65.0219 34.7373 66.6937 31.1205 66.2275C26.0891 65.5845 20.8649 62.7875 14.0653 57.081C11.4612 54.8949 9.62871 53.1749 5.03136 48.6418L1.62354 45.2822L1.18952 43.4497C0.948402 42.4531 0.803728 41.5851 0.868027 41.5208C1.02877 41.36 2.52372 42.1155 4.16333 43.2247C6.20481 44.591 10.2878 47.7738 15.6728 52.2265C23.2118 58.4634 26.4428 60.0388 31.5063 60.0227C35.7179 60.0227 39.8008 58.7528 46.2146 55.4736C49.3652 53.8661 55.6665 50.3136 55.57 50.2171C55.5379 50.185 54.7502 50.5065 53.834 50.9405C49.4295 53.0141 44.5589 54.6698 40.7492 55.3932C38.6756 55.779 35.5732 55.7468 33.4996 55.3128C28.6289 54.3001 24.5138 52.13 17.5214 46.8897C15.3513 45.2662 15.3834 45.2983 11.6541 41.6494C7.60331 37.6789 4.75809 35.6374 1.3342 34.2229L0.0160738 33.6763L0 32.31C0 31.5545 0.0482235 30.5579 0.0964474 30.1078C0.225045 29.1272 0.0160742 29.1433 2.49157 29.8988C4.5652 30.5418 6.57453 31.3777 8.08555 32.2457C9.35544 32.9691 11.622 34.5444 12.2971 35.1552C12.4739 35.316 13.2777 36.0232 14.0653 36.7305C14.869 37.4378 15.8817 38.3541 16.3158 38.7559C20.7684 42.9032 26.8447 46.7932 31.1044 48.2078C37.1164 50.2011 43.0479 50.1046 53.3517 47.806C59.8138 46.3753 69.764 43.7391 70.1658 43.3694C70.2623 43.2729 70.1819 43.2568 69.9247 43.3051C69.0084 43.5301 63.3823 44.3821 60.8908 44.6875C56.3416 45.2501 52.6605 45.4912 48.5454 45.4912C41.2636 45.4912 37.3092 44.6714 31.7474 41.9709C26.7 39.5275 24.6264 37.8397 16.155 29.3201C11.6702 24.8192 10.7861 24.0155 9.27507 23.0028C7.52293 21.8454 5.41715 20.7684 3.60072 20.1093L2.60409 19.7396L3.08633 18.6787C3.52034 17.7142 5.46538 14.1456 5.56182 14.1456C5.5779 14.1456 6.34948 14.4028 7.26574 14.7083Z"
                                fill="#4BB6EE"
                                className="group-hover:fill-[#5DC4FF] transition-colors duration-300"
                              />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-[#4BB6EE] transition-colors duration-300">
                          {balanceLoading ? (
                            <LoadingSpinner className="w-3 h-3" />
                          ) : zfi_balance !== null && zfi_balance !== undefined ? (
                            zfi_balance.toFixed(2)
                          ) : (
                            "0.00"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Dashboard Button - Visible on medium screens and up */}
                    <div className="hidden md:block mr-1 md:mr-2">
                      <Link
                        href="/userDashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#0D2E3D] to-[#142936] hover:from-[#0F3245] hover:to-[#1A3448] transition-all duration-300 border border-[#1a3634] shadow-lg shadow-[#001525]/20 group"
                        title="My Dashboard"
                      >
                        <div className="relative">
                          <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm group-hover:bg-blue-500/30 transition-all duration-300"></div>
                          <LayoutDashboard className="h-5 w-5 text-[#4BB6EE] relative z-10" />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-[#4BB6EE] transition-colors duration-300">Dashboard</span>
                      </Link>
                    </div>
                  </>
                )}

                {/* User Account Section */}
                <div className="h-full flex items-center">
                  {isAuthenticated ? (
                    <div
                      className="flex items-center gap-1 lg:gap-2 cursor-pointer hover:bg-darkGreen px-2 sm:px-2 lg:px-3 py-2 rounded-lg transition-colors duration-200 h-[48px]"
                      onClick={() => setIsOpen(true)}
                    >
                      {/* User Info - Only show on sm screens and up */}
                      {windowWidth >= 640 && (
                        <div className="hidden sm:flex flex-col items-end">
                          {walletType === WalletType.MINIMAL ? (
                            <>
                              <span className="font-medium text-white text-xs lg:text-sm">
                                {address?.slice(0, 4) + "..." + address?.slice(-4)}
                              </span>
                              <span className="text-[10px] lg:text-xs font-light text-white/70 hidden md:block">
                                {user?.username || "Abstract Wallet"}
                              </span>
                            </>
                          ) : walletType === WalletType.WEB3 ? (
                            <>
                              <span className="font-medium text-white text-xs lg:text-sm">
                                {address?.slice(0, 4) + "..." + address?.slice(-4)}
                              </span>
                              <span className="text-[10px] lg:text-xs font-light text-white/70 hidden md:block">
                                {user?.username || "Web3 Wallet"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-white text-xs lg:text-sm">Wallet</span>
                              <span className="text-[10px] lg:text-xs font-light text-white/70 hidden md:block">Connect</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* User Avatar - Always visible */}
                      <UserAvatar
                        address={address}
                        size={windowWidth < 640 ? "sm" : windowWidth < 1024 ? "sm" : "md"}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2 h-[48px]">
                      <button
                        className="px-2 py-1.5 sm:px-2 sm:py-1.5 lg:px-3 lg:py-2 text-xs font-medium text-white bg-darkBlue hover:bg-darkBlue/60 rounded-lg transition-colors duration-200"
                        onClick={() => push("/signup")}
                      >
                        Sign In
                      </button>
                      <button
                        className="hidden sm:block px-2 py-1.5 lg:px-3 lg:py-2 text-xs font-medium text-white/70 hover:bg-darkBlue/70 hover:text-white rounded-lg transition-colors duration-200"
                        onClick={() => push("/signup")}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="flex md:hidden items-center justify-center p-2 rounded-md text-white bg-darkBlue hover:bg-darkBlue/80 focus:outline-none ml-1"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Mobile Menu - Improved for all screen sizes */}
      {mobileMenuOpen && (
        <div className="mobile-menu fixed inset-0 z-[9999] bg-darkGrassGreen/95 backdrop-blur-sm md:hidden" style={{ overflowY: 'auto' }}>
          <div className="flex flex-col h-full">
            {/* Header with back button */}
            <div className="flex items-center justify-between px-4 h-[68px] border-b border-white/10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-darkGreen/50 transition-colors"
                aria-label="Close menu"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <div className="w-10 h-10"></div> {/* Empty div for balanced layout */}
            </div>

            {/* Chain Switcher for Mobile */}
            {isAuthenticated && (
              <div className="px-4 py-3 border-b border-white/10">
                <ChainSwitcher />
              </div>
            )}

            <div className="flex flex-col flex-1 overflow-y-auto mobile-menu-safe-area">
              <nav className="flex-1 px-4 pt-6 pb-4 space-y-3">
                {navigation.map((item) => {
                  // For items with submenu
                  if (item.hasSubmenu && item.submenu) {
                    const isSubmenuOpen = openSubmenu === item.title;
                    // Enhanced active state detection for submenu items (mobile)
                    const isActive = item.submenu.some(subItem => {
                      // Direct path match
                      if (pathName === subItem.href) return true;

                      // For swap routes, check if current path starts with /swap and matches the expected tab
                      if (subItem.href.includes('/swap')) {
                        const currentTab = searchParams?.get('tab');

                        // Default stocks page (no tab parameter or tab=stock)
                        if (subItem.href === '/swap' && pathName === '/swap' && (!currentTab || currentTab === 'stock')) return true;

                        // Pool tab
                        if (subItem.href.includes('tab=pool') && pathName.includes('/swap') && currentTab === 'pool') return true;

                        // Buy tab
                        if (subItem.href.includes('tab=buy') && pathName.includes('/swap') && currentTab === 'buy') return true;
                      }

                      return false;
                    });

                    return (
                      <div key={item.title} className="space-y-1 submenu-container">
                        <button
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-base font-medium rounded-lg ${
                            isActive || isSubmenuOpen
                              ? "bg-[#022333] text-[#4BB6EE]"
                              : "text-white/90 hover:bg-[#022333]/60 hover:text-white"
                          } transition-colors duration-200`}
                          onClick={(e) => toggleSubmenu(item.title, e)}
                          aria-expanded={isSubmenuOpen}
                          aria-haspopup="true"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-5 w-5 ${isActive || isSubmenuOpen ? 'text-[#4BB6EE]' : 'text-white/80'}`} />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''} ${isActive || isSubmenuOpen ? 'text-[#4BB6EE]' : 'text-white/60'}`} />
                        </button>

                        {/* Mobile Submenu with Animation */}
                        {isSubmenuOpen && (
                          <div className="space-y-1 mt-2 animate-fadeInSubmenu">
                            {item.submenu.map(subItem => {
                              // Enhanced submenu item active state detection (mobile)
                              const isSubItemActive = (() => {
                                // Direct path match
                                if (pathName === subItem.href) return true;

                                // For swap routes, check if current path starts with /swap and matches the expected tab
                                if (subItem.href.includes('/swap')) {
                                  const currentTab = searchParams?.get('tab');

                                  // Default stocks page (no tab parameter or tab=stock)
                                  if (subItem.href === '/swap' && pathName === '/swap' && (!currentTab || currentTab === 'stock')) return true;

                                  // Pool tab
                                  if (subItem.href.includes('tab=pool') && pathName.includes('/swap') && currentTab === 'pool') return true;

                                  // Buy tab
                                  if (subItem.href.includes('tab=buy') && pathName.includes('/swap') && currentTab === 'buy') return true;
                                }

                                return false;
                              })();
                              const SubIcon = subItem.icon;
                              return (
                                <Link
                                  key={subItem.title}
                                  href={subItem.href}
                                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg ml-6 ${
                                    isSubItemActive
                                      ? "bg-[#022333] text-[#4BB6EE] border border-[#4BB6EE]/30"
                                      : "text-white/90 hover:bg-[#022333]/60 hover:text-white border border-white/10"
                                  } transition-colors duration-200`}
                                  onClick={() => {
                                    setOpenSubmenu(null);
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <SubIcon className={`h-5 w-5 ${isSubItemActive ? 'text-[#4BB6EE]' : 'text-white/80'}`} />
                                  <span>{subItem.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // For regular items without submenu
                  const isActive = pathName === item.href;
                  return (
                    <Link
                      key={item.title}
                      href={item.href || '#'}
                      className={`flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-lg ${
                        isActive
                          ? "bg-[#022333] text-[#4BB6EE]"
                          : "text-white/90 hover:bg-[#022333]/60 hover:text-white"
                      } transition-colors duration-200`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-[#4BB6EE]' : 'text-white/80'}`} />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer with User Info */}
              <div className="p-4 mt-auto border-t border-white/10 pt-6">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {/* User Profile Section */}
                    <div className="flex items-center gap-3 p-3 bg-darkGreen/30 rounded-lg">
                      <UserAvatar address={address} size="md" />
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {address?.slice(0, 6) + "..." + address?.slice(-4)}
                        </span>
                        <span className="text-xs text-white/70">
                          {walletType === WalletType.MINIMAL
                            ? (user?.username || "Abstract Wallet")
                            : walletType === WalletType.WEB3
                              ? (user?.username || "Web3 Wallet")
                              : "Wallet"}
                        </span>
                      </div>
                    </div>

                    {/* ZFI Balance for Mobile */}
                    <div className="flex items-center justify-between p-3 bg-[#0D1F29] rounded-lg group hover:bg-[#142936] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 relative">
                          {/* Blue glow effect - always visible */}
                          <div className="absolute -inset-1 bg-[#4BB6EE]/30 rounded-full blur-[4px] opacity-70"></div>

                          {/* Enhanced glow on hover */}
                          <div className="absolute -inset-1 bg-[#4BB6EE]/50 rounded-full blur-[6px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <svg
                            viewBox="0 0 76 67"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-full h-full relative z-10"
                          >
                            <path
                              d="M23.3565 1.46275C24.2084 2.26649 26.3142 4.45264 28.0342 6.3173C31.9885 10.6574 34.8981 13.4223 39.1096 16.8462C46.8415 23.1475 56.7596 27.15 70.2623 29.4005C71.8054 29.6577 73.5736 29.9309 74.2006 29.9792L75.3579 30.0917L75.4544 30.8311C75.583 31.7795 75.583 36.9556 75.4383 37.6146L75.3419 38.1451L73.5576 38.0326C54.6699 36.8913 43.6427 33.6603 34.5766 26.6357C30.0596 23.1314 27.134 20.2862 22.9707 15.3191C20.1576 11.9595 16.2515 7.87654 14.2421 6.17263L13.2937 5.36889L14.5636 4.34011C16.7016 2.62013 20.897 0.016037 21.54 -3.8147e-05C21.6686 -3.8147e-05 22.4884 0.659019 23.3565 1.46275ZM7.26574 14.7083C10.561 15.8335 14.7887 18.1965 17.0391 20.1736C17.3445 20.4308 19.2896 22.3598 21.3793 24.4495C23.4529 26.5231 25.9445 28.8539 26.8929 29.6095C33.387 34.7533 39.9616 37.8075 47.3398 39.0613C50.2493 39.5597 53.7697 39.7043 64.9094 39.8169L75.2293 39.9133L75.1329 40.492C74.9239 41.6654 74.6185 43.0961 74.5703 43.1443C74.5381 43.1604 73.4611 43.7391 72.1752 44.3981C67.3528 46.9058 62.5304 49.96 57.6276 53.625C52.2747 57.6436 48.5776 60.1834 45.6198 61.9356C40.3474 65.0219 34.7373 66.6937 31.1205 66.2275C26.0891 65.5845 20.8649 62.7875 14.0653 57.081C11.4612 54.8949 9.62871 53.1749 5.03136 48.6418L1.62354 45.2822L1.18952 43.4497C0.948402 42.4531 0.803728 41.5851 0.868027 41.5208C1.02877 41.36 2.52372 42.1155 4.16333 43.2247C6.20481 44.591 10.2878 47.7738 15.6728 52.2265C23.2118 58.4634 26.4428 60.0388 31.5063 60.0227C35.7179 60.0227 39.8008 58.7528 46.2146 55.4736C49.3652 53.8661 55.6665 50.3136 55.57 50.2171C55.5379 50.185 54.7502 50.5065 53.834 50.9405C49.4295 53.0141 44.5589 54.6698 40.7492 55.3932C38.6756 55.779 35.5732 55.7468 33.4996 55.3128C28.6289 54.3001 24.5138 52.13 17.5214 46.8897C15.3513 45.2662 15.3834 45.2983 11.6541 41.6494C7.60331 37.6789 4.75809 35.6374 1.3342 34.2229L0.0160738 33.6763L0 32.31C0 31.5545 0.0482235 30.5579 0.0964474 30.1078C0.225045 29.1272 0.0160742 29.1433 2.49157 29.8988C4.5652 30.5418 6.57453 31.3777 8.08555 32.2457C9.35544 32.9691 11.622 34.5444 12.2971 35.1552C12.4739 35.316 13.2777 36.0232 14.0653 36.7305C14.869 37.4378 15.8817 38.3541 16.3158 38.7559C20.7684 42.9032 26.8447 46.7932 31.1044 48.2078C37.1164 50.2011 43.0479 50.1046 53.3517 47.806C59.8138 46.3753 69.764 43.7391 70.1658 43.3694C70.2623 43.2729 70.1819 43.2568 69.9247 43.3051C69.0084 43.5301 63.3823 44.3821 60.8908 44.6875C56.3416 45.2501 52.6605 45.4912 48.5454 45.4912C41.2636 45.4912 37.3092 44.6714 31.7474 41.9709C26.7 39.5275 24.6264 37.8397 16.155 29.3201C11.6702 24.8192 10.7861 24.0155 9.27507 23.0028C7.52293 21.8454 5.41715 20.7684 3.60072 20.1093L2.60409 19.7396L3.08633 18.6787C3.52034 17.7142 5.46538 14.1456 5.56182 14.1456C5.5779 14.1456 6.34948 14.4028 7.26574 14.7083Z"
                              fill="#4BB6EE"
                              className="group-hover:text-[#5DC4FF] transition-colors duration-300"
                            />
                          </svg>
                        </div>
                        <span className="text-base font-medium text-white group-hover:text-[#4BB6EE] transition-colors duration-300">ZFI Balance</span>
                      </div>
                      <span className="text-base font-medium text-white group-hover:text-[#4BB6EE] transition-colors duration-300">
                        {balanceLoading ? (
                          <LoadingSpinner className="w-4 h-4" />
                        ) : zfi_balance !== null && zfi_balance !== undefined ? (
                          zfi_balance.toFixed(2)
                        ) : (
                          "0.00"
                        )}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Dashboard Button */}
                      <Link
                        href="/userDashboard"
                        className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-[#0D2E3D] to-[#142936] hover:from-[#0F3245] hover:to-[#1A3448] text-white rounded-lg transition-all duration-300 border border-[#1a3634] shadow-lg shadow-[#001525]/20 group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="relative">
                          <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm group-hover:bg-blue-500/30 transition-all duration-300"></div>
                          <LayoutDashboard className="h-5 w-5 text-[#4BB6EE] relative z-10" />
                        </div>
                        <span className="font-medium group-hover:text-[#4BB6EE] transition-colors duration-300">My Dashboard</span>
                      </Link>

                      {/* Account Settings Button */}
                      <button
                        className="w-full flex items-center justify-center gap-3 py-3 bg-darkBlue hover:bg-darkBlue/80 text-white rounded-lg transition-colors"
                        onClick={() => {
                          setIsOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <User2 className="h-5 w-5" />
                        <span className="font-medium">Account Settings</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      className="w-full py-3 text-white bg-darkBlue hover:bg-darkBlue/80 rounded-lg transition-colors"
                      onClick={() => {
                        push("/signup");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      className="w-full py-3 text-white/80 hover:text-white bg-transparent hover:bg-darkBlue/30 border border-white/30 rounded-lg transition-colors"
                      onClick={() => {
                        push("/signup");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {isOpen && (
        <WalletModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      )}
    </>
  );
}