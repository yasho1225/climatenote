// Edge Function: Generate Action Suggestions
// Auto-deploys via GitHub Actions when changes are pushed
// Version: 1.0.2
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { writeAuditLog } from '../_shared/auditLog.ts';
import { requireAuthenticatedUser, createServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitKeyFromAuth } from '../_shared/rateLimit.ts';
import { areAiEndpointsEnabled } from '../_shared/securityFlags.ts';
import { callGeminiGenerateContent } from '../_shared/gemini.ts';
import { getClientIp, logSecurityEvent } from '../_shared/securityLog.ts';
import { isValidUuid } from '../_shared/requestGuards.ts';

const ENDPOINT = 'generate-action-suggestions';

function normalizeSuggestionsPayload(parsed: unknown): string[] | null {
  if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((s) => typeof s === 'string')) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object') {
    for (const key of ['suggestions', 'choices', 'actions']) {
      const value = (parsed as Record<string, unknown>)[key];
      if (Array.isArray(value) && value.length === 3 && value.every((s) => typeof s === 'string')) {
        return value as string[];
      }
    }
  }
  return null;
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
        JSON.stringify({ error: 'AI suggestions are temporarily unavailable.' }),
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
    const rateKey = await rateLimitKeyFromAuth(req, 'generate-action-suggestions');
    const rate = checkRateLimit(rateKey ?? `generate-action-suggestions:${user.id}`, 10, 60_000);
    if (rate.limited) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'rate_limit', user_id: user.id, ip });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { article_id, article_title, article_subtitle, key_takeaways, article_content, force_regenerate } = await req.json();

    if (typeof article_id === 'string' && article_id.length > 0 && !isValidUuid(article_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid article_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Return cached choices from article if available
    if (typeof article_id === 'string' && article_id.length > 0 && !force_regenerate) {
      const adminClient = createServiceClient();
      const { data: cachedArticle } = await adminClient
        .from('articles')
        .select('ai_insights')
        .eq('id', article_id)
        .maybeSingle();

      const cachedChoices = cachedArticle?.ai_insights?.choices;
      if (Array.isArray(cachedChoices) && cachedChoices.length === 3) {
        await writeAuditLog(adminClient, {
          user_id: user.id,
          action: 'generate_action_suggestions',
          ip,
          metadata: { article_id, cache_hit: true },
        });
        return new Response(
          JSON.stringify({ suggestions: cachedChoices, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }
    if (typeof article_title !== 'string' || article_title.trim().length === 0 || article_title.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid article_title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (article_subtitle && (typeof article_subtitle !== 'string' || article_subtitle.length > 300)) {
      return new Response(
        JSON.stringify({ error: 'Invalid article_subtitle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (key_takeaways && (!Array.isArray(key_takeaways) || key_takeaways.length > 20)) {
      return new Response(
        JSON.stringify({ error: 'Invalid key_takeaways' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (typeof article_content === 'string' && article_content.length > 50_000) {
      return new Response(
        JSON.stringify({ error: 'article_content is too large' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from article
    const takeawayText = key_takeaways?.length
      ? `Key takeaways:\n${key_takeaways.map((t: string) => `- ${t}`).join('\n')}`
      : '';

    // Truncate content to keep tokens reasonable while preserving context
    const contentSnippet = article_content
      ? article_content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000)
      : '';

    const prompt = `You are an environmental action coach for teenagers. Generate exactly 3 personal action commitments based on this specific article.

Article title: "${article_title}"
${article_subtitle ? `Subtitle: "${article_subtitle}"` : ''}
${takeawayText}
${contentSnippet ? `Article excerpt: ${contentSnippet}` : ''}

Rules for each suggestion:
- Start with "I will" or "I'll"
- Be SPECIFIC to this article's topic — mention the actual issue (e.g. fast fashion, microplastics, food waste)
- Be a concrete, real-world action (e.g. "I'll buy my next item of clothing secondhand instead of new" NOT "I'll make a change")
- Be realistic for a teenager — something doable at home, school, or when shopping
- Vary the suggestions: one small/immediate action, one medium effort, one bigger lifestyle shift
- Do NOT use vague phrases like "research more", "make a change", "track progress", "be more aware"
- Each action should name a specific behavior change

Good examples for a fast fashion article:
["I'll check a thrift store before buying new clothes next time I need something", "I will wash my synthetic clothes in a microplastic-catching laundry bag", "I'll go through my closet and donate clothes I haven't worn in 6 months instead of throwing them away"]

Bad examples (too vague — never do this):
["I will research more about fast fashion", "I'll make one small change in my daily routine", "I will track my progress for 7 days"]

Return ONLY a valid JSON object with this exact shape:
{"suggestions": ["I will...", "I'll...", "I will..."]}

No explanation, no markdown.`;

    const raw = await callGeminiGenerateContent(
      geminiKey,
      prompt,
      {
        temperature: 0.8,
        maxOutputTokens: 1200,
      },
      { jsonMode: true },
    );

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const suggestions = normalizeSuggestionsPayload(parsed);
    if (!suggestions) {
      throw new Error('Invalid suggestions format');
    }

    const adminClient = createServiceClient();
    await writeAuditLog(adminClient, {
      user_id: user.id,
      action: 'generate_action_suggestions',
      ip,
      metadata: { article_title: article_title.slice(0, 80) },
    });

    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'allowed',
      reason: 'suggestions_generated',
      user_id: user.id,
      ip,
    });

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'server_error', ip });
    console.error('Error generating suggestions:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
