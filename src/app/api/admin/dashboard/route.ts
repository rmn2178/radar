import { requireAdminApi } from '@/lib/auth/require-admin';
import { ApiError, apiFailure, ensureConfigured, json } from '@/lib/http';
import { collections } from '@/types/content';

export async function GET() {
  try {
    ensureConfigured();
    const { supabase } = await requireAdminApi();
    const counts: Record<string, { total: number; published: number }> = {};
    await Promise.all(collections.map(async collection => {
      const { data, error } = await supabase.from(collection).select('status');
      if (error) throw new ApiError(500, 'Dashboard counts could not be loaded.');
      const rows = data ?? [];
      counts[collection] = { total: rows.length, published: rows.filter(row => row.status === 'published').length };
    }));
    const [enquiries, media, activity] = await Promise.all([
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread'),
      supabase.from('media_assets').select('id', { count: 'exact', head: true }),
      supabase.from('admin_activity_logs').select('id,action,entity_type,entity_id,created_at').order('created_at', { ascending: false }).limit(8),
    ]);
    if (enquiries.error || media.error || activity.error) throw new ApiError(500, 'Dashboard data could not be loaded.');
    return json({ counts, unread_enquiries: enquiries.count ?? 0, media_count: media.count ?? 0, recent: activity.data ?? [] });
  } catch (cause) { return apiFailure(cause); }
}