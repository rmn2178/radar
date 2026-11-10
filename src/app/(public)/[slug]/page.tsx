import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const content = await loadSiteData(); const page = pageOf(content, slug); if (!page || ['home', 'about', 'research', 'members', 'events', 'projects', 'contact'].includes(slug)) notFound(); return pageMetadata(page, content, 'RADAR Centre'); }
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteData();
  const page = pageOf(content, slug);
  if (!page || ['home', 'about', 'research', 'members', 'events', 'projects', 'contact'].includes(slug)) notFound();
  return <PageRenderer page={page} content={content} />;
}
