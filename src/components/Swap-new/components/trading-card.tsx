"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon, XIcon, ArrowRightIcon, CheckCircleIcon, BarChart2Icon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradingCardProps {
  FromLogo?: React.ElementType | null;
  fromSymbol: string;
  fromAmount: number;
  ToLogo?: React.ElementType | null;
  toSymbol: string;
  toAmount: number;
  avgPrice: number;
  offers: Array<{
    amount: number;
    price: number;
    total: number;
    offerId: number;
    selected?: boolean;
  }>;
  setCurrentOfferId?: (id: number) => void;
}

export default function TradingCard({
  FromLogo = null,
  fromSymbol,
  fromAmount,
  ToLogo = null,
  toSymbol,
  toAmount,
  avgPrice,
  offers: initialOffers = [],
  setCurrentOfferId = () => {},
}: TradingCardProps) {
  const [activeTab, setActiveTab] = useState<"swap" | "limit">("swap");
  const [isOffersVisible, setIsOffersVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [offers, setOffers] = useState(
    initialOffers.map((offer) => ({ ...offer, selected: true })),
  );

  const toggleOfferVisibility = () => {
    setIsOffersVisible(!isOffersVisible);
  };

  const toggleOfferSelection = (index: number, offerId: number) => {
    setCurrentOfferId(offerId);
    setOffers(
      offers.map((offer, i) => (i === index ? { ...offer, selected: !offer.selected } : offer)),
    );
  };

  return (
    <Card className="bg-[#001C29] rounded-xl border border-[#022e45]/60 shadow-[0_4px_24px_rgba(0,10,20,0.3)] overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-[#013853]/50 p-4 border-b border-[#022e45]/80">
          <h2 className="text-base font-medium text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#4BB6EE] rounded-full"></span>
            Available Offers
          </h2>
        </div>
        
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-white/80 mb-2">Options:</h3>
          
          {/* Swap Instantly Option */}
          <motion.div 
            className={`relative overflow-hidden rounded-lg border ${
              activeTab === "swap" 
                ? "border-[#4BB6EE]/30 bg-[#013853]/30" 
                : "border-[#022e45]/70 bg-[#031D2A]"
            } cursor-pointer`}
            whileHover={{ scale: activeTab !== "swap" ? 1.01 : 1 }}
            onClick={() => setActiveTab("swap")}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {activeTab === "swap" && (
                    <div className="w-1.5 h-1.5 bg-[#4BB6EE] rounded-full"></div>
                  )}
                  <span className="text-sm font-medium text-white">Swap instantly</span>
                </div>
                <span className="text-xs bg-[#4BB6EE]/10 text-[#4BB6EE] px-2 py-0.5 rounded-full">
                  *Executes Instantly
                </span>
              </div>
              
              {activeTab === "swap" && (
                <div className="space-y-4 pt-1">
                  {/* From/To Display */}
                  <div className="flex items-center justify-between bg-[#001425]/70 p-3 rounded-lg">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400">From</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#013853] p-1 rounded-full">
                          {FromLogo ? <FromLogo className="h-4 w-4"/> : <XIcon className="h-4 w-4 text-gray-400"/>}
                        </div>
                        <span className="text-white font-medium">{fromAmount}</span>
                        <span className="text-gray-400">{fromSymbol}</span>
                      </div>
                    </div>
                    
                    <ArrowRightIcon className="h-4 w-4 text-[#4BB6EE]" />
                    
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400">To</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-[#013853] p-1 rounded-full">
                          {ToLogo ? <ToLogo className="h-4 w-4"/> : <XIcon className="h-4 w-4 text-gray-400"/>}
                        </div>
                        <span className="text-white font-medium">{toAmount}</span>
                        <span className="text-gray-400">{toSymbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Offers and Price Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#001425]/70 p-2 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Offers to take:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{offers.filter((o) => o.selected).length}</span>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-[#4BB6EE] hover:text-[#65C7F7] text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOfferVisibility();
                            }}
                          >
                            {isOffersVisible ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#001425]/70 p-2 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Avg. Price:</span>
                        <span className="text-white font-medium">
                          {avgPrice.toFixed(7)} 
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Limit Order Option */}
          <motion.div 
            className={`relative overflow-hidden rounded-lg border ${
              activeTab === "limit" 
                ? "border-[#4BB6EE]/30 bg-[#013853]/30" 
                : "border-[#022e45]/70 bg-[#031D2A]"
            } cursor-pointer`}
            whileHover={{ scale: activeTab !== "limit" ? 1.01 : 1 }}
            onClick={() => setActiveTab("limit")}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {activeTab === "limit" && (
                    <div className="w-1.5 h-1.5 bg-[#4BB6EE] rounded-full"></div>
                  )}
                  <span className="text-sm font-medium text-white">Limit order</span>
                </div>
                <span className="text-xs text-gray-400">Executes when matched</span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Get a better price by placing a Limit. Limits are added to the orderbook and can be
                cancelled at any time.
              </p>
            </div>
          </motion.div>

          {/* Offers Table */}
          {isOffersVisible && activeTab === "swap" && (
            <Collapsible 
              open={isOpen} 
              onOpenChange={setIsOpen}
              className="mt-3 border border-[#022e45]/70 rounded-lg overflow-hidden"
            >
              <div className="bg-[#031D2A] p-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <BarChart2Icon className="h-3.5 w-3.5 text-[#4BB6EE]" />
                  Offers to take
                </h3>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-[#013853]/50 hover:bg-[#013853] rounded-full flex items-center justify-center"
                  >
                    {isOpen ? (
                      <ChevronUpIcon className="h-4 w-4 text-[#4BB6EE]" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-[#4BB6EE]" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="p-3 bg-[#001425]/70">
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 pb-2 border-b border-[#022e45]/40">
                    <div>Select</div>
                    <div>Amount {toSymbol}</div>
                    <div>Price {fromSymbol}</div>
                    <div>Total {fromSymbol}</div>
                  </div>
                  
                  {offers.map((offer, index) => (
                    <div 
                      key={index} 
                      className={`grid grid-cols-4 gap-2 items-center text-xs py-2 border-b border-[#022e45]/20 ${
                        offer.selected ? "bg-[#4BB6EE]/5" : ""
                      }`}
                    >
                      <div>
                        <Checkbox
                          checked={offer.selected}
                          onCheckedChange={() => toggleOfferSelection(index, offer.offerId)}
                          className="border-[#022e45] data-[state=checked]:bg-[#4BB6EE] data-[state=checked]:border-[#4BB6EE] rounded-sm h-3.5 w-3.5"
                        />
                      </div>
                      <span className="text-white">{offer.amount.toFixed(5)}</span>
                      <span className="text-white">{offer.price.toFixed(6)}</span>
                      <span className="text-white">{offer.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}