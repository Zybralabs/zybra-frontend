"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { XCircle, AlertTriangle, X } from 'lucide-react'
import type { StatusModalProps } from "@/types"
import { motion } from "framer-motion"

export function ErrorModal({
  isOpen = false,
  onClose = () => {},
  title = "Error",
  message = "Something went wrong",
  errorCode,
}: StatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
        {/* Main Card with gradient border */}
        <div className="relative rounded-xl overflow-hidden">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b1720] to-[#1c0d14] z-0"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6">
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-[#3a1721]/80 hover:bg-[#3a1721] transition-colors text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center gap-5 pt-2">
              {/* Error Icon with animation */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="h-20 w-20 rounded-full bg-[#ffd1d1]/10 flex items-center justify-center border-2 border-[#f87171]/20"
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <AlertTriangle className="h-10 w-10 text-[#f87171]" strokeWidth={1.5} />
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
                
                {/* Error code if present */}
                {errorCode && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3"
                  >
                    <span className="text-xs font-mono px-2.5 py-1.5 rounded-md bg-[#3a1721] text-white/70">
                      Error Code: {errorCode}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Dismiss button */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full mt-2"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-[#f43f5e] to-[#9f1239] hover:from-[#fb7185] hover:to-[#be123c] py-5 text-white font-medium rounded-lg border-none" 
                  onClick={onClose}
                >
                  Dismiss
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Decorative error pulse */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-64 h-64 rounded-full bg-[#f87171]/5"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}