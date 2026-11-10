import 'server-only';
import { seedData, seedCollections } from '@/data/seed';
import { createPublicSupabaseClient } from '@/lib/supabase/server';
import { isPreview } from '@/lib/supabase/config';
import type { ContentRecord, PublicData } from '@/types/content';

// Public rendering only ever receives published snapshots. Draft `data` never
// leaves the database for anonymous visitors: the public_* views project
// published_data exclusively.
function publishedOnly(record: ContentRecord): ContentRecord {
  const { published_data, ...rest } = record;
  return { ...rest, data: published_data ?? record.data };
}

function previewData(): PublicData {
  const result = { preview: true } as PublicData;
  for (const collection of seedCollections) {
    result[collection] = seedData[collection]
      .filter(record => record.status === 'published')
      .map(publishedOnly);
  }
  return result;
}

export async function getPublicData(): Promise<PublicData> {
  if (isPreview()) return previewData();
  const supabase = createPublicSupabaseClient();
  const entries = await Promise.all(seedCollections.map(async collection => {
    const { data, error } = await supabase
      .from(`public_${collection}`)
      .select('id,title,slug,status,display_order,is_featured,data,created_at,updated_at')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Unable to load published ${collection.replace(/_/g, ' ')}. Please try again shortly.`);
    return [collection, (data ?? []) as ContentRecord[]] as const;
  }));
  const result = { preview: false } as PublicData;
  for (const [collection, records] of entries) result[collection] = records;
  return result;
}