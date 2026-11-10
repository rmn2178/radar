import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getPublicData } from '@/lib/database/queries';
import { settingsOf } from '@/lib/site-data';
import { PageRenderer } from '@/components/cms/page-renderer';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import type { ContentRecord } from '@/types/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Draft preview', robots: { index: false, follow: false } };

// Admin-only draft preview: renders the working `data` of a page while every
// showcase section still draws from published snapshots. Never cached publicly.
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();
  const { data: page, error } = await supabase
    .from('pages')
    .select('id,title,slug,status,display_order,is_featured,data,published_data,created_at,updated_at')
    .eq('slug', slug).maybeSingle();
  if (error || !page) notFound();
  const content = await getPublicData();
  const preview = { ...content, preview: true, pages: [page as ContentRecord] };
  const settings = settingsOf(content);
  const livePath = page.slug === 'home' ? '/' : `/${page.slug}`;
  return <div className={`public-site theme-${settings?.data.theme === 'white' ? 'white' : 'ivory'} admin-preview`}>
    <div className="admin-preview-bar">
      <Link href="/admin/pages" className="admin-button admin-button-secondary admin-button-small"><ArrowLeft size={14} />Page Builder</Link>
      <span className="admin-preview-label">Draft preview — <strong>{page.title}</strong> · {page.status}. Visitors only see the published version.</span>
      <a href={livePath} target="_blank" rel="noreferrer" className="admin-button admin-button-ghost admin-button-small"><ExternalLink size={14} />Live page</a>
    </div>
    <SiteHeader settings={settings} navigation={content.navigation_items} />
    <PageRenderer page={page as ContentRecord} content={preview} />
    <SiteFooter content={preview} />
  </div>;
}