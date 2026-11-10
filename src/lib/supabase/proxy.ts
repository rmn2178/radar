import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isConfigured, supabaseConfig } from './config';

export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  if (!isConfigured()) return response;
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        response.headers.set('Cache-Control', 'private, no-store');
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  // getUser verifies the token; getSession alone is not an authorization check.
  // Route handlers and requireAdmin independently enforce the database role.
  await supabase.auth.getUser();
  return response;
}
