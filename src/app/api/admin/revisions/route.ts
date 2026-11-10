import { z } from 'zod';
import { isCollection } from '@/lib/content';
import { requireAdminApi } from '@/lib/auth/require-admin';
import { restoreRevision } from '@/lib/database/mutations';
import { ApiError, apiFailure, ensureConfigured, json, readJson } from '@/lib/http';

export async function GET(request: Request) {
  try {
    ensureConfigured();
    const { supabase } = await requireAdminApi();
    const params = new URL(request.url).searchParams;
    const entityType = params.get('entity_type') ?? '';
    const entityId = z.uuid().parse(params.get('entity_id'));
    if (!isCollection(entityType)) throw new ApiError(400, 'Unknown collection for revisions.');
    const { data, error } = await supabase.from('content_revisions')
      .select('id,entity_type,entity_id,snapshot,created_at')
      .eq('entity_type', entityType).eq('entity_id', entityId)
      .order('created_at', { ascending: false }).limit(20);
    if (error) throw new ApiError(500, 'Revisions could not be loaded. Please try again.');
    return json({ revisions: data ?? [] });
  } catch (cause) { return apiFailure(cause); }
}

export async function POST(request: Request) {
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    const record = await restoreRevision(supabase, user.id, id);
    return json({ record });
  } catch (cause) { return apiFailure(cause); }
}