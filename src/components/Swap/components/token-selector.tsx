import { useState } from 'react'
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { X, Search } from 'lucide-react'
import Image from 'next/image'

interface Token {
    id: string
    name: string
    symbol: string
    logoURI: string
    address: string
    chainId: number
    decimals: number
    balance: number
  }
  
  const tokenList: Token[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      chainId: 1,
      decimals: 18,
      balance: 1.5
    },
    {
      id: 'usd-coin',
      name: 'USD Coin',
      symbol: 'USDC',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      decimals: 6,
      balance: 1000
    },
    {
      id: '0x',
      name: '0x Protocol Token',
      symbol: 'ZRX',
      logoURI: 'https://assets.coingecko.com/coins/images/863/small/0x.png',
      address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
      chainId: 1,
      decimals: 18,
      balance: 500
    },
    {
      id: '1inch',
      name: '1inch',
      symbol: '1INCH',
      logoURI: 'https://assets.coingecko.com/coins/images/13469/small/1inch-token.png',
      address: '0x111111111117dC0aa78b770fA6A738034120C302',
      chainId: 1,
      decimals: 18,
      balance: 250
    },
    {
      id: 'aave',
      name: 'Aave',
      symbol: 'AAVE',
      logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      chainId: 1,
      decimals: 18,
      balance: 100
    },
  ]
  
  interface TokenSelectorProps {
    onSelect: (token: Token) => void
    onClose: () => void
  }
  
  export default function TokenSelector({ onSelect, onClose }: TokenSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')
  
    const filteredTokens = tokenList.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
        <Card className="w-full max-w-md bg-[#191B1F] border-[#2C2F36]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium text-white">Select a token</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search name or paste address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#212429] border-[#2C2F36] pl-10 text-white"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTokens.map((token) => (
                  <Button
                    key={token.id}
                    variant="ghost"
                    className="w-full justify-start hover:bg-[#2C2F36]"
                    onClick={() => onSelect(token)}
                  >
                    <Image
                      src={token.logoURI}
                      alt={token.name}
                      width={24}
                      height={24}
                      className="mr-2 rounded-full"
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white">{token.name}</span>
                      <span className="text-xs text-zinc-400">{token.symbol}</span>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-sm text-white">{token.balance}</span>
                      <span className="text-xs text-zinc-400 block">{token.symbol}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  