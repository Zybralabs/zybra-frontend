import Marquee from "react-fast-marquee";
import { SidebarTrigger } from "../Sidebar/ui/sidebar";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ProfitType } from "@/types/index";
import { BnbIcon, BtcIcon, NvidiaIcon, SolIcon, TeslaIcon, XrpIcon } from "../Icons/index";
import { AppHeader } from "../Sidebar/AppHeader";
const Header = () => {
  const stocks = [
    {
      icon: <NvidiaIcon />,
      text: "$NVDA",
      val: "0.70%",
      type: ProfitType.INC,
    },
    {
      icon: <TeslaIcon />,
      text: "$TSLA",
      val: "2.50%",
      type: ProfitType.DEC,
    },
    {
      icon: <BtcIcon />,
      text: "$BTC",
      val: "1.73%",
      type: ProfitType.DEC,
    },
    {
      icon: <BnbIcon />,
      text: "$BNB",
      val: "4.83%",
      type: ProfitType.DEC,
    },
    {
      icon: <SolIcon />,
      text: "$SOL",
      val: "5.06%",
      type: ProfitType.DEC,
    },
    {
      icon: <XrpIcon />,
      text: "$XRP",
      val: "7.93%",
      type: ProfitType.INC,
    },
  ];
  return (
    <header className="sticky top-0 z-50 flex flex-col items-center border-b border-white/10 bg-darkGrassGreen w-full overflow-hidden">
      {!!stocks?.length && (
        <div className="w-full bg-darkBlue flex items-center py-3 overflow-hidden">
          <div className="flex items-center px-2.5">
            <div className="rounded-full w-2.5 aspect-square border-[3px] border-[#136148] bg-grassGreen"></div>
            <span className="text-grassGreen text-[10px] ml-1 w-max">Live Rates</span>
          </div>
          <Marquee autoFill className="w-full overflow-hidden whitespace-nowrap">
            {stocks.map((stock, i) => (
              <div key={i} className="flex items-center text-white gap-1 mx-3">
                <span className="flex items-center">{stock.icon}</span>
                <span>{stock.text}</span>
                <span
                  className={`flex items-center gap-0.5 ${
                    stock.type === ProfitType.INC ? "text-midGreen" : "text-midRed"
                  }`}
                >
                  {stock.type === ProfitType.INC ? <ArrowUp /> : <ArrowDown />} {stock.val}
                </span>
              </div>
            ))}
          </Marquee>
        </div>
      )}
      <AppHeader />
    </header>
  );
};

export default Header;