import React from 'react';
import { BarChart3, Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ArticleAiInsights } from '../types';
import ArticleFigureChart from './ui/ArticleFigureChart';

interface ArticleSummaryCardProps {
  bullets: string[];
  loading?: boolean;
  fromDemo?: boolean;
  onEnhance?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  showEnhanceButton?: boolean;
}

export function ArticleSummaryCard({
  bullets,
  loading = false,
  fromDemo = false,
  onEnhance,
  onRegenerate,
  regenerating = false,
  showEnhanceButton = false,
}: ArticleSummaryCardProps) {
  if (loading && bullets.length === 0) {
    return (
      <div className="bg-sage-50 border border-sage-200 rounded-3xl p-4 sm:p-5 animate-pulse">
        <div className="h-4 bg-sage-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-sage-200 rounded w-full" />
          <div className="h-3 bg-sage-200 rounded w-5/6" />
          <div className="h-3 bg-sage-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (bullets.length === 0 && showEnhanceButton && onEnhance) {
    return (
      <div className="bg-sage-50/80 border border-dashed border-sage-200 rounded-3xl p-4 sm:p-5">
        <p className="text-sm text-forest/80 mb-3">
          Short on time? Get a quick summary instead of reading the full article.
        </p>
        <button
          type="button"
          onClick={onEnhance}
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest bg-white border border-sage-200 rounded-full px-4 py-2 hover:bg-sage-50 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-sage-600" />
          Summarize this article
        </button>
      </div>
    );
  }

  if (bullets.length === 0) return null;

  return (
    <div className="bg-sage-50 border border-sage-200 rounded-3xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sage-600" />
          <h3 className="font-semibold text-sm text-forest">Quick summary</h3>
          <span className="text-[10px] text-sage-500 font-medium uppercase tracking-wide">Optional</span>
        </div>
        <div className="flex items-center gap-2">
          {showEnhanceButton && onEnhance && (
            <button
              type="button"
              onClick={onEnhance}
              disabled={loading || regenerating}
              className="text-xs text-sage-600 hover:text-forest font-medium disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Enhance with AI'}
            </button>
          )}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
              title="Regenerate AI insights"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-forest">
            <span className="text-sage-500 mt-1 flex-shrink-0">•</span>
            <span className="leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>
      {fromDemo && !import.meta.env.PROD && (
        <p className="text-[10px] text-sage-500 mt-3 italic">
          AI summary isn&apos;t available right now. You can still read the full article below.
        </p>
      )}
    </div>
  );
}

interface ArticleFigureSectionProps {
  figure: NonNullable<ArticleAiInsights['figure']>;
  expanded: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export function ArticleFigureSection({
  figure,
  expanded,
  onToggle,
  loading = false,
}: ArticleFigureSectionProps) {
  return (
    <div className="border border-sage-100 rounded-3xl overflow-hidden bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left hover:bg-sage-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sage-600" />
          <span className="font-semibold text-sm text-forest">Data & stats</span>
          <span className="text-[10px] text-sage-500 font-medium uppercase tracking-wide">Optional</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-sage-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-sage-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-sage-100 pt-4">
          <div className="bg-gradient-to-br from-cream to-sage-50 rounded-2xl p-4 sm:p-5 mb-4">
            <p className="text-3xl sm:text-4xl font-bold text-forest mb-1">{figure.stat_value}</p>
            <p className="text-sm font-medium text-forest/80">{figure.stat_label}</p>
            <p className="text-xs text-sage-600 mt-2 leading-relaxed">{figure.headline}</p>
          </div>

          {loading ? (
            <div className="mb-4 space-y-3 animate-pulse" aria-hidden>
              <div className="h-3 bg-sage-200 rounded w-1/3" />
              <div className="h-3 bg-sage-100 rounded w-full" />
              <div className="h-3 bg-sage-100 rounded w-5/6" />
              <div className="h-3 bg-sage-100 rounded w-4/6" />
            </div>
          ) : figure.chart ? (
            <div className="mb-4">
              <ArticleFigureChart chart={figure.chart} />
            </div>
          ) : (
            <p className="mb-4 text-xs text-sage-600 italic">
              A chart will appear here once AI insights finish loading.
            </p>
          )}

          <p className="text-[11px] text-sage-500 border-t border-sage-100 pt-3">
            Source:{' '}
            {figure.source_url ? (
              <a
                href={figure.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-600 hover:text-forest underline"
              >
                {figure.source}
              </a>
            ) : (
              <span className="text-sage-600">{figure.source}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use ArticleSummaryCard + ArticleFigureSection from ArticleView */
interface ArticleInsightsPanelProps {
  insights: ArticleAiInsights | null;
  loading: boolean;
  error: string | null;
  fromDemo: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export default function ArticleInsightsPanel({
  insights,
  loading,
  error,
  fromDemo,
  onRegenerate,
  regenerating = false,
}: ArticleInsightsPanelProps) {
  if (error && !insights) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-6 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Could not load AI insights</p>
          <p className="text-xs text-amber-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights && !loading) return null;

  return (
    <div className="space-y-4 mb-6">
      <ArticleSummaryCard
        bullets={insights?.summary ?? []}
        loading={loading}
        fromDemo={fromDemo}
        onRegenerate={onRegenerate}
        regenerating={regenerating}
      />
    </div>
  );
}
