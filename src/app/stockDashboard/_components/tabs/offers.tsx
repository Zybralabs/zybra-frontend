import { TeslaFilledIcon, USDCIcon } from "@/components/Icons";
import {
  ArrowRightLeft,
  ChevronDown,
  LinkIcon,
  Share2Icon,
  SquareArrowOutUpRight,
} from "lucide-react";
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { shortenText } from "@/utils/formatters";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import { useRouter } from "next/navigation";

// Completed, Partially filled, Not filled, Cancelled
export enum StatusEnum {
  Completed = "Completed", // green
  "Partially Filled" = "Partially Filled", // blue
  "Not Filled" = "Not Filled", // text
  Cancelled = "Cancelled",
  Private = "Private", // red
}

const Offers = () => {

  const route = useRouter()
  const tabs = [
    {
      name: "All Offers",
      id: "all-offers",
    },
    {
      name: "My Offers",
      id: "my-offers",
    },
    {
      name: "Private Offers",
      id: "private-offers",
    },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const data = [
    {
      type: "TSLA",
      sell: 0.6107,
      price: 422.2639,
      status: StatusEnum["Not Filled"],
      buy: 257.98463,
      offerId:1
    },
    {
      type: "TSLA",
      sell: 0.6107,
      price: 422.2639,
      status: StatusEnum.Completed,
      buy: 257.98463,
      offerId:1

    },
    {
      type: "TSLA",
      sell: 0.6107,
      price: 422.2639,
      status: StatusEnum.Completed,
      buy: 257.98463,
      offerId:1

    },
  ];
  return (
    <div className="mt-10 xl:mt-20 w-full xl:max-w-[1000px] 2xl:max-w-[1294px] mx-auto">
      <ul className="flex items-center gap-10">
        {tabs.map((tab, i) => (
          <li
            key={i}
            className={`${activeTab === tab.id ? "text-[#4BB6EE] border-[#4BB6EE]" : "text-white border-transparent"} border-b-2 cursor-pointer text-lg`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 xl:gap-5 2xl:gap-8 text-whitish max-w-[700px] mt-10 ml-auto">
        <div className="flex-[2] flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="min-w-max text-sm">To Buy</span>
            <Dropdown
              onChange={() => {}}
              optionsClass=""
              selectClass="border-0 outline-0 px-3 py-1.5 gap-2 text-sm text-left"
              options={["All", "New"]}
              value="All"
            />
          </div>
          <ArrowRightLeft size={12} />
          <div className="flex-1 flex items-center gap-1.5">
            <span className="min-w-max text-sm">To Buy</span>
            <Dropdown
              onChange={() => {}}
              optionsClass=""
              selectClass="border-0 outline-0 px-3 py-1.5 gap-2 text-sm"
              options={["All", "New"]}
              value="All"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <span className="w-max text-sm">Status</span>
          <Dropdown
            onChange={() => {}}
            optionsClass=""
            selectClass="border-0 outline-0 px-3 py-1.5 gap-2 text-sm"
            options={["Filled", "Not Filled"]}
            value="Not Filled"
          />
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <span className="w-max text-sm">Time</span>
          <Dropdown
            onChange={() => {}}
            optionsClass=""
            selectClass="border-0 outline-0 px-3 py-1.5 gap-2 text-sm"
            options={["Time Range", "Date Range"]}
            value="Time Range"
          />
        </div>
      </div>
      <Accordion type="single" collapsible className="flex flex-col gap-3.5 mt-8">
        {data?.map((item, i) => (
          <AccordionItem value={`item-${i}`} key={i} className="border-0">
            <AccordionTrigger className="bg-[#001820] px-6 py-4 rounded-[17px] flex justify-between items-center">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <i>{item.type === "TSLA" && <TeslaFilledIcon width={30} height={30} />}</i>
                  <div>
                    <span className="text-[#FE6671] xl:text-xl pr-3">Sell</span>
                    <span className="text-white xl:text-xl">
                      {item.sell} {item.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <i>
                    <USDCIcon />
                  </i>
                  <div>
                    <span className="text-midGreen xl:text-xl pr-3">Buy</span>
                    <span className="text-white xl:text-xl">{item.buy} USDC</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-white xl:text-xl">
                  {item.price} USDC/{item.type}
                </span>
                <div
                  className={`w-fit inline-flex items-center px-3 py-1 rounded-md bg-[#001620] border-[0.25px] ${[StatusEnum.Completed, StatusEnum["Not Filled"], StatusEnum["Partially Filled"]].includes(item.status) ? "border-midGreen/50 text-midGreen" : "border-midRed/50 text-midRed"}  text-sm`}
                >
                  <span
                    className={`${[StatusEnum.Completed, StatusEnum["Not Filled"], StatusEnum["Partially Filled"]].includes(item.status) ? "bg-midGreen" : "bg-midRed"} w-2 h-2 rounded-full mr-2`}
                  ></span>
                  <p className="text-xs"> {item.status} </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="py-3 px-6 bg-[#001820] rounded-[17px] mt-2">
              <div className="w-full flex flex-col text-whitish gap-2">
                <div className="flex justify-between items-center">
                  <span>Offer ID</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Offer maker</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Qualifier</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Filled</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Private Addresses</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expiry</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>To sell</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>To buy</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Priced feed (to sell)</span>
                  <span>asdasd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Priced feed (to buy)</span>
                  <span className="flex items-center gap-1">
                    {shortenText("asdasdasdasdasdasd")}
                    <Link href="">
                      <SquareArrowOutUpRight size={16} />
                    </Link>
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                 
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-[#013853] text-white font-medium rounded-xl hover:bg-[#012b3f]" onClick={()=>{route.push(`/takeoffer?offerId=${item.offerId}`)}}>
                    Take Offer
                  </button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Offers;
