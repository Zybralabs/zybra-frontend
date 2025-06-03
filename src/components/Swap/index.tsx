"use client"

import { ArrowLeft, CircleDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState, useEffect, type ChangeEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUserAccount } from "@/context/UserAccountContext"
import { OfferQuery } from "@/hooks/useSwarmQl"
import { useApolloClient, useQuery } from "@apollo/client"
import { useStockIcon } from "@/hooks/useStockIcon"
import { useSwarmVault } from "@/hooks/useSwarmVault"
import { useChainId } from "wagmi"
import { ErrorModal, SuccessModal,  } from "@/components/Modal"
import { USDC_ADDRESS } from "@/constant/addresses"

interface TradeData {
  sellAmount: string
  buyAmount: string
  networkCost: string
  maxAmount: string
  depositAsset: {
    symbol: string
    name: string
    address: string
    decimals: number
  }
  withdrawalAsset: {
    symbol: string
    name: string
    address: string
    decimals: number
  }
}

export default function TakeOffer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const offerId = searchParams?.get("offerId")
  const { address } = useUserAccount()
  const chainId = useChainId()

  const { depositWithOfferId, loading: txLoading, receipt, error: txError, withdraw } = useSwarmVault(chainId)
  
  const [isTrading, setIsTrading] = useState(false)
  const [tradeData, setTradeData] = useState<TradeData | null>(null)
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [price, setPrice] = useState(0)
  const [show, setShow] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalError, setModalError] = useState<Error | null>(null)

  const { data, loading: isLoading, error: queryError } = useQuery(OfferQuery, {
    variables: { id: offerId || '' }
  })

  // Icons for assets
  const BuyIcon = useStockIcon(tradeData?.withdrawalAsset.symbol)
  const SellIcon = useStockIcon(tradeData?.depositAsset?.symbol)

  // Initialize trade data when offer is loaded
  useEffect(() => {
    if (data?.offer) {
      const offerData = data.offer
      const amountIn = parseFloat(offerData.amountIn)
      const amountOut = parseFloat(offerData.amountOut)
      
      if (amountIn > 0) {
        const calculatedPrice = amountOut / amountIn
        setPrice(calculatedPrice)
        setSellAmount("")
        setBuyAmount("0")
      }

      setTradeData({
        sellAmount: offerData.amountIn,
        buyAmount: offerData.amountOut,
        networkCost: "0.0023",
        maxAmount: offerData.availableAmount || offerData.amountIn,
        depositAsset: offerData.depositAsset,
        withdrawalAsset: offerData.withdrawalAsset
      })
    }
  }, [data])

  // Validation utilities
  const isOfferValid = (offer: typeof data.offer): boolean => {
    if (!offer) return false
    
    const currentTime = Math.floor(Date.now() / 1000)
    return (
      !offer.cancelledAt &&
      parseInt(offer.expiryTimestamp) > currentTime &&
      parseFloat(offer.availableAmount) > 0
    )
  }

  const canTakeOffer = (): boolean => {
    if (!data?.offer || !address) return false
    
    return (
      isOfferValid(data.offer) &&
      (!data.offer.isAuth || data.offer.authorizationAddresses.includes(address))
    )
  }

  const calculateBuyAmount = (sellValue: string): string => {
    if (!data?.offer || !sellValue) return "0"
    
    const parsedValue = parseFloat(sellValue)
    if (isNaN(parsedValue) || parsedValue <= 0) return "0"
    
    const calculatedAmount = parsedValue * price
    return calculatedAmount.toFixed(data.offer.withdrawalAsset.decimals)
  }

  const handleSellAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    
    if (!data?.offer) return
    
    const maxAmount = parseFloat(data.offer.amountIn)
    const parsedValue = parseFloat(value || "0")
    
    if (parsedValue > maxAmount) {
      setSellAmount(maxAmount.toString())
      setBuyAmount(calculateBuyAmount(maxAmount.toString()))
    } else {
      setSellAmount(value)
      setBuyAmount(calculateBuyAmount(value))
    }
  }

  const handleMaxClick = () => {
    if (data?.offer) {
      const maxAmount = data.offer.amountIn
      setSellAmount(maxAmount)
      setBuyAmount(calculateBuyAmount(maxAmount))
    }
  }

  const formatAmount = (amount: string | number, decimals: number = 18) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toFixed(decimals)
  }

  const isValidAmount = (amount: string): boolean => {
    const num = parseFloat(amount)
    return !isNaN(num) && num > 0 && num <= parseFloat(data?.offer?.amountIn || "0")
  }

  const getOfferStateMessage = (): string => {
    if (!data?.offer) return "Invalid Offer"
    
    if (data.offer.cancelledAt) return "Offer Cancelled"
    if (parseInt(data.offer.expiryTimestamp) <= Math.floor(Date.now() / 1000)) return "Offer Expired"
    if (parseFloat(data.offer.availableAmount) <= 0) return "No Available Amount"
    if (data.offer.isAuth && !data.offer.authorizationAddresses.includes(address)) return "Not Authorized"
    
    return "Take Offer"
  }

  const handleTrade = async () => {
    if (!data?.offer || !isValidAmount(sellAmount) || !address) return
    
    setIsTrading(true)
    try {
      // Validation checks
      const currentTime = Math.floor(Date.now() / 1000)
      if (parseInt(data.offer.expiryTimestamp) < currentTime) {
        throw new Error("Offer has expired")
      }

      if (data.offer.cancelledAt) {
        throw new Error("Offer has been cancelled")
      }

      if (data.offer.isAuth && !data.offer.authorizationAddresses.includes(address)) {
        throw new Error("Address not authorized to take this offer")
      }
      if(parseFloat(data.offer.availableAmount) <= 0 && data.offer.depositAsset.address === USDC_ADDRESS[chainId]) {
      // Execute trade
      await depositWithOfferId(
        data.offer.depositAsset.address,
        formatAmount(sellAmount),
        tradeData?.withdrawalAsset.symbol ?? "TSLA",
        parseInt(data.offer.id),
        formatAmount(buyAmount),
        false,
        "0x"
      )
    }else{
      withdraw(parseInt(data.offer.id),data.offer.depositAsset.address, Number(sellAmount), tradeData?.depositAsset.symbol ?? "TSLA" , (buyAmount), false, "0x")
    }
      // Show success modal
      setShow(true)
      
      // Reset form after success
      setSellAmount("")
      setBuyAmount("")

    } catch (err) {
      console.error("Trade failed:", err)
      setModalError(err as Error)
      setShowErrorModal(true)
    } finally {
      setIsTrading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-gradient-to-b from-zinc-800 to-zinc-900 text-white shadow-xl rounded-2xl overflow-hidden border border-zinc-700">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white/80 hover:bg-white/10 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Take offer #{offerId}
            </span>
          </div>

          {/* Sell Section */}
          <div className="space-y-2">
            <span className="text-sm text-zinc-400 font-medium">Sell</span>
            <div className="relative">
              {isLoading ? (
                <div className="h-14 w-full animate-pulse rounded-lg bg-zinc-700" />
              ) : (
                <>
                  <input
                    type="text"
                    value={sellAmount}
                    onChange={handleSellAmountChange}
                    className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-2 px-3 bg-zinc-800/50"
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    MAX
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {SellIcon ? <SellIcon /> : <CircleDollarSign className="h-6 w-6 text-blue-400" />}
                <span className="font-medium">
                  {tradeData?.depositAsset.symbol || 'Loading...'}
                </span>
              </div>
              <span className="text-sm text-zinc-400">
                Available:{" "}
                {isLoading ? (
                  <div className="inline-block h-4 w-20 animate-pulse rounded bg-zinc-700" />
                ) : (
                  formatAmount(tradeData?.maxAmount || "0", tradeData?.depositAsset.decimals)
                )}
              </span>
            </div>
          </div>

          {/* Buy Section */}
          <div className="space-y-2">
            <span className="text-sm text-zinc-400 font-medium">Buy</span>
            <div className="text-4xl font-bold tracking-tight">
              {isLoading ? (
                <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-700" />
              ) : (
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                  {formatAmount(buyAmount, data?.offer?.withdrawalAsset.decimals)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {BuyIcon ? <BuyIcon /> : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
                )}
                <span className="font-medium">
                  {tradeData?.withdrawalAsset.symbol || 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-4 border-t border-zinc-700">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Rate:</span>
              <span className="font-medium">
                {!isLoading && tradeData ? (
                  `1 ${tradeData.depositAsset.symbol} = ${price.toFixed(tradeData.withdrawalAsset.decimals)} ${tradeData.withdrawalAsset.symbol}`
                ) : (
                  <div className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-700" />
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Network cost</span>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              ) : (
                <span className="font-medium">
                  {tradeData?.networkCost} {tradeData?.depositAsset.symbol}
                </span>
              )}
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Expires:</span>
              <span className="font-medium">
                {!isLoading && data?.offer ? (
                  new Date(parseInt(data.offer.expiryTimestamp) * 1000).toLocaleString()
                ) : (
                  <div className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-700" />
                )}
              </span>
            </div>

            {data?.offer?.isAuth && (
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>Authorized addresses only</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            disabled={
              isLoading || 
              txLoading || 
              isTrading || 
              !sellAmount ||
              !address ||
              !canTakeOffer()
            }
            onClick={handleTrade}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-lg"
          >
            {isLoading || txLoading || isTrading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
            ) : !address ? (
              "Connect Wallet"
            ) : !canTakeOffer() ? (
              getOfferStateMessage()
            ) : (
              "Take Offer"
            )}
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Trade Failed"
        message={(txError ) || "Something went wrong with your trade"}
      />

      <SuccessModal
        isOpen={show}
        onClose={() => {
          setShow(false)
          router.push('/offers')
        }}
        title="Trade Successful"
        message="Your trade has been successfully executed"
        txHash={receipt?.hash}
      />
    </div>
  )
}