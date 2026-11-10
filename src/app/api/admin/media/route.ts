import { z } from 'zod';
import { requireAdminApi } from '@/lib/auth/require-admin';
import { logActivity } from '@/lib/database/mutations';
import { ApiError, apiFailure, ensureConfigured, json, readJson } from '@/lib/http';
import type { MediaAsset } from '@/types/content';

const BUCKET = 'radar-media';
const folders = ['branding', 'members', 'events', 'projects', 'research', 'achievements', 'pages', 'general'] as const;
const allowed: Record<string, { extension: string; maxBytes: number }> = {
  'image/jpeg': { extension: 'jpg', maxBytes: 8 * 1024 * 1024 },
  'image/png': { extension: 'png', maxBytes: 8 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maxBytes: 8 * 1024 * 1024 },
  'image/gif': { extension: 'gif', maxBytes: 8 * 1024 * 1024 },
  'application/pdf': { extension: 'pdf', maxBytes: 15 * 1024 * 1024 },
};
const assetColumns = 'id,file_name,storage_path,public_url,mime_type,file_size,image_width,image_height,alt_text,caption,uploaded_by,created_at';

export async function GET() {
  try {
    ensureConfigured();
    const { supabase } = await requireAdminApi();
    const { data, error } = await supabase.from('media_assets').select(assetColumns).order('created_at', { ascending: false }).limit(500);
    if (error) throw new ApiError(500, 'The media library could not be loaded. Please try again.');
    return json({ assets: (data ?? []) as MediaAsset[] });
  } catch (cause) { return apiFailure(cause); }
}

export async function POST(request: Request) {
  let uploadedPath: string | null = null;
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) throw new ApiError(400, 'Choose a file to upload.');
    const type = allowed[file.type];
    if (!type) throw new ApiError(400, 'Only JPEG, PNG, WebP, GIF images and PDF documents are accepted.');
    if (file.size > type.maxBytes) throw new ApiError(400, `This file is too large. The limit is ${Math.round(type.maxBytes / (1024 * 1024))} MB.`);
    const folder = z.enum(folders).parse(form.get('folder') ?? 'general');
    const altText = z.string().max(300).parse(form.get('alt_text') ?? '');
    const caption = z.string().max(1000).parse(form.get('caption') ?? '');
    const path = `${folder}/${crypto.randomUUID()}.${type.extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new ApiError(500, 'The file could not be uploaded. Please try again.');
    uploadedPath = path;
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const fileName = file.name.replace(/[^\w.\- ]+/g, '').slice(0, 180) || path;
    const { data, error } = await supabase.from('media_assets').insert({
      file_name: fileName, storage_path: path, public_url: publicUrl, mime_type: file.type,
      file_size: file.size, image_width: null, image_height: null,
      alt_text: altText, caption, uploaded_by: user.id,
    }).select(assetColumns).single();
    if (error) throw new ApiError(500, 'The upload finished but its details could not be saved. Please try again.');
    await logActivity(supabase, user.id, 'media.upload', 'media_assets', data.id);
    return json({ asset: data as MediaAsset });
  } catch (cause) {
    if (uploadedPath && cause instanceof ApiError && cause.status >= 500) {
      // Do not orphan storage objects when the metadata write fails.
      try {
        const { supabase } = await requireAdminApi();
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      } catch { /* best effort cleanup */ }
    }
    return apiFailure(cause);
  }
}

export async function PATCH(request: Request) {
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown; alt_text?: unknown; caption?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    const alt_text = z.string().max(300).parse(body?.alt_text ?? '');
    const caption = z.string().max(1000).parse(body?.caption ?? '');
    const { error } = await supabase.from('media_assets').update({ alt_text, caption }).eq('id', id);
    if (error) throw new ApiError(500, 'The media details could not be updated. Please try again.');
    await logActivity(supabase, user.id, 'media.update', 'media_assets', id);
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}

export async function DELETE(request: Request) {
  try {
    ensureConfigured();
    const { supabase, user } = await requireAdminApi();
    const body = await readJson(request) as { id?: unknown } | null;
    const id = z.uuid().parse(body?.id);
    const { data: asset, error } = await supabase.from('media_assets').select('storage_path').eq('id', id).maybeSingle();
    if (error || !asset) throw new ApiError(404, 'This media item could not be found.');
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    if (removeError) throw new ApiError(500, 'The file could not be removed from storage. Please try again.');
    const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', id);
    if (deleteError) throw new ApiError(500, 'The media details could not be deleted. Please try again.');
    await logActivity(supabase, user.id, 'media.delete', 'media_assets', id);
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}