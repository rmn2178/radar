import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const content = await loadSiteData(); return pageMetadata(pageOf(content, 'events'), content, 'Events & Activities'); }
export default async function EventsPage() { const content = await loadSiteData(); const page = pageOf(content, 'events'); if (!page) notFound(); return <PageRenderer page={page} content={content} />; }
