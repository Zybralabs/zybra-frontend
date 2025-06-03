import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

type ChartProps = {
  title?: string;
  data?: any;
};

const PortfolioChart: React.FC<ChartProps> = ({ data, title = "Portfolio perfomance" }) => {
  const options = {
    chart: {
      // width:"100%",
      type: "areaspline",
      backgroundColor: "#00000000",
      spacing: [20, 10, 0, 0], // Remove unnecessary spacing
    },
    title: false,
    xAxis: {
      categories: [
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
      ],
      gridLineWidth: 1, // Add vertical grid lines
      gridLineColor: "#2D2D2D", // Light grid color
      tickmarkPlacement: "on",
      labels: {
        style: {
          color: "#8A94A6",
        },
      },
    },
    yAxis: {
      title: false,
      gridLineWidth: 1, // Horizontal grid lines
      gridLineColor: "#2D2D2D", // Light grid color
      labels: {
        style: {
          color: "#8A94A6",
        },
        formatter: function (): any {
          return "$" + this.value;
        },
      } as any,
    },
    tooltip: {
      shared: false,
      useHTML: true,
      backgroundColor: "transparent",
      style: {
        color: "#ffffff",
      },
      borderColor: "#ffffff",
      borderRadius: 5, // Rounded tooltip box
      shadow: false, // Disable shadow for cleaner look
      formatter: function (): any {
        const seriesName = this.series.name; // Get the series name
        let bgColor;
        console.log(seriesName, "__series");
        // Set different background colors based on the series name
        if (seriesName === "Bluish Line") {
          bgColor = "rgba(59, 130, 246, 0.8)"; // Bluish background
        } else if (seriesName === "Greenish Line") {
          bgColor = "#1E97CB90"; // Greenish background
        }

        // Generate custom HTML tooltip with dynamic background color
        return `
            <strong style="background-color: ${bgColor};padding:7px 10px; border-radius:4px;">${this.options.y}</strong>
          `;
      },
    } as any,
    legend: {
      enabled: false, // Remove the legend
    },
    series: [
      {
        name: "Bluish Line",
        data: [100, 300, 700, 500, 400, 600, 700, 800, 600, 400, 900],
        color: "rgba(59, 130, 246, 0.7)",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(59, 130, 246, 0.5)"], // Start with semi-transparent color
            [1, "rgba(59, 130, 246, 0)"], // Fully transparent at the bottom
          ],
        },
        fillOpacity: 0.3,
        marker: {
          enabled: false,
          symbol: "circle",
          fillColor: "#0F3B71", // Black dot
          lineColor: "white", // White border
          lineWidth: 5, // Thick white border
          radius: 5, // Make the dot larger
        },
      },
      {
        name: "Greenish Line",
        data: [200, 400, 500, 600, 700, 500, 600, 700, 900, 700, 800],
        color: "#1E97CB90",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "#1E97CB50"], // Start with semi-transparent color
            [1, "#1E97CB00"], // Fully transparent at the bottom
          ],
        },
        fillOpacity: 0.3,
        marker: {
          enabled: false,
          symbol: "circle",
          fillColor: "#1E97CB", // Black dot
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
    <div className="bg-darkGrassGreen py-4 px-6 rounded-2xl">
      <h5 className="text-sm text-white font-semibold mb-3">{title}</h5>
      <div className="border-t border-[#414141] pt-5">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
    </div>
  );
};

export default PortfolioChart;
