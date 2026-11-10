import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const content = await loadSiteData(); return pageMetadata(pageOf(content, 'contact'), content, 'Contact'); }
export default async function ContactPage() { const content = await loadSiteData(); const page = pageOf(content, 'contact'); if (!page) notFound(); return <PageRenderer page={page} content={content} />; }
