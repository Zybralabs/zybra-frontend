"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const useOnboarding = () => {
  return {
    setCurrentStep: (step: string) => console.log(`Setting current step to: ${step}`),
  };
};

interface Network {
  name: string;
  logo: string;
  id: string;
  chainId: number;
}

// Import the properly typed components
import { Button, Card, CardHeader, CardContent, CardTitle } from "@/components/Kyc/Card";

export default function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const router = useRouter();
  const { setCurrentStep } = useOnboarding();

  const networks: Network[] = [
    {
      name: "Ethereum",
      logo: "/icons/eth.png",
      id: "ethereum",
      chainId: 1,
    },
    {
      name: "Centrifuge",
      logo: "/icons/centrifuge.png",
      id: "centrifuge",
      chainId: 2031,
    },
    {
      name: "Base",
      logo: "/icons/base.png",
      id: "base",
      chainId: 8453,
    },
    {
      name: "Arbitrum One",
      logo: "/icons/arbitrum.png",
      id: "arbitrum",
      chainId: 42161,
    },
    {
      name: "Celo",
      logo: "/icons/celo.png",
      id: "celo",
      chainId: 42220,
    },
  ];

  const handleWalletConnect = async (network: Network) => {
    setSelectedNetwork(network);
    setIsConnecting(true);

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to connect wallet");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (switchError: unknown) {
        if ((switchError as any).code === 4902) {
          throw new Error(`Please add the ${network.name} network to your wallet`);
        }
        throw switchError;
      }

      console.log(
        `Wallet Connected: Successfully connected to ${network.name} with account ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      );

      setCurrentStep("investor-type");
      router.push("/kyc/onboarding/investor-type");
    } catch (error: unknown) {
      console.error("Connection Failed:", (error as Error).message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNext = () => {
    setCurrentStep("investor-type");
    router.push("/kyc/onboarding/investor-type");
  };

  return (
    <Card className="w-full px-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Link wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 mt-4">
        <p className="text-xl text-gray-400">
          Choose your network and wallet to connect with Centrifuge
        </p>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Choose your network</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {networks.map((network) => (
              <Button
                key={network.id}
                variant="default"
                className={`flex h-auto flex-col items-center gap-2 p-4 border-transparent ${
                  selectedNetwork?.id === network.id ? "border-blue-600" : ""
                }`}
                disabled={isConnecting}
                // onClick={() => handleWalletConnect(network)}
                onClick={handleNext}
              >
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={network.logo || "/placeholder.svg"}
                    alt={`${network.name} logo`}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium">{network.name}</span>
                {isConnecting && selectedNetwork?.id === network.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
