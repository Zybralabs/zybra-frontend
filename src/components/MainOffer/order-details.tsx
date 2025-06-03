'use client'

import { Button } from "@/components/ui/button"
import { ExternalLink, Share } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

export function OrderDetails({ offer }: { offer: any }) {
  const { toast } = useToast();

  if (!offer) return null;

  return (
    <div className="bg-[#0F172A] p-6 rounded-lg space-y-4 border border-[#2D3B4F]">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow label="Offer ID" value={offer.id} />
        <DetailRow
          label="Offer Maker"
          value={offer.maker}
          copyable
          onCopy={() => {
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
        <DetailRow label="Qualifier" value={offer.specialAddresses?.join(", ") || "--"} />
        <DetailRow
          label="Filled"
          value={`${offer.availableAmount || 0}/${offer.amountIn || 0} ${offer.depositAsset?.symbol || ""}`}
        />
        <DetailRow label="Private Addresses" value={offer.authorizationAddresses?.join(", ") || "--"} />
        <DetailRow
          label="Expiry"
          value={offer.expiryTimestamp ? new Date(offer.expiryTimestamp * 1000).toLocaleString() : "--"}
        />
        <DetailRow
          label="To Sell"
          value={offer.depositAsset?.address}
          copyable
          onCopy={() => {
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
        <DetailRow
          label="To Buy"
          value={offer.withdrawalAsset?.address}
          copyable
          onCopy={() => {
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
        <DetailRow
          label="Price Feed (to sell)"
          value={offer.depositAsset?.priceFeedAddress}
          copyable
          onCopy={() => {
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
        <DetailRow
          label="Price Feed (to buy)"
          value={offer.withdrawalAsset?.priceFeedAddress}
          copyable
          onCopy={() => {
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" className="bg-transparent border-[#2D3B4F] hover:bg-[#1E293B]">
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">Take Offer</Button>
      </div>
    </div>
  );
}

function DetailRow({ 
  label, 
  value, 
  copyable,
  onCopy
}: { 
  label: string
  value: string
  copyable?: boolean 
  onCopy?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-[#64748B]">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-[#E2E8F0]">{value}</span>
        {copyable && (
          <button 
            onClick={() => {
              navigator.clipboard.writeText(value)
              onCopy && onCopy()
            }}
            className="p-0.5 text-[#64748B] hover:text-[#E2E8F0] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

