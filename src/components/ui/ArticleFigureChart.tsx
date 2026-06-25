import React from 'react';
import { ArticleFigureChart as ChartData } from '../../types';
import { normalizeFigureChart } from '../../lib/articleInsights';

interface ArticleFigureChartProps {
  chart: ChartData;
}

function formatChartValue(value: number, unit: string): string {
  const rounded =
    value >= 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) :
    Number.isInteger(value) ? String(value) :
    value.toFixed(1);

  if (!unit) return rounded;
  if (unit === '%') return `${rounded}%`;
  return `${rounded} ${unit}`;
}

export default function ArticleFigureChart({ chart }: ArticleFigureChartProps) {
  const normalized = normalizeFigureChart(chart);

  if (!normalized) {
    return (
      <p className="text-xs text-sage-600 italic py-2">
        Chart data is unavailable for this article.
      </p>
    );
  }

  const maxValue = Math.max(...normalized.values, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-sage-600 uppercase tracking-wide">
          {normalized.title}
        </p>
        {normalized.unit && normalized.unit !== '%' && (
          <span className="text-[10px] text-sage-500 uppercase tracking-wide flex-shrink-0">
            {normalized.unit}
          </span>
        )}
      </div>
      <div className="space-y-3" role="img" aria-label={`Bar chart: ${normalized.title}`}>
        {normalized.labels.map((label, index) => {
          const value = normalized.values[index] ?? 0;
          const widthPercent = Math.max(value > 0 ? 6 : 0, (value / maxValue) * 100);
          return (
            <div key={`${label}-${index}`} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3 text-xs text-forest">
                <span className="font-medium leading-snug min-w-0">{label}</span>
                <span className="text-sage-700 font-semibold flex-shrink-0 tabular-nums">
                  {formatChartValue(value, normalized.unit)}
                </span>
              </div>
              <div className="h-3 bg-sage-100/90 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sage-500 via-sage-600 to-forest transition-all duration-700 ease-out"
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
