import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const OverviewChart = () => {
  const data = [
    { x: Date.UTC(2024, 6, 15, 10, 30, 0), y: 70000 }, // July 15, 2024, 10:30:00 AM UTC
    { x: Date.UTC(2024, 6, 16, 14, 15, 0), y: 68000 }, // July 16, 2024, 2:15:00 PM UTC
    { x: Date.UTC(2024, 6, 17, 9, 0, 0), y: 65000 }, // July 17, 2024, 9:00:00 AM UTC
    { x: Date.UTC(2024, 6, 18, 16, 45, 0), y: 58000 }, // July 18, 2024, 4:45:00 PM UTC
    { x: Date.UTC(2024, 6, 19, 8, 20, 0), y: 60000 }, // July 19, 2024, 8:20:00 AM UTC
    { x: Date.UTC(2024, 6, 20, 12, 0, 0), y: 65000 }, // July 20, 2024, 12:00:00 PM UTC
    { x: Date.UTC(2024, 6, 21, 18, 30, 0), y: 72000 }, // July 21, 2024, 6:30:00 PM UTC
    { x: Date.UTC(2024, 6, 22, 11, 15, 0), y: 68000 }, // July 22, 2024, 11:15:00 AM UTC
    { x: Date.UTC(2024, 6, 23, 15, 0, 0), y: 65000 }, // July 23, 2024, 3:00:00 PM UTC
  ];
  const options = {
    chart: {
      type: "area",
      backgroundColor: "transparent", // Dark background color
      spacing: [20, 10, 0, 0], // Remove unnecessary spacing
    },
    title: false,
    xAxis: {
      type: "datetime",
      labels: {
        formatter() {
          return Highcharts.dateFormat("%e %b", this.value); // Only show the date
        },
        style: { color: "#FFFFFF" },
      } as any,
      tickLength: 0,
      gridLineColor: "#C1C9D5",
    },
    yAxis: {
      title: { text: "" }, // No title
      labels: {
        style: { color: "#C1C9D5" },
      },
      gridLineColor: "#C1C9D5",
    },
    tooltip: {
      shared: true,
      backgroundColor: "#0C415D",
      borderColor: "#AAAAAA",
      style: { color: "#FFF" },
    },
    plotOptions: {
      series: {
        pointPlacement: "on",
        groupPadding: 0,
        pointPadding: 0,
        linecap: "round", // Smooth line ends
      },
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "#3e789d"],
            [1, "rgba(0,0, 0,0)"],
          ],
        },
        marker: {
          radius: 4,
        },
        lineWidth: 1,
        states: {
          hover: { lineWidth: 2 },
        },
      },
    },
    series: [
      {
        name: "NAV",
        data,
        color: "#0096FF", // Line color
        marker: {
          enabled: false,
          symbol: "circle",
          fillColor: "#0F3B71", // Black dot
          lineColor: "white", // White border
          lineWidth: 5, // Thick white border
          radius: 5, // Make the dot larger
        },
      },
    ],
    credits: {
      enabled: false, // Remove Highcharts watermark
    },
    legend: false,
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default OverviewChart;
