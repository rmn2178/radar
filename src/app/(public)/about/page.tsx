import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const content = await loadSiteData(); return pageMetadata(pageOf(content, 'about'), content, 'About RADAR'); }
export default async function AboutPage() { const content = await loadSiteData(); const page = pageOf(content, 'about'); if (!page) notFound(); return <PageRenderer page={page} content={content} />; }
