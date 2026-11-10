import { notFound } from 'next/navigation';
import { loadSiteData } from '@/lib/site-data';
import { text } from '@/lib/content';
import { BackLink, CoverFrame, ProseBlock } from '@/components/public/detail';
import { ResearchCard } from '@/components/public/cards';
import { ResearchIcon } from '@/components/public/research-icon';
import { Reveal } from '@/components/ui/reveal';
import type { ContentRecord } from '@/types/content';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const content = await loadSiteData(); const area = content.research_areas.find(a => a.slug === slug); if (!area) notFound(); return { title: area.title, description: text(area.data, 'description') }; }
export default async function ResearchAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteData();
  const area = content.research_areas.find(a => a.slug === slug);
  if (!area) notFound();
  const others = content.research_areas.filter(a => a.id !== area.id).slice(0, 3);
  return (
    <main id="main-content">
      <div className="container detail-top"><BackLink href="/research" label="All research areas" /></div>
      <ResearchHeader area={area} />
      <section className="section detail-body"><div className="container narrow">
        {text(area.data, 'cover_image') && <CoverFrame src={text(area.data, 'cover_image')} title={area.title} kind="research" icon={text(area.data, 'icon')} />}
        <ProseBlock title="Overview" body={text(area.data, 'extended_description') || text(area.data, 'description')} />
      </div></section>
      {others.length > 0 && <section className="section variant-light"><div className="container"><Reveal><h2 className="section-title">Connected research</h2><div className="research-grid">{others.map(other => <ResearchCard key={other.id} area={other} />)}</div></Reveal></div></section>}
    </main>
  );
}
function ResearchHeader({ area }: { area: ContentRecord }) {
  return (
    <section className="section detail-header"><div className="container"><Reveal>
      <span className="research-detail-icon"><ResearchIcon name={text(area.data, 'icon', 'scan')} size={28} /></span>
      <p className="eyebrow">Research focus</p>
      <h1 className="detail-title">{area.title}</h1>
      <p className="detail-lead">{text(area.data, 'description')}</p>
    </Reveal></div></section>
  );
}
