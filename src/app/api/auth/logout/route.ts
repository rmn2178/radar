import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/config';
import { apiFailure, json } from '@/lib/http';

export async function POST() {
  try {
    if (isConfigured()) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    }
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}