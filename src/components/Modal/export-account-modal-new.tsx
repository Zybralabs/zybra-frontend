"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useExportAccount } from "@account-kit/react";

interface ExportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportAccountModal({ isOpen, onClose }: ExportAccountModalProps) {
  // Use the hook directly in the component
  const {
    exportAccount,
    isExported,
    isExporting,
    error,
    ExportAccountComponent
  } = useExportAccount({
    params: {
      iframeContainerId: "export-account-container"
    }
  });
  
  const [exportResult, setExportResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showExportButton, setShowExportButton] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportResult(null);
      setCopySuccess(false);
      setShowExportButton(true);
    }
  }, [isOpen]);
  
  // Handle export completion
  useEffect(() => {
    if (isExported) {
      setExportResult({
        success: true,
        message: "Wallet exported successfully. Your recovery phrase is displayed in the secure area below."
      });
    }
  }, [isExported]);
  
  // Handle export errors
  useEffect(() => {
    if (error) {
      setExportResult({
        success: false,
        error: error.message || "Failed to export wallet. Please try again."
      });
    }
  }, [error]);

  const handleExport = () => {
    try {
      setExportResult(null);
      // Call the exportAccount function from the hook
      // This will trigger the export process and update isExported when complete
      exportAccount();
      setShowExportButton(false);
    } catch (err) {
      setExportResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[420px] p-4 sm:p-5 bg-gradient-to-b from-[#001C29] to-[#00141d] border border-[#0A3655]/30 rounded-xl shadow-[0_0_25px_rgba(0,102,161,0.15)]">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-medium text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Export Wallet
          </h2>
         
        </div>

        <AnimatePresence>
          {copySuccess && (
            <motion.div
              className="absolute top-16 right-5 bg-[#002E47] text-white text-xs py-1 px-3 rounded-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Copied!
            </motion.div>
          )}
        </AnimatePresence>

        {!isExported ? (
          <div className="space-y-4">
            <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  <span className="font-medium text-amber-400">Important:</span> Your recovery phrase is the only way to recover your wallet if you lose access. Store it in a secure location and never share it with anyone.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">Export Your Wallet</h3>
              <p className="text-xs sm:text-sm text-white/60 text-center mb-6">
                This will reveal your private recovery phrase. Make sure no one is watching your screen.
              </p>
              
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm shadow-md shadow-blue-800/10 transition-all duration-300"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  "Reveal Recovery Phrase"
                )}
              </Button>
            </div>

            {exportResult && !exportResult.success && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-red-400">
                  <span className="font-medium">Error:</span> {exportResult.error}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  <span className="font-medium text-amber-400">Warning:</span> Never share this recovery phrase with anyone. Anyone with this phrase can take control of your wallet.
                </p>
              </div>
            </div>

            {/* This is where the AccountKit UI will render the recovery phrase */}
            <div className="bg-[#001824]/80 border border-[#003553]/40 rounded-xl p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-white/80">Recovery Phrase</h3>
              </div>
              
              {/* The ExportAccountComponent will render here */}
              <div className="bg-[#001520] border border-[#003553]/30 rounded-lg p-2.5 sm:p-3">
                <ExportAccountComponent 
                  isExported={isExported}
                  className="w-full min-h-[80px] flex items-center justify-center"
                  iframeCss={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  <span className="font-medium text-green-400">Security tip:</span> Write down this phrase on paper and store it in a secure location. Consider using a hardware wallet for additional security.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                onClick={onClose}
                className="bg-[#001A26] hover:bg-[#002235] text-white border border-[#003553]/50 h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm"
              >
                Done
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden container for AccountKit UI - this is needed for initialization */}
        <div id="export-account-container" className="hidden"></div>
      </DialogContent>
    </Dialog>
  );
}
