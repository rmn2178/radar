import type { MetadataRoute } from 'next';
import { loadSiteData } from '@/lib/site-data';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await loadSiteData();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const entries: MetadataRoute.Sitemap = [];
  for (const page of content.pages) entries.push({ url: `${base}${page.slug === 'home' ? '/' : `/${page.slug}`}`, lastModified: page.updated_at ? new Date(page.updated_at) : undefined, changeFrequency: 'weekly', priority: page.slug === 'home' ? 1 : 0.8 });
  for (const member of content.members) entries.push({ url: `${base}/members/${member.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  for (const event of content.events) entries.push({ url: `${base}/events/${event.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  for (const project of content.projects) entries.push({ url: `${base}/projects/${project.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  for (const area of content.research_areas) entries.push({ url: `${base}/research/${area.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  return entries;
}
