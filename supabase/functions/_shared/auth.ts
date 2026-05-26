import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';

export type AuthContext = {
  user: User;
  userClient: SupabaseClient;
  authHeader: string;
};

export async function requireAuthenticatedUser(
  req: Request,
): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; error: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing authorization header' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 500, error: 'Server misconfiguration' };
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    return { ok: false, status: 401, error: 'Invalid or expired token' };
  }

  return { ok: true, ctx: { user, userClient, authHeader } };
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
