import Image from "next/image";

import { Bitcoin } from "./components";
const Header = () => {
  const bitcoin_data: {
    image: string;
    name: string;
    percentage: number;
    arrowPositon: "up" | "down";
  }[] = [
    {
      image: "/img/nvda.png",
      name: "$NVDA",
      arrowPositon: "up",
      percentage: 0.7,
    },
    {
      image: "/img/tsla.png",
      name: "$TSLA",
      arrowPositon: "down",
      percentage: 2.5,
    },
    {
      image: "/img/bitcoin.png",
      name: "$BTC",
      arrowPositon: "down",
      percentage: 1.75,
    },
    {
      image: "/img/eth.png",
      name: "$ETH",
      arrowPositon: "down",
      percentage: 1.75,
    },
    {
      image: "/img/bnb.png",
      name: "$BNB",
      arrowPositon: "down",
      percentage: 1.75,
    },
    {
      image: "/img/sol.png",
      name: "$SOL",
      arrowPositon: "down",
      percentage: 1.75,
    },
    {
      image: "/img/xrp.png",
      name: "$XRP",
      arrowPositon: "up",
      percentage: 1.75,
    },
    {
      image: "/img/nvda.png",
      name: "$NVDA",
      arrowPositon: "up",
      percentage: 1.75,
    },
    {
      image: "/img/tsla.png",
      name: "$TSLA",
      arrowPositon: "up",
      percentage: 1.75,
    },
    {
      image: "/img/bitcoin.png",
      name: "$BTC",
      arrowPositon: "up",
      percentage: 1.75,
    },
  ];
  return (
    <div className="bg-primary h-[79px] flex justify-between py-4">
      <Image src="/img/logo.png" alt="logo" width={93} height={28} className="pl-4" />
      <div className="flex gap-6 px-6">
        <div className="bg-secondary w-[70vw] rounded-[10px] flex  items-center overflow-hidden gap-2 px-4">
          <div className="flex gap-2 items-center w-[100px]">
            <div className="w-3 h-3 flex justify-center items-center rounded-full bg-[#05966980]">
              <div className="w-[6px] h-[6px] bg-[#059669] rounded-full"></div>
            </div>
            <span className="text-xs text-[#059669] font-red-hat">Live Rates</span>
          </div>
          <div className="scroll-container">
            <div className="scroll-content">
              {bitcoin_data.map((item, index) => (
                <Bitcoin key={index} {...item} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 ">
          <div className="header-icon-box">
            <Image src="/icons/search.png" alt="icon1" width={16} height={16} />
          </div>
          <div className="header-icon-box">
            <Image src="/icons/bell.png" alt="icon1" width={16} height={16} />
          </div>
          <div className="header-icon-box">
            <Image src="/icons/setting.png" alt="icon1" width={16} height={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
