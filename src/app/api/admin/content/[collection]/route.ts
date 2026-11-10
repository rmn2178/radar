import { z } from 'zod';
import { isCollection } from '@/lib/content';
import { requireAdminApi } from '@/lib/auth/require-admin';
import { deleteRecord, saveRecord, type SaveIntent } from '@/lib/database/mutations';
import { ApiError, apiFailure, ensureConfigured, json, readJson } from '@/lib/http';
import type { Collection, ContentRecord } from '@/types/content';

const columns = 'id,title,slug,status,display_order,is_featured,data,published_data,created_at,updated_at';
const intentSchema = z.enum(['draft', 'publish', 'archive']);

async function collectionOf(params: Promise<{ collection: string }>): Promise<Collection> {
  const { collection } = await params;
  if (!isCollection(collection)) throw new ApiError(404, 'Unknown content collection.');
  return collection;
}

export async function GET(_request: Request, context: { params: Promise<{ collection: string }> }) {
  try {
    ensureConfigured();
    const collection = await collectionOf(context.params);
    const { supabase } = await requireAdminApi();
    const { data, error } = await supabase.from(collection).select(columns)
      .order('display_order', { ascending: true }).order('created_at', { ascending: true });
    if (error) throw new ApiError(500, 'The records could not be loaded. Please try again.');
    return json({ records: (data ?? []) as ContentRecord[] });
  } catch (cause) { return apiFailure(cause); }
}

export async function POST(request: Request, context: { params: Promise<{ collection: string }> }) {
  try {
    ensureConfigured();
    const collection = await collectionOf(context.params);
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { record?: unknown; intent?: unknown } | null;
    const intent: SaveIntent = intentSchema.parse(body?.intent ?? 'draft');
    const record = await saveRecord(supabase, user.id, collection, body?.record, intent);
    return json({ record });
  } catch (cause) { return apiFailure(cause); }
}

export async function DELETE(request: Request, context: { params: Promise<{ collection: string }> }) {
  try {
    ensureConfigured();
    const collection = await collectionOf(context.params);
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    await deleteRecord(supabase, user.id, collection, id);
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}