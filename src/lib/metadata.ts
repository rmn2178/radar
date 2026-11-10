import type { Metadata } from 'next';
import type { ContentRecord, PublicData } from '@/types/content';
import { text } from '@/lib/content';
import { settingsOf } from '@/lib/site-data';
export function pageMetadata(page: ContentRecord | undefined, content: PublicData, fallbackTitle: string): Metadata {
  const settings = settingsOf(content)?.data;
  const title = text(page?.data, 'seo_title') || page?.title || fallbackTitle;
  const description = text(page?.data, 'seo_description') || text(settings, 'seo_description');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const image = text(settings, 'social_image');
  return {
    title,
    description,
    alternates: { canonical: page?.slug === 'home' ? '/' : `/${page?.slug ?? ''}` },
    openGraph: { title, description, siteName: text(settings, 'site_name', 'RADAR Centre'), type: 'website', url: `${siteUrl}${page?.slug === 'home' ? '/' : `/${page?.slug ?? ''}`}`, ...(image ? { images: [{ url: image }] } : {}) }
  };
}
