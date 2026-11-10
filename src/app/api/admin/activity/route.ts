import { requireAdminApi } from '@/lib/auth/require-admin';
import { ApiError, apiFailure, ensureConfigured, json } from '@/lib/http';

export async function GET() {
  try {
    ensureConfigured();
    const { supabase } = await requireAdminApi();
    const { data, error } = await supabase.from('admin_activity_logs')
      .select('id,action,entity_type,entity_id,created_at')
      .order('created_at', { ascending: false }).limit(200);
    if (error) throw new ApiError(500, 'The activity log could not be loaded. Please try again.');
    return json({ activity: data ?? [] });
  } catch (cause) { return apiFailure(cause); }
}