// Permanently deletes a user's account and all associated data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { writeAuditLog } from '../_shared/auditLog.ts'
import { requireAuthenticatedUser, createServiceClient } from '../_shared/auth.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'
import { getClientIp, logSecurityEvent } from '../_shared/securityLog.ts'

const ENDPOINT = 'delete-account'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const ip = getClientIp(req)

  try {
    const auth = await requireAuthenticatedUser(req)
    if (!auth.ok) {
      logSecurityEvent({
        endpoint: ENDPOINT,
        result: 'blocked',
        reason: auth.error,
        ip,
      })
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { user } = auth.ctx
    const rate = checkRateLimit(`delete-account:${user.id}`, 3, 60_000)
    if (rate.limited) {
      logSecurityEvent({
        endpoint: ENDPOINT,
        result: 'blocked',
        reason: 'rate_limit',
        user_id: user.id,
        ip,
      })
      return new Response(
        JSON.stringify({ error: 'Too many deletion attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const adminClient = createServiceClient()
    const userId = user.id

    const { error: notesDeleteError } = await adminClient
      .from('user_notes')
      .delete()
      .eq('user_id', userId)
    if (notesDeleteError) {
      throw notesDeleteError
    }

    const { error: goalsDeleteError } = await adminClient
      .from('user_goals')
      .delete()
      .eq('user_id', userId)
    if (goalsDeleteError && goalsDeleteError.code !== '42P01') {
      throw goalsDeleteError
    }

    const { error: profileDeleteError } = await adminClient
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    if (profileDeleteError) {
      throw profileDeleteError
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      throw deleteError
    }

    await writeAuditLog(adminClient, {
      user_id: userId,
      action: 'delete_account',
      ip,
      metadata: { success: true },
    })

    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'allowed',
      reason: 'account_deleted',
      user_id: userId,
      ip,
    })

    return new Response(
      JSON.stringify({ message: 'Account permanently deleted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'blocked',
      reason: 'server_error',
      ip,
      metadata: { message: error instanceof Error ? error.message : 'unknown' },
    })
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
