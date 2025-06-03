'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ZybraLogoLoader from '@/components/ZybraLogoLoader'
import Image from 'next/image'
import { useMoonPay } from '@/lib/hooks/useMoonpay'
import { useCoinbasePay } from '@/lib/hooks/useCoinbase'
import { useUserAccount } from '@/context/UserAccountContext'
import countriesData from '@/json/countries.json'

const MoonPayBuyWidget = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayBuyWidget),
  { ssr: false },
);

const amounts = [100, 300, 1000]

const paymentProviders = [
  { name: 'Coinbase', methods: 'Debit Card, ACH', icon: '/coinbase-icon.svg' },
  { name: 'MoonPay', methods: 'Venmo, PayPal, Debit Card, and other options', icon: '/moonpay-icon.svg' },
]

const countries = countriesData.map(country => ({
  code: country.abbreviation.toUpperCase(),
  name: country.country
}))

export default function Buy() {
  const [selectedAmount, setSelectedAmount] = useState(300)
  const [showCheckout, setShowCheckout] = useState(false)
  const { address } = useUserAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [selectedProvider, setSelectedProvider] = useState(null)

  const fiatCurrency = 'usd'
  const cryptoCurrency = 'usdc'
  const fiatAmount = selectedAmount

  // MoonPay Hook
  const { configuration: moonPayConfig, loading: moonPayLoading } = useMoonPay({
    walletAddress: address ??"",
    fiatCurrency,
    cryptoCurrency,
    fiatAmount,
  })

  // Coinbase Pay Hook
  const { openCoinbasePay, loading: coinbaseLoading } = useCoinbasePay({
    addresses: { ethereum: [address??""] },
    assets: [cryptoCurrency],
  })

  const handleContinue = () => {
    setShowCheckout(true)
  }

  const handlePaymentSelection = (provider: { name: any; methods?: string; icon?: string; }) => {
    setSelectedProvider(provider.name)

    if (provider.name === 'MoonPay') {
      // Ensure MoonPay logic doesn't re-render unnecessarily
      if (!moonPayConfig) return
      console.log('MoonPay widget configured:', moonPayConfig)
    } else if (provider.name === 'Coinbase') {
      // Trigger Coinbase logic
      openCoinbasePay()
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-900 text-white rounded-lg">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg">Youre buying</h2>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-6xl font-bold mb-2">${selectedAmount}</div>
        <div className="flex space-x-2 mb-4">
          {amounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              variant={selectedAmount === amount ? 'secondary' : 'outline'}
              className={`flex-1 ${selectedAmount === amount ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              ${amount}
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={handleContinue} className="w-full bg-purple-500 hover:bg-purple-600">
        Continue
      </Button>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle>Checkout with</DialogTitle>

          </DialogHeader>
          <div className="space-y-4">
            {paymentProviders.map((provider) => (
              <Button
                key={provider.name}
                onClick={() => handlePaymentSelection(provider)}
                variant="outline"
                className="w-full justify-start text-left bg-gray-800 hover:bg-gray-700 border-gray-700"
              >
                {provider.icon ? (
                  <Image
                    src={provider.icon}
                    alt={`${provider.name} icon`}
                    width={40}
                    height={40}
                    className="mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                )}
                <div>
                  <div className="font-semibold">{provider.name}</div>
                  <div className="text-sm text-gray-400">{provider.methods}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {moonPayConfig && selectedProvider === 'MoonPay' && (
        <MoonPayBuyWidget {...moonPayConfig} />
      )}

      {(isLoading || moonPayLoading || coinbaseLoading) && (
        <Dialog open>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <div className="flex flex-col items-center justify-center gap-4">
              <ZybraLogoLoader size="sm" />
              <span>Processing...</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
