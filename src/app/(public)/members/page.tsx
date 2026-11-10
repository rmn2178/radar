import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const content = await loadSiteData(); return pageMetadata(pageOf(content, 'members'), content, 'Members'); }
export default async function MembersPage() { const content = await loadSiteData(); const page = pageOf(content, 'members'); if (!page) notFound(); return <PageRenderer page={page} content={content} />; }
