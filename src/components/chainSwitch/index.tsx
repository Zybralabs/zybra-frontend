import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from 'lucide-react';
import { useSwitchChain, useChainId } from 'wagmi';
import { CHAIN_IDS_TO_NAMES } from '@/constant/constant';
import type { SupportedChainId } from '@/constant/addresses';

// Enhanced chain icon component
const ChainIcon = ({ chainId, size = 24 }: { chainId: number; size?: number }) => {
  // Custom network icons based on actual blockchain logos
  const renderNetworkIcon = () => {
    switch (chainId) {
      case 1: // Ethereum
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#627EEA" fillOpacity="0.15"/>
            <path d="M12 6L12 9.65385L15.375 11.3077L12 6Z" fill="#627EEA" fillOpacity="0.8"/>
            <path d="M12 6L8.625 11.3077L12 9.65385L12 6Z" fill="#627EEA"/>
            <path d="M12 16.0769L12 19L15.375 12.3462L12 16.0769Z" fill="#627EEA" fillOpacity="0.8"/>
            <path d="M12 19L12 16.0769L8.625 12.3462L12 19Z" fill="#627EEA"/>
            <path d="M12 15.1154L15.375 11.3846L12 9.73077L12 15.1154Z" fill="#627EEA" fillOpacity="0.8"/>
            <path d="M8.625 11.3846L12 15.1154L12 9.73077L8.625 11.3846Z" fill="#627EEA"/>
          </svg>
        );
      case 137: // Polygon
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#8247E5" fillOpacity="0.15"/>
            <path d="M15.75 9.91669C15.3906 9.70794 14.957 9.59916 14.5176 9.59916C14.0781 9.59916 13.6504 9.70794 13.2851 9.91669L10.207 11.7833L8.33979 12.8333C7.98049 13.0421 7.54686 13.1508 7.10743 13.1508C6.66799 13.1508 6.23436 13.0421 5.87505 12.8333C5.5215 12.6313 5.23269 12.3342 5.03907 11.9766C4.84544 11.6191 4.75397 11.2144 4.77505 10.8083V8.19167C4.75525 7.78783 4.84623 7.38563 5.03815 7.0293C5.23007 6.67296 5.51634 6.37513 5.86729 6.17085C6.22413 5.96211 6.65775 5.85333 7.09724 5.85333C7.53674 5.85333 7.97035 5.96211 8.3272 6.17085L10.207 7.21668L12 8.26252L13.793 7.21668L15.6727 6.17085C16.0295 5.96211 16.4632 5.85333 16.9027 5.85333C17.3422 5.85333 17.7758 5.96211 18.1326 6.17085C18.4836 6.37513 18.7698 6.67296 18.9618 7.0293C19.1537 7.38563 19.2447 7.78783 19.2249 8.19167V10.8083C19.246 11.2144 19.1545 11.6191 18.9609 11.9766C18.7672 12.3342 18.4784 12.6313 18.1249 12.8333C17.7656 13.0421 17.332 13.1508 16.8925 13.1508C16.4531 13.1508 16.0195 13.0421 15.6602 12.8333L13.793 11.7833L12 10.7375L10.207 11.7833L8.33979 12.8333V14.9333L10.1328 16.0083L12 17.0821L13.8672 16.0083L15.6602 14.9625L17.4531 13.9167C17.8098 13.7079 18.2434 13.5992 18.6829 13.5992C19.1224 13.5992 19.556 13.7079 19.9128 13.9167C20.2638 14.1209 20.55 14.4188 20.7419 14.7751C20.9339 15.1315 21.0249 15.5337 21.0051 15.9375V18.5542C21.0249 18.958 20.9339 19.3602 20.7419 19.7165C20.55 20.0729 20.2638 20.3708 19.9128 20.575C19.556 20.7838 19.1224 20.8925 18.6829 20.8925C18.2434 20.8925 17.8098 20.7838 17.4531 20.575L15.6602 19.5292L13.8672 18.4833L12 17.4375L10.1328 18.4833L8.33979 19.5292L6.54688 20.575C6.19004 20.7838 5.75642 20.8925 5.31693 20.8925C4.87743 20.8925 4.44382 20.7838 4.08697 20.575C3.73602 20.3708 3.44974 20.0729 3.25782 19.7165C3.0659 19.3602 2.97492 18.958 2.99472 18.5542V15.9375C2.97492 15.5337 3.0659 15.1315 3.25782 14.7751C3.44974 14.4188 3.73602 14.1209 4.08697 13.9167C4.44382 13.7079 4.87743 13.5992 5.31693 13.5992C5.75642 13.5992 6.19004 13.7079 6.54688 13.9167L8.33979 14.9625L10.1328 16.0083V13.9167L8.33979 12.8333L6.54688 11.7875L4.75397 10.7417C4.39713 10.5329 3.96351 10.4242 3.52402 10.4242C3.08452 10.4242 2.65091 10.5329 2.29406 10.7417C1.94311 10.9459 1.65683 11.2438 1.46491 11.6001C1.27299 11.9565 1.18201 12.3587 1.2018 12.7625V15.3792C1.18201 15.783 1.27299 16.1852 1.46491 16.5415C1.65683 16.8979 1.94311 17.1957 2.29406 17.4C2.65091 17.6088 3.08452 17.7175 3.52402 17.7175C3.96351 17.7175 4.39713 17.6088 4.75397 17.4L6.54688 16.3542L8.33979 15.3083L10.1328 14.2625L11.9257 13.2167L13.7187 12.1708L15.5116 11.125C15.8684 10.9163 16.302 10.8075 16.7415 10.8075C17.181 10.8075 17.6146 10.9163 17.9715 11.125C18.325 11.327 18.6138 11.6241 18.8074 11.9816C19.001 12.3392 19.0925 12.7439 19.0715 13.15V11.7833C19.0925 11.3772 19.001 10.9726 18.8074 10.615C18.6138 10.2574 18.325 9.96033 17.9715 9.75835C17.6146 9.5496 17.181 9.44083 16.7415 9.44083C16.302 9.44083 15.8684 9.5496 15.5116 9.75835L13.7187 10.8042L11.9257 11.85L10.1328 12.8958L8.33979 13.9417L6.54688 14.9875C6.19004 15.1963 5.75642 15.305 5.31693 15.305C4.87743 15.305 4.44382 15.1963 4.08697 14.9875C3.73602 14.7832 3.44974 14.4854 3.25782 14.129C3.0659 13.7727 2.97492 13.3705 2.99472 12.9667V15.5833C2.97364 15.9895 3.06511 16.3942 3.25873 16.7517C3.45236 17.1092 3.74116 17.4064 4.09472 17.6083C4.45402 17.8171 4.88765 17.9259 5.32709 17.9259C5.76653 17.9259 6.20016 17.8171 6.55946 17.6083L8.33979 16.5625L10.1328 15.5167L11.9257 14.4708L13.7187 13.425L15.5116 12.3792L17.3045 11.3333C17.6739 11.1246 18.1075 11.0158 18.547 11.0158C18.9865 11.0158 19.4201 11.1246 19.7895 11.3333C20.1405 11.5376 20.4267 11.8354 20.6187 12.1918C20.8106 12.5482 20.9016 12.9504 20.8818 13.3542V10.7375C20.9029 10.3314 20.8115 9.92675 20.6179 9.56921C20.4242 9.21168 20.1354 8.91458 19.782 8.7126C19.4257 8.50385 18.992 8.39507 18.5525 8.39507C18.113 8.39507 17.6794 8.50385 17.3226 8.7126L15.5297 9.75835L13.7367 10.8042L11.9438 11.85L10.1509 12.8958L8.35792 13.9417L6.56501 14.9875C6.20816 15.1963 5.77455 15.305 5.33505 15.305C4.89556 15.305 4.46194 15.1963 4.1051 14.9875C3.75415 14.7832 3.46787 14.4854 3.27595 14.129C3.08402 13.7727 2.99305 13.3705 3.01284 12.9667V10.35C2.99176 9.94385 3.08324 9.53917 3.27686 9.18163C3.47048 8.8241 3.75929 8.52698 4.11284 8.32502C4.47215 8.11628 4.90577 8.0075 5.34521 8.0075C5.78465 8.0075 6.21828 8.11628 6.57758 8.32502L8.35792 9.37085L10.1509 10.4167L11.9438 11.4625L13.7367 12.5083L15.5297 13.5542L17.3226 14.6C17.6794 14.8088 18.113 14.9175 18.5525 14.9175C18.992 14.9175 19.4257 14.8088 19.782 14.6C20.1354 14.398 20.4242 14.1009 20.6179 13.7434C20.8115 13.3859 20.9029 12.9812 20.8818 12.5751V9.95835C20.9029 9.55219 20.8115 9.14751 20.6179 8.78997C20.4242 8.43244 20.1354 8.13534 19.782 7.93337C19.4257 7.72462 18.992 7.61584 18.5525 7.61584C18.113 7.61584 17.6794 7.72462 17.3226 7.93337L15.5297 8.97918L13.7367 10.025L11.9438 11.0708L10.1509 12.1167L8.35792 13.1625L6.56501 14.2083C6.20816 14.4171 5.77455 14.5258 5.33505 14.5258C4.89556 14.5258 4.46194 14.4171 4.1051 14.2083C3.75415 14.0041 3.46787 13.7062 3.27595 13.3499C3.08402 12.9935 2.99305 12.5913 3.01284 12.1875V9.57085C2.99305 9.16701 3.08402 8.76481 3.27595 8.40847C3.46787 8.05214 3.75415 7.75431 4.1051 7.55002C4.46194 7.34128 4.89556 7.2325 5.33505 7.2325C5.77455 7.2325 6.20816 7.34128 6.56501 7.55002L8.35792 8.59585L10.1509 9.64168L11.9438 10.6875L13.7367 11.7333L15.5297 12.7792L17.3226 13.825C17.6794 14.0338 18.113 14.1425 18.5525 14.1425C18.992 14.1425 19.4257 14.0338 19.782 13.825C20.1354 13.623 20.4242 13.3259 20.6179 12.9684C20.8115 12.6109 20.9029 12.2062 20.8818 11.8V9.18335C20.9029 8.77719 20.8115 8.37252 20.6179 8.01498C20.4242 7.65744 20.1354 7.36034 19.782 7.15837C19.4257 6.94962 18.992 6.84084 18.5525 6.84084C18.113 6.84084 17.6794 6.94962 17.3226 7.15837L15.5297 8.20419L13.7367 9.25001L11.9438 10.2958L10.1509 11.3417L8.35792 12.3875L6.56501 13.4333C6.20816 13.6421 5.77455 13.7508 5.33505 13.7508C4.89556 13.7508 4.46194 13.6421 4.1051 13.4333C3.75415 13.229 3.46787 12.9312 3.27595 12.5749C3.08402 12.2185 2.99305 11.8163 3.01284 11.4125V8.79581C2.99305 8.39198 3.08402 7.98978 3.27595 7.63344C3.46787 7.2771 3.75415 6.97927 4.1051 6.77498C4.46194 6.56624 4.89556 6.45746 5.33505 6.45746C5.77455 6.45746 6.20816 6.56624 6.56501 6.77498L8.35792 7.82081L10.1509 8.86664L11.9438 9.91246L13.7367 10.9583L15.5297 12.0042L15.75 12.1458V9.91669Z" fill="#8247E5"/>
          </svg>
        );
      case 56: // BSC
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#F3BA2F" fillOpacity="0.15"/>
            <path d="M12 6L7.7647 10.2353L9.52941 12L12 9.52941L14.4706 12L16.2353 10.2353L12 6Z" fill="#F3BA2F"/>
            <path d="M6 12L7.76471 13.7647L9.52941 12L7.76471 10.2353L6 12Z" fill="#F3BA2F"/>
            <path d="M12 14.4706L9.52941 12L7.7647 13.7647L12 18L16.2353 13.7647L14.4706 12L12 14.4706Z" fill="#F3BA2F"/>
            <path d="M16.2353 10.2353L14.4706 12L16.2353 13.7647L18 12L16.2353 10.2353Z" fill="#F3BA2F"/>
            <path d="M12.8823 12.8824H11.1176V11.1177H12.8823V12.8824Z" fill="#F3BA2F"/>
          </svg>
        );
      case 8453: // Base
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#0052FF" fillOpacity="0.15"/>
            <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" fill="#0052FF"/>
            <path d="M11.0571 13.6L9.0286 11.6L11.0571 9.6H13.7429L15.7714 11.6L13.7429 13.6H11.0571Z" fill="white"/>
          </svg>
        );
      case 11155111: // Sepolia
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#6174CF" fillOpacity="0.15"/>
            <path d="M12 6L12 9.65385L15.375 11.3077L12 6Z" fill="#6174CF" fillOpacity="0.8"/>
            <path d="M12 6L8.625 11.3077L12 9.65385L12 6Z" fill="#6174CF"/>
            <path d="M12 16.0769L12 19L15.375 12.3462L12 16.0769Z" fill="#6174CF" fillOpacity="0.8"/>
            <path d="M12 19L12 16.0769L8.625 12.3462L12 19Z" fill="#6174CF"/>
            <path d="M12 15.1154L15.375 11.3846L12 9.73077L12 15.1154Z" fill="#6174CF" fillOpacity="0.8"/>
            <path d="M8.625 11.3846L12 15.1154L12 9.73077L8.625 11.3846Z" fill="#6174CF"/>
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#1E88E5" fillOpacity="0.15"/>
            <path d="M12 6C8.7 6 6 8.7 6 12C6 15.3 8.7 18 12 18C15.3 18 18 15.3 18 12C18 8.7 15.3 6 12 6ZM12 16.5C9.5 16.5 7.5 14.5 7.5 12C7.5 9.5 9.5 7.5 12 7.5C14.5 7.5 16.5 9.5 16.5 12C16.5 14.5 14.5 16.5 12 16.5Z" fill="#1E88E5"/>
          </svg>
        );
    }
  };

  return renderNetworkIcon();
};

const ChainSwitcher = () => {
  const { chains, switchChain } = useSwitchChain();
  const chain = useChainId();
  const [open, setOpen] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);

  const handleChainSwitch = async (chainId: number) => {
    try {
      setIsChanging(true);
      await switchChain({ chainId });
      setOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentChain = chain || chains[0];
  const currentChainName = CHAIN_IDS_TO_NAMES[chain as SupportedChainId] || "Unknown";

  // Determine if the current chain is a testnet
  const isTestnet = chains.find(c => c.id === chain)?.testnet || false;

  // Function to determine if we're on a large screen (laptop/desktop)
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  // Update screen size state on mount and resize
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isLargeScreen ? (
          // Enhanced version for laptop and PC displays
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D1F29]/80 hover:bg-[#142936] border border-[#1a3634]/50 shadow-sm transition-all duration-300 group"
            title={`Network: ${currentChainName}`}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ChainIcon chainId={chain} size={20} />
              {isTestnet && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-[#0D2E3D]"></div>
              )}
            </div>
            <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
              {currentChainName}
            </span>
            <ChevronDown className="h-3 w-3 text-white/70 group-hover:text-white transition-colors" />
          </button>
        ) : (
          // Compact version for mobile and tablet
          <button
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#0D1F29]/80 hover:bg-[#142936] border border-[#1a3634]/50 shadow-sm transition-all duration-300 group"
            title={`Network: ${currentChainName}`}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ChainIcon chainId={chain} size={20} />
              {isTestnet && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-[#0D2E3D]"></div>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-white/70 group-hover:text-white transition-colors" />
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[360px] bg-[#0A1721] border border-[#1a3634]/30 text-white rounded-xl p-0 overflow-hidden shadow-xl">
        <DialogHeader className="p-4 border-b border-[#1a3634]/20">
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#142936] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#4BB6EE]"></div>
            </div>
            Select Network
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 max-h-[60vh] overflow-y-auto">
          {chains.map((chainItem) => (
            <Card
              key={chainItem.id}
              onClick={() => handleChainSwitch(chainItem.id)}
              className={`bg-transparent border-0 hover:bg-[#142936]/50
                         transition-all cursor-pointer rounded-lg overflow-hidden mb-1
                         ${currentChain === chainItem.id
                           ? 'bg-[#142936]/70 ring-1 ring-[#4BB6EE]/30'
                           : ''}`}
            >
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <ChainIcon chainId={chainItem.id} size={24} />
                      {chainItem.id === currentChain && (
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#4BB6EE] rounded-full border border-[#0A1721]"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{chainItem.name}</span>
                      <span className="text-xs text-gray-400">
                        {chainItem.testnet ? 'Testnet' : 'Mainnet'}
                      </span>
                    </div>
                  </div>
                  {chainItem.id === currentChain && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#4BB6EE]/10 text-xs text-[#4BB6EE] font-medium">
                      Connected
                    </span>
                  )}
                  {chainItem.testnet && chainItem.id !== currentChain && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/10 text-xs text-[#FFB800]">
                      Testnet
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isChanging && (
          <div className="p-3 bg-[#142936]/50 border-t border-[#1a3634]/20 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-[#4BB6EE] border-t-transparent rounded-full"></div>
            <p className="text-sm text-[#4BB6EE]">
              Switching network...
            </p>
          </div>
        )}

        <div className="p-3 bg-[#0D1F29] border-t border-[#1a3634]/20">
          <p className="text-xs text-gray-400">
            Some networks may require wallet reconnection
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChainSwitcher;