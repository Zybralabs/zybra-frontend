"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import ZybraLogoLoader from "../ZybraLogoLoader"
import type { StatusModalProps } from "@/types"

export function LoadingModal({ isOpen, onClose, title, message, loadingText }: StatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] p-6 bg-darkGreen">
        <div className="flex flex-col items-center gap-4">
          <ZybraLogoLoader size="md" />

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            {loadingText && (
              <p className="text-sm text-muted-foreground animate-pulse">
                {loadingText}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

