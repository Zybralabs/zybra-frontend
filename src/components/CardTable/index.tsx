import React from "react";
import { PopupIcon } from "../Icons";

type CardTableProps = {
  title?: string;
  data?: { name: string; amount: number; change: string }[];
};

const CardTable: React.FC<CardTableProps> = ({ title, data }) => {
  return (
    <div className="px-6 py-4 rounded-2xl bg-darkGreen text-white">
      <div className="flex w-full justify-between items-center pb-3 mb-3 border-b border-[#939393]">
        <h5 className="text-sm font-semibold">{title}</h5>
        <i>
          <PopupIcon />
        </i>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-midGrey text-sm capitalize">
            {Object.keys(data?.[0] || {}).map((item, i) => (
              <th key={i} className={`${item === "name" && "w-1/2"} text-left pb-4`}>
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row, j) => (
            <tr>
              <td className="text-sm capitalize pb-4">{row.name}</td>
              <td className="text-sm capitalize pb-4">{row.amount}</td>
              <td
                className={`text-sm capitalize pb-4 ${row.change?.[0] === "+" ? "text-midGreen" : "text-midRed"}`}
              >
                {row.change}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CardTable;
