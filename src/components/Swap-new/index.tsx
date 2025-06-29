"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "./components/card";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadAssets } from "@/state/application/hooks";
import Swap from "./Swap";
import BuyCrypto from "./BuyCrypto";
import { useSearchParams, useRouter } from "next/navigation";
import PoolInvestPage from "./Swap-Pool";
import { ChevronDown } from "lucide-react";

type TabContent = {
  [key: string]: JSX.Element | null;
};

type MainTab = "stock" | "pool" | "buy";
type SubTab = "deposit" | "withdraw";

export default function SwapBuyPage() {
  const [mainTab, setMainTab] = useState<MainTab>("stock");
  const [stockSubTab, setStockSubTab] = useState<SubTab>("deposit");
  const [poolSubTab, setPoolSubTab] = useState<SubTab>("deposit");
  const [isAnimating, setIsAnimating] = useState(false);
  const [navType, setNavType] = useState<"main" | "sub">("main");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadAssets = useLoadAssets();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Reference for dropdown positioning
  const dropdownButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadAssets({
      first: 10,
      skip: 0,
      orderBy: "name",
      orderDirection: "asc"
    });
  }, [loadAssets]);

  // Handle URL params for navigation
  useEffect(() => {
    const mainTabParam = searchParams?.get('tab') as MainTab;
    const subTabParam = searchParams?.get('subTab') as SubTab;
    
    if (mainTabParam && ["stock", "pool", "buy"].includes(mainTabParam)) {
      setMainTab(mainTabParam);
      setNavType("sub");
      
      if (subTabParam && ["deposit", "withdraw"].includes(subTabParam)) {
        if (mainTabParam === "stock") {
          setStockSubTab(subTabParam);
        } else if (mainTabParam === "pool") {
          setPoolSubTab(subTabParam);
        }
      }
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && dropdownButtonRef.current && !dropdownButtonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  // Handle dropdown item selection
  const handleDropdownSelect = useCallback((main: MainTab, sub?: SubTab) => {
    setMainTab(main);
    if (sub) {
      if (main === "stock") {
        setStockSubTab(sub);
      } else if (main === "pool") {
        setPoolSubTab(sub);
      }
    }
    updateUrl(main, sub);
    setIsDropdownOpen(false);
  }, []);

  // Update URL when tabs change
  const updateUrl = (main: MainTab, sub?: SubTab) => {
    let url = `?tab=${main}`;
    if (sub && (main === "stock" || main === "pool")) {
      url += `&subTab=${sub}`;
    }
    router.push(url, { scroll: false });
  };

  // Handle main tab change with animation lock
  const handleMainTabChange = (tab: MainTab) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setMainTab(tab);
    
    // Add a slight delay before showing second row for a smoother transition
    setTimeout(() => {
      setNavType("sub");
      setIsAnimating(false);
      
      // Update URL
      if (tab === "stock") {
        updateUrl(tab, stockSubTab);
      } else if (tab === "pool") {
        updateUrl(tab, poolSubTab);
      } else {
        updateUrl(tab);
      }
    }, 300);
  };

  // Toggle back to main navigation
  const toggleMainNav = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      setNavType("main");
      setIsAnimating(false);
    }, 200);
  };

  // Handle sub tab change with animation lock
  const handleStockSubTabChange = (tab: SubTab) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStockSubTab(tab);
    setTimeout(() => {
      updateUrl("stock", tab);
      setIsAnimating(false);
    }, 200);
  };

  const handlePoolSubTabChange = (tab: SubTab) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPoolSubTab(tab);
    setTimeout(() => {
      updateUrl("pool", tab);
      setIsAnimating(false);
    }, 200);
  };

  // Get current content based on selected tabs
  const getTabContent = () => {
    if (mainTab === "buy") {
      return <BuyCrypto />;
    }
    
    if (mainTab === "stock") {
      return stockSubTab === "deposit" 
        ? <Swap isWithdraw={false} setActiveTab={(tab) => handleStockSubTabChange(tab as SubTab)} />
        : <Swap isWithdraw={true} setActiveTab={(tab) => handleStockSubTabChange(tab as SubTab)} />;
    }
    
    if (mainTab === "pool") {
      return poolSubTab === "deposit"
        ? <PoolInvestPage isWithdraw={false} setActiveTab={(tab) => handlePoolSubTabChange(tab as SubTab)} />
        : <PoolInvestPage isWithdraw={true} setActiveTab={(tab) => handlePoolSubTabChange(tab as SubTab)} />;
    }
    
    return null;
  };

  // Main tabs configuration
  const mainTabs = [
    { id: "stock", label: "STOCKS" },
    { id: "pool", label: "POOLS" },
    { id: "buy", label: "BUY" }
  ];

  // Sub tabs configuration
  const subTabs = [
    { id: "deposit", label: "Deposit" },
    { id: "withdraw", label: "Withdraw" }
  ];

  // Function to determine the width based on the active tab
  const getContainerWidth = () => {
    if (mainTab === "buy") {
      return "max-w-md"; // Narrow for Buy screen
    } else if (mainTab === "pool") {
      return "max-w-2xl"; // Medium for Pool screen
    } else {
      return "max-w-4xl"; // Wide for Stock screens
    }
  };
  
  // Animation variants
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.3,
        ease: "easeIn" 
      }
    }
  };
  
  const contentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.5
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.97,
      transition: { 
        duration: 0.3,
        ease: "easeIn" 
      }
    }
  };
  
  const featuresVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        delay: 0.2,
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.3
      }
    }
  };
  
  const featureItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4
      }
    }
  };

  return (
    <div className="flex-1 w-full text-white flex justify-center items-start py-6 px-4">
      <div className={`w-full ${getContainerWidth()}`}>
        {/* Navigation Tabs */}
        <AnimatePresence mode="wait">
  {navType === "main" ? (
    <motion.div
      key="main-nav"
      variants={navVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mb-6 flex justify-center z-40 px-2 w-full"
    >
      <div className="relative bg-[#001C29]/90 backdrop-blur-md border border-[#034a70]/50 rounded-full p-1 w-full max-w-xs shadow-[0_6px_20px_rgba(0,20,40,0.25)]">
        <div className="relative flex items-center">
          {/* Animated selection indicator */}
          <motion.div
            className="absolute bg-[#013853] rounded-full h-10 shadow-lg"
            style={{ width: '33.33%' }}
            animate={{
              x: mainTab === "stock"
                ? "0%"
                : mainTab === "pool"
                ? "100%"
                : "200%"
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 28,
              mass: 1
            }}
          />
          
          {/* Main tab buttons - simplified for mobile */}
          {mainTabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`relative flex-1 text-center py-2 transition-all font-medium text-xs ${
                mainTab === tab.id 
                  ? "text-white" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => handleMainTabChange(tab.id as MainTab)}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.div
      key="secondary-nav"
      variants={navVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mb-6 px-2 w-full"
    >
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center w-full">
        {/* Back button - Made more touch-friendly */}
        <motion.button
          className="flex items-center justify-center h-10 px-4 text-white bg-[#013853] rounded-full w-full sm:w-auto mb-2 sm:mb-0"
          onClick={toggleMainNav}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium text-sm">{mainTab === "stock" ? "STOCKS" : mainTab === "pool" ? "POOLS" : "BUY"}</span>
        </motion.button>
        
        {/* Conditional rendering based on tab */}
        {mainTab !== "buy" ? (
          <div className="flex w-full">
            <div className="bg-[#001824]/90 backdrop-blur-md border border-[#034a70]/60 rounded-full p-1 shadow-[0_4px_12px_rgba(0,20,40,0.2)] flex-1">
              <div className="relative flex items-center">
                {/* Animated selection indicator for sub tabs */}
                <motion.div
                  className="absolute bg-[#02283e] rounded-full h-8 shadow-inner"
                  style={{ width: '50%' }}
                  animate={{
                    x: (mainTab === "stock" ? stockSubTab : poolSubTab) === "deposit" ? "0%" : "100%"
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 28, 
                    mass: 0.8 
                  }}
                />
                
                {/* Sub tab buttons */}
                {subTabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    className={`relative flex-1 text-center py-1.5 transition-all text-xs font-medium ${
                      (mainTab === "stock" ? stockSubTab : poolSubTab) === tab.id
                        ? "text-white" 
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                    onClick={() => {
                      if (mainTab === "stock") {
                        handleStockSubTabChange(tab.id as SubTab);
                      } else {
                        handlePoolSubTabChange(tab.id as SubTab);
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* BUY button */}
            <motion.button
              className="ml-2 px-4 py-2 font-medium text-xs text-white bg-[#013853] rounded-full"
              onClick={() => handleMainTabChange("buy")}
              whileTap={{ scale: 0.95 }}
            >
              BUY
            </motion.button>
          </div>
        ) : (
          <motion.div 
            className="flex-1 flex justify-center items-center bg-[#001824]/90 backdrop-blur-md border border-[#034a70]/60 rounded-full p-3 ml-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-base font-medium">BUY CRYPTO</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mainTab}-${mainTab === "stock" ? stockSubTab : mainTab === "pool" ? poolSubTab : ""}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full z-30"
          >
            <Card 
              className={`w-full mx-auto max-w-6xl relative border border-[#022e45]/60 rounded-xl shadow-[0_8px_32px_rgba(0,20,40,0.3)] overflow-hidden ${mainTab === "buy" ? "max-w-xl mx-auto" : ""}`}
            >
              {/* Background image with low opacity */}
              <div 
                className="absolute inset-0 z-0" 
                style={{
                  backgroundImage: "url('/img/brand.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.42, 
                }}
              />
              
              {/* Gradient overlay on top of the background image */}
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#001425]/90 to-[#00192d]/95 backdrop-blur-md" />
              
              {/* Using inline style for precise control */}
              <div 
                className="relative " 
                style={{ 
                  paddingTop: "14px", 
                  paddingLeft: "14px", 
                  paddingRight: "10px", 
                  paddingBottom: "10px" 
                }}
              >
                <div className="grid grid-cols-1 gap-3">
                  {getTabContent()}
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Feature benefits section */}
        <AnimatePresence>
          {(mainTab === "stock" || mainTab === "pool") && (
            <motion.div 
              variants={featuresVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 z-20"
            >
              <motion.div 
                variants={featureItemVariants} 
                className="bg-[#001824]/80 rounded-xl p-4 border border-[#022e45]/40 hover:border-[#034a70]/60 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,40,80,0.2)]"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="w-10 h-10 rounded-full bg-[#013853]/50 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#4BB6EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-[#4BB6EE] font-medium mb-1">Secure Transactions</h3>
                <p className="text-white/70 text-sm">All transactions are securely processed with state-of-the-art encryption.</p>
              </motion.div>
              
              <motion.div 
                variants={featureItemVariants}
                className="bg-[#001824]/80 rounded-xl p-4 border border-[#022e45]/40 hover:border-[#034a70]/60 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,40,80,0.2)]"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="w-10 h-10 rounded-full bg-[#013853]/50 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#4BB6EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-[#4BB6EE] font-medium mb-1">High Yield Returns</h3>
                <p className="text-white/70 text-sm">Earn competitive interest rates on your deposits in our liquidity pools.</p>
              </motion.div>
              
              <motion.div 
                variants={featureItemVariants}
                className="bg-[#001824]/80 rounded-xl p-4 border border-[#022e45]/40 hover:border-[#034a70]/60 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,40,80,0.2)]"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="w-10 h-10 rounded-full bg-[#013853]/50 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#4BB6EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-[#4BB6EE] font-medium mb-1">Instant Swaps</h3>
                <p className="text-white/70 text-sm">Trade your assets seamlessly with minimal slippage and low transaction fees.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}