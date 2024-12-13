import React from "react";

interface CardData {
  status: string;
  title: string;
  tvl?: string;
  volume?: string;
  apy?: string;
  price?: string;
  marketCap?: string;
  change?: string;
}

interface CardProps {
  data: CardData;
}

const Card: React.FC<CardProps> = ({ data }) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <span
          className={`px-3 py-1 text-sm rounded-lg ${
            data.status === "Active" ? "bg-green" : "bg-gray"
          }`}
        >
          {data.status}
        </span>
        <button className="bg-blue px-3 py-1 text-sm rounded-lg">Invest</button>
      </div>
      <h2 className="text-lg font-bold">{data.title}</h2>
      {data.tvl && (
        <div className="mt-2 text-sm">
          <p>
            TVL (USDC): <span className="font-bold">{data.tvl}</span>
          </p>
          <p>
            Volume (24h): <span className="font-bold">{data.volume}</span>
          </p>
          <p>
            APY:{" "}
            <span
              className={`font-bold ${
                data.apy?.startsWith("-") ? "text-red" : "text-green"
              }`}
            >
              {data.apy}
            </span>
          </p>
        </div>
      )}
      {data.price && (
        <div className="mt-2 text-sm">
          <p>Price: {data.price}</p>
          <p>Market Cap: {data.marketCap}</p>
          <p>
            Change: <span className="text-green">{data.change}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Card;
