import { supabase } from './supabase';
import { Article, ArticleAiInsights } from '../types';

export function hasSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && url !== 'https://placeholder.supabase.co');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
  return Boolean(
    article.ai_insights?.summary?.length && article.ai_insights?.choices?.length,
  );
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

  const statLine = stats[0] ?? 'Everyday actions compound across millions of people';
  const statMatch = statLine.match(/([\d,.]+%?|\d[\d,.]*\s*(?:kg|g|tons?|liters?|hours?))/i);

  return {
    summary,
    choices,
    figure: {
      headline: statLine,
      stat_value: statMatch?.[1] ?? '—',
      stat_label: topic,
      source: 'Article data',
      source_url: null,
      chart: stats.length >= 2
        ? {
            type: 'bar',
            title: `Key figures from "${topic}"`,
            labels: stats.slice(0, 4).map((_, i) => `Stat ${i + 1}`),
            values: stats.slice(0, 4).map((s, i) => {
              const m = s.match(/([\d.]+)/);
              return m ? parseFloat(m[1]) : (i + 1) * 10;
            }),
            unit: 'from article',
          }
        : {
            type: 'bar',
            title: 'Impact scale comparison',
            labels: ['Individual action', 'Community (100 people)', 'Global potential'],
            values: [1, 100, 10000],
            unit: 'relative impact',
          },
    },
    generated_at: new Date().toISOString(),
  };
}

export async function fetchArticleInsights(
  article: Article,
  options?: { forceRegenerate?: boolean },
): Promise<{ insights: ArticleAiInsights; cached: boolean; fromDemo: boolean }> {
  if (article.ai_insights?.summary?.length && article.ai_insights?.choices?.length && !options?.forceRegenerate) {
    return { insights: article.ai_insights, cached: true, fromDemo: false };
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

    if (error) throw error;
    if (data?.insights) {
      return {
        insights: data.insights as ArticleAiInsights,
        cached: Boolean(data.cached),
        fromDemo: false,
      };
    }
    throw new Error('No insights returned');
  } catch (err) {
    console.error('Failed to fetch article insights:', err);
    return { insights: buildDemoInsights(article), cached: false, fromDemo: true };
  }
}
