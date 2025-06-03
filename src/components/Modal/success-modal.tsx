"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink, X } from 'lucide-react'
import type { StatusModalProps } from "@/types"
import { evmChains } from "@/config"
import { ChainId } from "@uniswap/sdk-core"
import { motion } from "framer-motion"

export function SuccessModal({ isOpen, onClose, title, message, txHash, chainId }: StatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
        {/* Main Card with gradient border */}
        <div className="relative rounded-xl overflow-hidden">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#002b3e] to-[#001a27] z-0"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6">
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-[#01243a]/80 hover:bg-[#01243a] transition-colors text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center gap-5 pt-2">
              {/* Success Icon with animation */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="h-20 w-20 rounded-full bg-[#ceffcf]/10 flex items-center justify-center border-2 border-[#4ade80]/20"
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-[#4ade80]" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              
              {/* Title and message */}
              <div className="text-center space-y-2">
                <motion.h2 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl text-white font-semibold tracking-tight"
                >
                  {title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-white/70"
                >
                  {message}
                </motion.p>
              </div>

              {/* Transaction link */}
              {txHash && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full"
                >
                  <a
                    href={`${evmChains[chainId || 85432].blockExplorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#01243a] hover:bg-[#013456] transition-colors text-[#4BB6EE] w-full"
                  >
                    <span className="text-sm font-medium">View on Explorer</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </motion.div>
              )}

              {/* Close button */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae] py-5 text-white font-medium rounded-lg" 
                  onClick={onClose}
                >
                  Close
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Decorative success pulse */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-64 h-64 rounded-full bg-[#4ade80]/5"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}