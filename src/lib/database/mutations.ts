import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { recordSchema } from '@/lib/content';
import { ApiError } from '@/lib/http';
import type { Collection, ContentRecord, PublishStatus } from '@/types/content';

export type SaveIntent = 'draft' | 'publish' | 'archive';

const envelopeColumns = 'id,title,slug,status,display_order,is_featured,data,published_data,created_at,updated_at';

export async function fetchRecord(supabase: SupabaseClient, collection: Collection, id: string): Promise<ContentRecord | null> {
  const { data, error } = await supabase.from(collection).select(envelopeColumns).eq('id', id).maybeSingle();
  if (error) throw new ApiError(500, 'The record could not be read. Please try again.');
  return data as ContentRecord | null;
}

export async function logActivity(supabase: SupabaseClient, actor: string, action: string, entityType: string, entityId: string | null): Promise<void> {
  const { error } = await supabase.from('admin_activity_logs').insert({ actor, action, entity_type: entityType, entity_id: entityId });
  if (error) console.error('[radar] activity log insert failed:', error.message);
}

async function snapshotRevision(supabase: SupabaseClient, actor: string, collection: Collection, current: ContentRecord): Promise<void> {
  const { error } = await supabase.from('content_revisions').insert({ entity_type: collection, entity_id: current.id, snapshot: current, created_by: actor });
  if (error) throw new ApiError(500, 'The revision could not be saved; the change was not applied.');
  // Keep the most recent 20 revisions per entity.
  const { data: stale } = await supabase.from('content_revisions').select('id')
    .eq('entity_type', collection).eq('entity_id', current.id)
    .order('created_at', { ascending: false }).range(20, 1000);
  if (stale?.length) await supabase.from('content_revisions').delete().in('id', stale.map(row => row.id));
}

function conflictMessage(collection: Collection, message: string): ApiError {
  if (/duplicate key|unique constraint/i.test(message)) return new ApiError(409, `Another ${collection.replace(/_/g, ' ')} record already uses this slug. Choose a different slug.`);
  return new ApiError(500, 'The record could not be saved. Please try again.');
}

export async function saveRecord(supabase: SupabaseClient, actor: string, collection: Collection, input: unknown, intent: SaveIntent): Promise<ContentRecord> {
  const parsed = recordSchema(collection).parse(input);
  const id = parsed.id ?? crypto.randomUUID();
  const current = await fetchRecord(supabase, collection, id);
  if (parsed.id && !current) throw new ApiError(404, 'This record no longer exists. Refresh the workspace and try again.');

  if (collection === 'site_settings') {
    const { data: existing, error } = await supabase.from('site_settings').select('id').limit(2);
    if (error) throw new ApiError(500, 'Settings could not be read. Please try again.');
    if (existing && existing.length > 0 && !existing.some(row => row.id === id)) {
      throw new ApiError(409, 'Website settings are a single record. Edit the existing settings instead of creating another.');
    }
  }

  // Saving a draft never unpublishes a live page: the public snapshot stays
  // intact until the editor explicitly publishes or archives.
  const status: PublishStatus = intent === 'publish' ? 'published'
    : intent === 'archive' ? 'archived'
    : current?.status === 'published' ? 'published' : 'draft';
  const published_data = intent === 'publish' ? parsed.data : current?.published_data ?? null;

  if (current) await snapshotRevision(supabase, actor, collection, current);
  const row = { id, title: parsed.title, slug: parsed.slug, status, display_order: parsed.display_order, is_featured: parsed.is_featured, data: parsed.data, published_data };
  const { data, error } = await supabase.from(collection).upsert(row, { onConflict: 'id' }).select(envelopeColumns).single();
  if (error) throw conflictMessage(collection, error.message);
  await logActivity(supabase, actor, current ? `content.${intent}` : 'content.create', collection, id);
  return data as ContentRecord;
}

export async function deleteRecord(supabase: SupabaseClient, actor: string, collection: Collection, id: string): Promise<void> {
  if (collection === 'site_settings') throw new ApiError(400, 'Website settings cannot be deleted. Edit them instead.');
  const current = await fetchRecord(supabase, collection, id);
  if (!current) throw new ApiError(404, 'This record no longer exists.');
  await snapshotRevision(supabase, actor, collection, current);
  const { error } = await supabase.from(collection).delete().eq('id', id);
  if (error) throw new ApiError(500, 'The record could not be deleted. Please try again.');
  await logActivity(supabase, actor, 'content.delete', collection, id);
}

export async function restoreRevision(supabase: SupabaseClient, actor: string, revisionId: string): Promise<ContentRecord> {
  const { data: revision, error } = await supabase.from('content_revisions').select('id,entity_type,entity_id,snapshot').eq('id', revisionId).maybeSingle();
  if (error || !revision) throw new ApiError(404, 'This revision could not be found.');
  const collection = revision.entity_type as Collection;
  const snapshot = revision.snapshot as ContentRecord;
  const parsed = recordSchema(collection).parse({ ...snapshot, id: revision.entity_id });
  const current = await fetchRecord(supabase, collection, revision.entity_id);
  if (current) await snapshotRevision(supabase, actor, collection, current);
  // Restores land as drafts so nothing reaches the public site without an
  // explicit publish; the currently live snapshot is preserved meanwhile.
  const row = { id: revision.entity_id, title: parsed.title, slug: parsed.slug, status: 'draft' as PublishStatus, display_order: parsed.display_order, is_featured: parsed.is_featured, data: parsed.data, published_data: current?.published_data ?? null };
  const { data, error: writeError } = await supabase.from(collection).upsert(row, { onConflict: 'id' }).select(envelopeColumns).single();
  if (writeError) throw conflictMessage(collection, writeError.message);
  await logActivity(supabase, actor, 'content.restore', collection, revision.entity_id);
  return data as ContentRecord;
}