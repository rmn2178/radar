import 'server-only';

export function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()));
}

export function isPreview(): boolean {
  if (process.env.RADAR_CONTENT_PREVIEW === 'true') return true;
  if (isConfigured()) return false;
  // A partial configuration is almost certainly a deployment mistake.
  const partial = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!partial && process.env.NODE_ENV !== 'production' && process.env.RADAR_CONTENT_PREVIEW !== 'false') return true;
  throw new Error('RADAR requires Supabase configuration or explicit RADAR_CONTENT_PREVIEW=true.');
}

export function supabaseConfig() {
  if (!isConfigured()) throw new Error('Supabase is not configured.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim();
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Invalid Supabase URL.');
  if (key.startsWith('sb_secret_')) throw new Error('Use a publishable key, never a secret key.');
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') throw new Error('Only the Supabase anon role is allowed.');
    } catch {
      throw new Error('Invalid Supabase anonymous key.');
    }
  }
  return { url, key };
}

export function adminLoginEmail(): string {
  const email = process.env.RADAR_ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Admin login is not configured.');
  return email;
}
