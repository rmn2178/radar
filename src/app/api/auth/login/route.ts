import { adminLoginEmail } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ApiError, apiFailure, clientHash, ensureConfigured, json, readJson } from '@/lib/http';

export async function POST(request: Request) {
  try {
    ensureConfigured();
    const body = await readJson(request) as { passcode?: unknown } | null;
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    if (!passcode || passcode.length > 200) throw new ApiError(400, 'Enter your administrator passcode.');
    const supabase = await createServerSupabaseClient();
    const secret = process.env.RADAR_RATE_LIMIT_SECRET ?? 'radar-local-rate-limit';
    const { data: allowed, error: limitError } = await supabase.rpc('check_rate_limit', {
      p_key: `login:${clientHash(request, secret)}`, p_max: 10, p_window_seconds: 900,
    });
    if (!limitError && allowed === false) throw new ApiError(429, 'Too many sign-in attempts. Please wait a few minutes and try again.');
    let email: string;
    try { email = adminLoginEmail(); } catch { throw new ApiError(503, 'Admin sign-in is not configured. Set RADAR_ADMIN_LOGIN_EMAIL on the server.'); }
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password: passcode });
    if (error || !signIn.user) throw new ApiError(401, 'The passcode was not recognised. Please try again.');
    const { data: profile } = await supabase.from('admin_profiles').select('role').eq('user_id', signIn.user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new ApiError(403, 'This account does not have administrator access.');
    }
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}