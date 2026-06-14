import React from 'react';
import { ArticleFigureChart as ChartData } from '../../types';

interface ArticleFigureChartProps {
  chart: ChartData;
}

export default function ArticleFigureChart({ chart }: ArticleFigureChartProps) {
  const maxValue = Math.max(...chart.values, 1);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-sage-600 uppercase tracking-wide">{chart.title}</p>
      <div className="space-y-2.5">
        {chart.labels.map((label, index) => {
          const value = chart.values[index] ?? 0;
          const widthPercent = Math.max(8, (value / maxValue) * 100);
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-forest">
                <span className="font-medium truncate pr-2">{label}</span>
                <span className="text-sage-600 flex-shrink-0">
                  {value} {chart.unit}
                </span>
              </div>
              <div className="h-2.5 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage-500 to-forest rounded-full transition-all duration-700"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
