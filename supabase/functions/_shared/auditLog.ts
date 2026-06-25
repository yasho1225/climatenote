import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AuditAction =
  | 'delete_account'
  | 'classify_note_impact'
  | 'generate_action_suggestions'
  | 'auto_publish_articles';

export async function writeAuditLog(
  adminClient: SupabaseClient,
  entry: {
    user_id?: string | null;
    action: AuditAction;
    ip?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await adminClient.from('audit_log').insert({
      user_id: entry.user_id ?? null,
      action: entry.action,
      ip: entry.ip ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        type: 'audit_log_error',
        action: entry.action,
        message: error instanceof Error ? error.message : 'unknown',
      }),
    );
  }
}
