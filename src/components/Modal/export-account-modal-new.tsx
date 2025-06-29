"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

import { useExportAccount } from "@account-kit/react";

interface ExportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportAccountModal({ isOpen, onClose }: ExportAccountModalProps) {
  // Use the hook directly in the component with proper iframe configuration
  const {
    exportAccount,
    isExported,
    isExporting,
    error,
    ExportAccountComponent
  } = useExportAccount({
    params: {
      iframeContainerId: "turnkey-export-wallet-container"
    }
  });

  const [exportResult, setExportResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportResult(null);
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

  // Effect to move iframe from hidden container to visible recovery phrase section
  useEffect(() => {
    if (!isExported) return;

    const moveIframe = () => {
      const hiddenContainer = document.getElementById('turnkey-export-wallet-container');
      const displayArea = document.getElementById('recovery-phrase-display');
      const iframe = hiddenContainer?.querySelector('iframe');

      if (iframe && displayArea && !iframe.dataset.moved) {
        iframe.dataset.moved = 'true';
        iframe.style.display = 'block';
        iframe.style.width = '100%';
        iframe.style.height = 'auto';
        iframe.style.minHeight = '120px';
        iframe.style.border = 'none';
        iframe.style.background = '#001520';
        displayArea.appendChild(iframe);
      }
    };

    // Try immediately
    moveIframe();

    // Also try after a short delay in case iframe loads later
    const timeout = setTimeout(moveIframe, 100);

    // Set up observer for dynamic iframe creation
    const observer = new MutationObserver(moveIframe);
    const hiddenContainer = document.getElementById('turnkey-export-wallet-container');
    if (hiddenContainer) {
      observer.observe(hiddenContainer, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isExported]);



  const handleExport = () => {
    try {
      setExportResult(null);
      // Call the exportAccount function from the hook
      // This will trigger the export process and update isExported when complete
      exportAccount();
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
        {/* Container MUST exist at top level for Alchemy hook to find it */}
        <div id="turnkey-export-wallet-container" style={{ display: 'none' }}></div>

        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-medium text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Export Wallet
          </h2>

        </div>



        {/* Always show the warning first */}
        <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              <span className="font-medium text-amber-400">Warning:</span> Never share this recovery phrase with anyone. Anyone with this phrase can take control of your wallet.
            </p>
          </div>
        </div>

        {/* Show export button if not exported yet */}
        {!isExported ? (
          <div className="space-y-4">
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
            {/* Success message */}
            {exportResult && exportResult.success && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-green-400">
                  <span className="font-medium">Success:</span> {exportResult.message}
                </p>
              </div>
            )}

            {/* This is where the AccountKit UI will render the recovery phrase */}
            <div className="bg-[#001824]/80 border border-[#003553]/40 rounded-xl p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-white/90">Recovery Phrase</h3>
              </div>

              {/* The recovery phrase will appear here */}
              <div className="bg-[#001520] border border-[#003553]/30 rounded-lg min-h-[120px] relative overflow-hidden">
                {/* This div will contain the iframe content */}
                <div id="recovery-phrase-display" className="w-full h-full min-h-[120px] p-4">
                  <ExportAccountComponent isExported={isExported} />
                </div>
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

        {/* Global styles for the recovery phrase iframe */}
        <style>{`
          /* Hide the iframe in the hidden container initially */
          #turnkey-export-wallet-container iframe {
            display: none !important;
          }

          /* Style the iframe when moved to recovery phrase display */
          #recovery-phrase-display iframe {
            width: 100% !important;
            height: auto !important;
            min-height: 120px !important;
            border: none !important;
            background: #001520 !important;
            border-radius: 0 !important;
          }

          /* Style the iframe content */
          #recovery-phrase-display iframe body {
            background: #001520 !important;
            color: #ffffff !important;
            margin: 0 !important;
            padding: 16px !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }

          /* Style all text elements in the iframe */
          #recovery-phrase-display iframe * {
            color: #ffffff !important;
            background: transparent !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `}</style>


      </DialogContent>
    </Dialog>
  );
}
