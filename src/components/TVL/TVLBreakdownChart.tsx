import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { TVLBreakdownData } from '@/hooks/useTVL';

interface TVLBreakdownChartProps {
  data: TVLBreakdownData | null;
  loading: boolean;
  onPeriodChange: (period: '7d' | '30d' | '90d' | '1y' | 'all') => void;
  currentPeriod: '7d' | '30d' | '90d' | '1y' | 'all';
  usedFallback?: boolean;
}

const TVLBreakdownChart: React.FC<TVLBreakdownChartProps> = ({
  data,
  loading,
  onPeriodChange,
  currentPeriod,
  usedFallback
}) => {
  if (loading) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg animate-pulse h-[400px]">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="h-[300px] bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
        <p className="text-white">No TVL breakdown data available</p>
      </div>
    );
  }

  const options = {
    chart: {
      type: 'area',
      backgroundColor: 'transparent',
      spacing: [20, 10, 20, 0],
      height: 350,
    },
    title: false,
    xAxis: {
      categories: data.historical.dates,
      labels: {
        style: { color: '#FFFFFF' },
      },
      tickLength: 0,
      gridLineColor: '#1e293b',
      gridLineWidth: 1,
    },
    yAxis: {
      title: { text: '' },
      labels: {
        style: { color: '#C1C9D5' },
        formatter: function() {
          return '$' + Highcharts.numberFormat(Number((this as unknown as Highcharts.AxisLabelsFormatterContextObject).value ?? 0), 0, '.', ',');
        }
      },
      gridLineColor: '#1e293b',
    },
    tooltip: {
      shared: true,
      backgroundColor: '#0C415D',
      borderColor: '#AAAAAA',
      style: { color: '#FFF' },
      formatter: function(): string {
        let tooltip = '<b>' + (this as any).x + '</b><br/>';
        (this as any).points.forEach(function(point: { series: { color: string; name: string; }; y: number; }) {
          tooltip += '<span style="color:' + point.series.color + '">\u25CF</span> ' +
                    point.series.name + ': <b>$' +
                    Highcharts.numberFormat(point.y, 0, '.', ',') + '</b><br/>';
        });
        return tooltip;
      }
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        lineWidth: 1,
        marker: {
          enabled: false,
        },
        states: {
          hover: { lineWidth: 2 },
        },
      },
    },
    series: [
      {
        name: 'Staking',
        data: data.historical.staking,
        color: '#3B82F6',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(59, 130, 246, 0.5)'],
            [1, 'rgba(59, 130, 246, 0)'],
          ],
        },
      },
      {
        name: 'Lending',
        data: data.historical.lending,
        color: '#10B981',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.5)'],
            [1, 'rgba(16, 185, 129, 0)'],
          ],
        },
      },
      {
        name: 'Total',
        data: data.historical.total,
        color: '#F59E0B',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(245, 158, 11, 0.5)'],
            [1, 'rgba(245, 158, 11, 0)'],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#FFFFFF',
      },
    },
  };

  return (
    <div className="bg-[#012b3f] rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">TVL Breakdown</h2>
          {usedFallback && (
            <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">Simplified Data</span>
          )}
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => onPeriodChange('7d')}
            className={`px-3 py-1 rounded ${currentPeriod === '7d' ? 'bg-blue-500 text-white' : 'bg-[#001a29] text-gray-300'}`}
          >
            7D
          </button>
          <button
            onClick={() => onPeriodChange('30d')}
            className={`px-3 py-1 rounded ${currentPeriod === '30d' ? 'bg-blue-500 text-white' : 'bg-[#001a29] text-gray-300'}`}
          >
            30D
          </button>
          <button
            onClick={() => onPeriodChange('90d')}
            className={`px-3 py-1 rounded ${currentPeriod === '90d' ? 'bg-blue-500 text-white' : 'bg-[#001a29] text-gray-300'}`}
          >
            90D
          </button>
          <button
            onClick={() => onPeriodChange('1y')}
            className={`px-3 py-1 rounded ${currentPeriod === '1y' ? 'bg-blue-500 text-white' : 'bg-[#001a29] text-gray-300'}`}
          >
            1Y
          </button>
          <button
            onClick={() => onPeriodChange('all')}
            className={`px-3 py-1 rounded ${currentPeriod === 'all' ? 'bg-blue-500 text-white' : 'bg-[#001a29] text-gray-300'}`}
          >
            All
          </button>
        </div>
      </div>

      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default TVLBreakdownChart;

