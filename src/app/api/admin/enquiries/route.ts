import { z } from 'zod';
import { requireAdminApi } from '@/lib/auth/require-admin';
import { logActivity } from '@/lib/database/mutations';
import { ApiError, apiFailure, ensureConfigured, json, readJson } from '@/lib/http';

const statusSchema = z.enum(['unread', 'read', 'resolved']);

export async function GET() {
  try {
    ensureConfigured();
    const { supabase } = await requireAdminApi();
    const { data, error } = await supabase.from('contact_messages')
      .select('id,name,email,subject,message,status,created_at')
      .order('created_at', { ascending: false }).limit(300);
    if (error) throw new ApiError(500, 'Enquiries could not be loaded. Please try again.');
    return json({ enquiries: data ?? [] });
  } catch (cause) { return apiFailure(cause); }
}

export async function PATCH(request: Request) {
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown; status?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    const status = statusSchema.parse(body?.status);
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) throw new ApiError(500, 'The enquiry could not be updated. Please try again.');
    await logActivity(supabase, user.id, `enquiry.${status}`, 'contact_messages', id);
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}

export async function DELETE(request: Request) {
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) throw new ApiError(500, 'The enquiry could not be deleted. Please try again.');
    await logActivity(supabase, user.id, 'enquiry.delete', 'contact_messages', id);
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}