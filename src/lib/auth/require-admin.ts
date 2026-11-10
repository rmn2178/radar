import 'server-only';
import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/config';
import { ApiError } from '@/lib/http';

export interface VerifiedAdmin { supabase: SupabaseClient; user: User }

// Authorization is a database fact (admin_profiles.role), never a cookie claim.
// getUser() verifies the JWT with the Auth server; the profile lookup is itself
// protected by RLS so a signed-in non-admin can only ever see their own row.
export async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  if (!isConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles').select('role').eq('user_id', user.id).maybeSingle();
  if (profileError || profile?.role !== 'admin') return null;
  return { supabase, user };
}

export async function requireAdmin(): Promise<VerifiedAdmin> {
  const admin = await getVerifiedAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

// Route-handler variant: returns 401 semantics instead of a redirect.
export async function requireAdminApi(): Promise<VerifiedAdmin> {
  const admin = await getVerifiedAdmin();
  if (!admin) throw new ApiError(401, 'Sign in to continue.');
  return admin;
}