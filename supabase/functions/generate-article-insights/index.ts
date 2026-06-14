// Edge Function: Generate Article AI Insights (summary, choices, figure)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { writeAuditLog } from '../_shared/auditLog.ts';
import { requireAuthenticatedUser, createServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitKeyFromAuth } from '../_shared/rateLimit.ts';
import { areAiEndpointsEnabled } from '../_shared/securityFlags.ts';
import { callGeminiGenerateContent } from '../_shared/gemini.ts';
import { getClientIp, logSecurityEvent } from '../_shared/securityLog.ts';

const ENDPOINT = 'generate-article-insights';

const VAGUE_PHRASES = [
  'research more',
  'make a change',
  'track my progress',
  'be more aware',
  'learn more about',
  'stay informed',
  'spread awareness',
];

interface ArticleFigureChart {
  type: 'bar';
  title: string;
  labels: string[];
  values: number[];
  unit: string;
}

interface ArticleFigure {
  headline: string;
  stat_value: string;
  stat_label: string;
  source: string;
  source_url: string | null;
  chart: ArticleFigureChart | null;
}

interface ArticleAiInsights {
  summary: string[];
  choices: string[];
  figure: ArticleFigure;
  generated_at: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseGeminiJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function coerceChartValues(chart: Record<string, unknown>): void {
  if (!Array.isArray(chart.values)) return;
  chart.values = chart.values.map((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
    const parsed = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  });
}

function normalizeInsightsPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  const figure = d.figure;
  if (figure && typeof figure === 'object') {
    const f = figure as Record<string, unknown>;
    const chart = f.chart;
    if (chart && typeof chart === 'object') {
      coerceChartValues(chart as Record<string, unknown>);
    }
  }
  return data;
}

function isValidInsights(data: unknown, articleTitle: string): data is Omit<ArticleAiInsights, 'generated_at'> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.summary) || d.summary.length < 3 || d.summary.length > 4) return false;
  if (!d.summary.every((s) => typeof s === 'string' && s.length > 10 && s.length < 300)) return false;

  if (!Array.isArray(d.choices) || d.choices.length !== 3) return false;
  const titleWords = articleTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const choicesValid = d.choices.every((c) => {
    if (typeof c !== 'string' || c.length < 20 || c.length > 250) return false;
    const lower = c.toLowerCase();
    if (!lower.startsWith('i will') && !lower.startsWith("i'll")) return false;
    if (VAGUE_PHRASES.some((p) => lower.includes(p))) return false;
    return true;
  });
  if (!choicesValid) return false;

  // At least one choice should reference the article topic
  const topicMentioned = d.choices.some((c) => {
    const lower = (c as string).toLowerCase();
    return titleWords.some((w) => lower.includes(w));
  });
  if (!topicMentioned && titleWords.length > 0) return false;

  const figure = d.figure;
  if (!figure || typeof figure !== 'object') return false;
  const f = figure as Record<string, unknown>;
  if (typeof f.headline !== 'string' || f.headline.length < 10) return false;
  if (typeof f.stat_value !== 'string' || f.stat_value.length < 1) return false;
  if (typeof f.stat_label !== 'string' || f.stat_label.length < 5) return false;
  if (typeof f.source !== 'string' || f.source.length < 3) return false;

  if (f.chart !== null && f.chart !== undefined) {
    const chart = f.chart as Record<string, unknown>;
    if (
      chart.type !== 'bar' ||
      typeof chart.title !== 'string' ||
      !Array.isArray(chart.labels) ||
      !Array.isArray(chart.values) ||
      chart.labels.length < 2 ||
      chart.labels.length !== chart.values.length ||
      !chart.values.every((v) => typeof v === 'number' && v >= 0) ||
      typeof chart.unit !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

async function generateInsightsWithGemini(
  geminiKey: string,
  article: {
    title: string;
    subtitle?: string | null;
    category?: string | null;
    key_takeaways?: string[] | null;
    key_statistics?: string[] | null;
    content?: string | null;
  },
): Promise<Omit<ArticleAiInsights, 'generated_at'>> {
  const takeawayText = article.key_takeaways?.length
    ? `Editor key takeaways:\n${article.key_takeaways.map((t) => `- ${t}`).join('\n')}`
    : '';

  const statsText = article.key_statistics?.length
    ? `Existing statistics:\n${article.key_statistics.map((s) => `- ${s}`).join('\n')}`
    : '';

  const contentSnippet = article.content ? stripHtml(article.content).substring(0, 2500) : '';

  const prompt = `You are an environmental education assistant for teenagers reading climate articles.

Generate structured insights for THIS SPECIFIC article. Every output must reference concrete details from the article — topics, statistics, examples, or solutions mentioned. Never produce generic climate advice.

Article title: "${article.title}"
${article.subtitle ? `Subtitle: "${article.subtitle}"` : ''}
${article.category ? `Category: ${article.category}` : ''}
${takeawayText}
${statsText}
${contentSnippet ? `Article content:\n${contentSnippet}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "choices": ["I will...", "I'll...", "I will..."],
  "figure": {
    "headline": "One sentence highlighting the most striking data point from this article",
    "stat_value": "4%",
    "stat_label": "short label for the headline stat",
    "source": "Attribution e.g. IEA 2024 or article study name",
    "source_url": null,
    "chart": {
      "type": "bar",
      "title": "Chart title specific to this article",
      "labels": ["Category A", "Category B"],
      "values": [4, 2],
      "unit": "unit label e.g. % of emissions or kg CO2"
    }
  }
}

Rules for summary (3-4 bullets):
- Each bullet is one clear sentence about THIS article's main ideas
- Mention specific facts, numbers, or examples from the article when available
- Do NOT repeat the title verbatim

Rules for choices (exactly 3):
- Each starts with "I will" or "I'll"
- SPECIFIC to this article's topic — name the actual issue (e.g. fast fashion, microplastics, food waste)
- Concrete real-world actions a teenager can do at home, school, or when shopping
- Vary difficulty: one small/immediate, one medium, one bigger lifestyle shift
- NEVER use vague phrases like "research more", "make a change", "track progress", "be more aware"

Rules for figure:
- Use a real statistic FROM the article content or key_statistics when possible
- If no stat in article, use a well-known related statistic and cite a plausible source
- chart.values must be realistic positive numbers; labels must relate to the article topic
- source_url should be null unless you are certain of a real URL

Return ONLY the JSON object. No markdown, no explanation.`;

  const raw = await callGeminiGenerateContent(
    geminiKey,
    prompt,
    {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    { jsonMode: true },
  );

  const parsed = normalizeInsightsPayload(parseGeminiJson(raw)) as Record<string, unknown>;
  if (!isValidInsights(parsed, article.title)) {
    throw new Error('Invalid insights format from AI');
  }

  const figure = parsed.figure as ArticleFigure;
  return {
    summary: parsed.summary as string[],
    choices: parsed.choices as string[],
    figure: {
      ...figure,
      source_url: figure.source_url ?? null,
      chart: figure.chart ?? null,
    },
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const ip = getClientIp(req);

  try {
    if (!areAiEndpointsEnabled()) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'ai_disabled', ip });
      return new Response(
        JSON.stringify({ error: 'AI insights are temporarily unavailable.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: auth.error, ip });
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { user } = auth.ctx;
    const rateKey = await rateLimitKeyFromAuth(req, ENDPOINT);
    const rate = checkRateLimit(rateKey ?? `${ENDPOINT}:${user.id}`, 15, 60_000);
    if (rate.limited) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'rate_limit', user_id: user.id, ip });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const { article_id, force_regenerate } = body;

    if (typeof article_id !== 'string' || article_id.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid article_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const adminClient = createServiceClient();
    const { data: article, error: fetchError } = await adminClient
      .from('articles')
      .select('id, title, subtitle, category, content, key_takeaways, key_statistics, ai_insights, is_published')
      .eq('id', article_id)
      .maybeSingle();

    if (fetchError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!article.is_published) {
      return new Response(
        JSON.stringify({ error: 'Article not available' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cached = article.ai_insights as ArticleAiInsights | null;
    const cachedFigure = cached?.figure;
    const hasValidCachedChart =
      cachedFigure &&
      typeof cachedFigure === 'object' &&
      (cachedFigure.chart === null ||
        (Array.isArray(cachedFigure.chart?.labels) &&
          Array.isArray(cachedFigure.chart?.values) &&
          cachedFigure.chart.labels.length >= 2));

    if (
      cached?.summary?.length &&
      cached?.choices?.length &&
      cachedFigure &&
      hasValidCachedChart &&
      !force_regenerate
    ) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'allowed', reason: 'cache_hit', user_id: user.id, ip });
      return new Response(
        JSON.stringify({ insights: cached, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const generated = await generateInsightsWithGemini(geminiKey, article);
    const insights: ArticleAiInsights = {
      ...generated,
      generated_at: new Date().toISOString(),
    };

    const { error: updateError } = await adminClient
      .from('articles')
      .update({ ai_insights: insights })
      .eq('id', article_id);

    if (updateError) {
      console.error('Failed to cache insights:', updateError);
    }

    await writeAuditLog(adminClient, {
      user_id: user.id,
      action: 'generate_article_insights',
      ip,
      metadata: { article_id, article_title: article.title.slice(0, 80) },
    });

    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'allowed',
      reason: 'insights_generated',
      user_id: user.id,
      ip,
    });

    return new Response(
      JSON.stringify({ insights, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'server_error', ip });
    console.error('Error generating article insights:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate article insights' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
