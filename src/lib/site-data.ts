import { cache } from 'react';
import { getPublicData } from '@/lib/database/queries';
import type { ContentRecord, PublicData } from '@/types/content';
export const loadSiteData = cache(async (): Promise<PublicData> => getPublicData());
export function settingsOf(content: PublicData): ContentRecord | undefined { return content.site_settings[0]; }
export function pageOf(content: PublicData, slug: string): ContentRecord | undefined { return content.pages.find(p => p.slug === slug); }
