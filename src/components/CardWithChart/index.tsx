import React from "react";
import { PopupIcon } from "../Icons";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
type CardProps = {
  head: React.ReactNode;
  data?: any;
  loss?: boolean;
};

const CardWithChart: React.FC<CardProps> = ({ head, data, loss }) => {
  const options = {
    chart: {
      height: "50%",
      type: "areaspline",
      backgroundColor: "#00000000",
      spacing: [0, 0, 0, 0], // Remove unnecessary spacing
    },
    title: false,
    xAxis: {
      categories: [],
      gridLineWidth: 0, // Add vertical grid lines
      tickmarkPlacement: "on",
      labels: {
        style: {
          color: "#8A94A6",
        },
        formatter: function (): any {
          return "";
        },
      },
    },
    yAxis: {
      title: false,
      gridLineWidth: 0, // Horizontal grid lines
      labels: {
        style: {
          color: "#8A94A6",
        },
        formatter: function (): any {
          return "";
        },
      },
    },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function (): any {
        return `
            <strong style="background-color:#1ECB44 ;padding:7px 10px; border-radius:4px;">${this.y}</strong>
          `;
      },
      backgroundColor: "transparent",
      style: {
        color: "#ffffff",
      },
      borderColor: "#ffffff",
      borderRadius: 5, // Rounded tooltip box
      shadow: false, // Disable shadow for cleaner look
    } as any,
    legend: {
      enabled: false, // Remove the legend
    },
    series: [
      {
        name: "Greenish Line",
        data: [350, 360, 370, 380, 350, 320, 400, 380, 390, 410, 400, 410],
        color: "#1ECB44",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(74, 222, 128, 0.5)"], // Start with semi-transparent color
            [1, "rgba(74, 222, 128, 0)"], // Fully transparent at the bottom
          ],
        },
        fillOpacity: 0.3,
        marker: {
          enabled: false,
          symbol: "circle",
          fillColor: "#1ECB44", // Black dot
          lineColor: "white", // White border
          lineWidth: 5, // Thick white border
          radius: 5, // Make the dot larger
        },
      },
    ],
    plotOptions: {
      series: {
        pointPlacement: "on",
        groupPadding: 0,
        pointPadding: 0,
        linecap: "round", // Smooth line ends
      },
    },
    credits: {
      enabled: false, // Remove Highcharts watermark
    },
  };
  return (
    <div className="flex flex-col rounded-2xl py-4 px-6 bg-darkGreen text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full">{head}</div>
        <i className="cursor-pointer">
          <PopupIcon />
        </i>
      </div>
      <div className="w-full pt-5 border-t border-[#939393] mt-5 max-h-[200px] overflow-hidden rounded-br-2xl rounded-bl-2xl">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
    </div>
  );
};

export default CardWithChart;
