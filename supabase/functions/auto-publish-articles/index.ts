// Auto-Publish Articles Edge Function
// Runs daily at midnight CST to publish scheduled articles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { writeAuditLog } from '../_shared/auditLog.ts'
import { createServiceClient } from '../_shared/auth.ts'
import { hasValidCronSecret } from '../_shared/requestGuards.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { getClientIp, logSecurityEvent } from '../_shared/securityLog.ts'

const ENDPOINT = 'auto-publish-articles'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const ip = getClientIp(req)

  try {
    const expectedSecret = Deno.env.get('AUTO_PUBLISH_SECRET')
    const providedSecret = req.headers.get('x-cron-secret')
    if (!hasValidCronSecret(providedSecret, expectedSecret)) {
      logSecurityEvent({
        endpoint: ENDPOINT,
        result: 'blocked',
        reason: 'invalid_cron_secret',
        ip,
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const supabase = createServiceClient()

    // Get today's date in CST (China Standard Time / UTC+8)
    const now = new Date()
    const cstOffset = 8 * 60 // CST is UTC+8
    const cstDate = new Date(now.getTime() + cstOffset * 60 * 1000)
    const todayCST = cstDate.toISOString().split('T')[0] // YYYY-MM-DD format

    console.log(`Running auto-publish for date: ${todayCST}`)

    // Atomic publish: one UPDATE avoids fetch-then-update races when cron overlaps.
    const { data: publishedArticles, error: updateError } = await supabase
      .from('articles')
      .update({
        is_published: true,
        status: 'published',
        published_date: todayCST,
        updated_at: new Date().toISOString(),
      })
      .eq('auto_publish', true)
      .eq('is_published', false)
      .eq('status', 'approved')
      .eq('scheduled_publish_date', todayCST)
      .select('id, title')

    if (updateError) {
      console.error('Error publishing articles:', updateError)
      throw updateError
    }

    const results = (publishedArticles ?? []).map((article) => ({
      id: article.id,
      title: article.title,
      success: true,
    }))

    if (results.length === 0) {
      console.log('No articles to publish today')
    } else {
      console.log(`Published ${results.length} article(s):`, results)
    }

    const successCount = results.length
    const failCount = 0

    await writeAuditLog(supabase, {
      action: 'auto_publish_articles',
      ip,
      metadata: { date: todayCST, successCount, failCount },
    })

    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'allowed',
      reason: 'publish_complete',
      ip,
      metadata: { successCount, failCount },
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${successCount} article(s) successfully`,
        date: todayCST,
        published_count: successCount,
        failed_count: failCount,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in auto-publish function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Auto-publish failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
