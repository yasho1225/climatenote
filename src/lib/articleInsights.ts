import { supabase } from './supabase';
import { getEdgeFunctionErrorMessage } from './edgeFunctions';
import { Article, ArticleAiInsights, ArticleFigure, ArticleFigureChart } from '../types';

export function hasSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && url !== 'https://placeholder.supabase.co');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractNumericValue(stat: string): number | null {
  const cleaned = stat.replace(/,/g, '');
  const pct = cleaned.match(/([\d.]+)\s*%/);
  if (pct) return parseFloat(pct[1]);
  const num = cleaned.match(/([\d.]+)/);
  if (num) return parseFloat(num[1]);
  return null;
}

function inferChartUnit(stats: string[]): string {
  const combined = stats.join(' ').toLowerCase();
  if (combined.includes('%')) return '%';
  if (/\b(kg|g)\b/.test(combined)) return 'kg CO₂e';
  if (/\bton/.test(combined)) return 'tons';
  if (/\bliter/.test(combined)) return 'liters';
  return '';
}

function shortenLabel(stat: string, maxLen = 44): string {
  const trimmed = stat.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

/** Coerce AI / cached chart JSON into a renderable bar chart */
export function normalizeFigureChart(chart: unknown): ArticleFigureChart | null {
  if (!chart || typeof chart !== 'object') return null;
  const c = chart as Record<string, unknown>;
  if (!Array.isArray(c.labels) || !Array.isArray(c.values)) return null;

  const labels = c.labels.map((label) => String(label).trim()).filter(Boolean);
  const values = c.values.map((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
    const parsed = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  });

  if (labels.length < 2 || labels.length !== values.length) return null;
  if (values.every((value) => value === 0)) return null;

  return {
    type: 'bar',
    title: typeof c.title === 'string' && c.title.trim() ? c.title.trim() : 'Comparison',
    labels,
    values,
    unit: typeof c.unit === 'string' ? c.unit.trim() : '',
  };
}

export function normalizeArticleFigure(figure: unknown): ArticleFigure | null {
  if (!figure || typeof figure !== 'object') return null;
  const f = figure as Record<string, unknown>;
  if (typeof f.headline !== 'string' || !f.headline.trim()) return null;

  return {
    headline: f.headline.trim(),
    stat_value: typeof f.stat_value === 'string' && f.stat_value.trim() ? f.stat_value.trim() : '—',
    stat_label: typeof f.stat_label === 'string' && f.stat_label.trim() ? f.stat_label.trim() : 'Key stat',
    source: typeof f.source === 'string' && f.source.trim() ? f.source.trim() : 'Source',
    source_url: typeof f.source_url === 'string' ? f.source_url : null,
    chart: normalizeFigureChart(f.chart),
  };
}

/** Build figure + chart from article key_statistics without calling AI */
export function buildFigureFromArticle(article: Article): ArticleFigure | null {
  const stats = article.key_statistics ?? [];
  if (stats.length === 0) return null;

  const topic = article.title;
  const statLine = stats[0];
  const statMatch = statLine.match(
    /([\d,.]+\s*%?|[\d,.]+)\s*(?:million|billion|thousand|kg|tons?)?/i,
  );

  let chart: ArticleFigureChart | null = null;
  if (stats.length >= 2) {
    chart = normalizeFigureChart({
      type: 'bar',
      title: 'By the numbers',
      labels: stats.slice(0, 5).map((stat) => shortenLabel(stat)),
      values: stats.slice(0, 5).map((stat, index) => extractNumericValue(stat) ?? (index + 1) * 10),
      unit: inferChartUnit(stats),
    });
  } else {
    chart = {
      type: 'bar',
      title: 'Impact at different scales',
      labels: ['Individual', 'Community (100)', 'Global reach'],
      values: [1, 100, 10000],
      unit: 'relative scale',
    };
  }

  return {
    headline: statLine,
    stat_value: statMatch?.[1]?.trim() ?? '—',
    stat_label: topic.length > 60 ? `${topic.slice(0, 57)}…` : topic,
    source: 'Article statistics',
    source_url: null,
    chart,
  };
}

/** Best available figure for the UI: AI insights first, then article stats */
export function resolveDisplayFigure(
  article: Article,
  insights?: ArticleAiInsights | null,
): ArticleFigure | null {
  for (const raw of [insights?.figure, article.ai_insights?.figure]) {
    const normalized = normalizeArticleFigure(raw);
    if (normalized) return normalized;
  }
  return buildFigureFromArticle(article);
}

function normalizeInsights(insights: ArticleAiInsights, article: Article): ArticleAiInsights {
  const figure =
    normalizeArticleFigure(insights.figure) ??
    buildFigureFromArticle(article) ?? {
      headline: 'Key climate data from this article',
      stat_value: '—',
      stat_label: article.title,
      source: 'Article',
      source_url: null,
      chart: null,
    };

  return { ...insights, figure };
}

/** Bullets shown instantly — no network call */
export function getInstantSummaryBullets(
  article: Article,
  insights?: ArticleAiInsights | null,
): string[] {
  const aiSummary = insights?.summary ?? article.ai_insights?.summary;
  if (aiSummary?.length) return aiSummary.slice(0, 4);

  const takeaways = article.key_takeaways ?? [];
  if (takeaways.length) return takeaways.slice(0, 4);

  if (article.subtitle?.trim()) return [article.subtitle.trim()];
  return [];
}

export function hasCachedAiInsights(article: Article): boolean {
  return hasCompleteAiInsights(article);
}

export function hasCompleteAiInsights(article: Article): boolean {
  const ai = article.ai_insights;
  if (!ai?.summary?.length || ai.choices?.length !== 3) return false;
  const figure = normalizeArticleFigure(ai.figure);
  return Boolean(figure?.headline && figure.chart);
}

/** Client-side fallback when AI / Supabase is unavailable */
export function buildDemoInsights(article: Article): ArticleAiInsights {
  const topic = article.title;
  const takeaways = article.key_takeaways ?? [];
  const stats = article.key_statistics ?? [];
  const excerpt = stripHtml(article.content || '').slice(0, 400);

  const summary =
    takeaways.length >= 3
      ? takeaways.slice(0, 4)
      : [
          `${topic} explores how everyday choices connect to climate impact.`,
          excerpt
            ? excerpt.split('.').find((s) => s.trim().length > 40)?.trim().concat('.') ??
              `The article highlights practical steps readers can take on ${topic.toLowerCase()}.`
            : `The article highlights practical steps readers can take on ${topic.toLowerCase()}.`,
          stats[0] ?? `Small habit changes around ${article.category ?? 'daily life'} add up over time.`,
          `Readers are encouraged to pick one concrete action and commit to it this week.`,
        ].slice(0, 4);

  const firstTakeaway = takeaways[0] ?? topic;
  const choices = [
    `I'll tell someone I know about "${firstTakeaway}" and suggest one change we can try together.`,
    `I will look up one product or habit related to ${topic} and choose a more sustainable alternative this week.`,
    `I'll make one concrete change inspired by this article about ${article.category ?? 'climate action'} and stick with it for 30 days.`,
  ];

  const figure =
    buildFigureFromArticle(article) ?? {
      headline: stats[0] ?? 'Everyday actions compound across millions of people',
      stat_value: '—',
      stat_label: topic,
      source: 'Article data',
      source_url: null,
      chart: {
        type: 'bar',
        title: 'Impact at different scales',
        labels: ['Individual', 'Community (100)', 'Global reach'],
        values: [1, 100, 10000],
        unit: 'relative scale',
      },
    };

  return {
    summary,
    choices,
    figure,
    generated_at: new Date().toISOString(),
  };
}

export async function fetchArticleInsights(
  article: Article,
  options?: { forceRegenerate?: boolean },
): Promise<{ insights: ArticleAiInsights; cached: boolean; fromDemo: boolean; error?: string }> {
  if (hasCompleteAiInsights(article) && !options?.forceRegenerate) {
    return {
      insights: normalizeInsights(article.ai_insights!, article),
      cached: true,
      fromDemo: false,
    };
  }

  if (!hasSupabaseConfig() || !article.id) {
    return { insights: buildDemoInsights(article), cached: false, fromDemo: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-article-insights', {
      body: {
        article_id: article.id,
        force_regenerate: options?.forceRegenerate ?? false,
      },
    });

    if (error) {
      const message = await getEdgeFunctionErrorMessage(error, data);
      throw new Error(message);
    }
    if (data?.error) {
      throw new Error(String(data.error));
    }
    if (data?.insights) {
      return {
        insights: normalizeInsights(data.insights as ArticleAiInsights, article),
        cached: Boolean(data.cached),
        fromDemo: false,
      };
    }
    throw new Error('No insights returned');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch article insights';
    console.error('Failed to fetch article insights:', err);
    return {
      insights: buildDemoInsights(article),
      cached: false,
      fromDemo: false,
      error: message,
    };
  }
}
