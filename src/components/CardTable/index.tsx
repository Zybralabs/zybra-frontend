import React from "react";
import { PopupIcon } from "../Icons";
import { useStockIcon } from "@/hooks/useStockIcon";
import { LoadingSpinner } from "../Modal/loading-spinner";

type CardTableProps = {
  title?: string;
  data?: { name: string; amount: number; change: string }[];
  onPopup?: () => void;
  isLoading?: boolean;
};

const CardTable: React.FC<CardTableProps> = ({ title, data, onPopup, isLoading = false }) => {
  console.log({data})
  
  const hasData = data && data.length > 0;
  
  return (
    <div className="py-4 rounded-2xl px-4 bg-[#012b3f] text-white">
      <div className="flex w-full justify-between items-center pb-3 mb-3 border-b border-[#939393]">
        <h5 className="text-sm font-semibold">{title} </h5>
        <i onClick={onPopup} className="cursor-pointer">
          <PopupIcon />
        </i>
      </div>
      <table className="w-full">
        {hasData && (
          <thead>
            <tr className="text-midGrey text-sm capitalize">
              {Object.keys(data[0]).map((item, i) => (
                <th key={i} className={`${item === "name" && "w-1/2"} text-left pb-4`}>
                  {item}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={hasData ? Object.keys(data[0]).length : 3} className="py-6 text-center">
                <div className="flex justify-center items-center">
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
          ) : !hasData ? (
            <tr>
              <td colSpan={3} className="py-6 text-center">
                <div className="text-sm text-midGrey">
                  No assets purchased
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, j) => (
              <tr key={j}>
                <td className="text-sm capitalize pb-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = useStockIcon(row.name);
                      return Icon ? <Icon /> : null;
                    })()}
                    <span>{row.name}</span>
                  </div>
                </td>
                <td className="text-sm capitalize pb-4">{typeof row.amount === 'number' ? row.amount.toFixed(2) : row.amount}</td>
                <td
                  className={`text-sm capitalize pb-4 ${row.change?.[0] === "+" ? "text-midGreen" : "text-midRed"}`}
                >
                  {row.change}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CardTable;