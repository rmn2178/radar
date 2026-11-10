import { notFound } from 'next/navigation';
import { CalendarDays, MapPin } from 'lucide-react';
import { loadSiteData } from '@/lib/site-data';
import { dateLabel, eventStatus, strings, text } from '@/lib/content';
import type { ContentRecord } from '@/types/content';
import { BackLink, CoverFrame, ExternalLinks, GalleryGrid, ProseBlock } from '@/components/public/detail';
import { ProjectCard } from '@/components/public/cards';
import { Reveal } from '@/components/ui/reveal';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const content = await loadSiteData(); const event = content.events.find(e => e.slug === slug); if (!event) notFound(); return { title: event.title, description: text(event.data, 'short_description') }; }
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteData();
  const event = content.events.find(e => e.slug === slug);
  if (!event) notFound();
  const related = content.projects.filter(project => strings(event.data, 'related_projects').includes(project.slug));
  const participants = strings(event.data, 'participants');
  return (
    <main id="main-content">
      <div className="container detail-top"><BackLink href="/events" label="All events & activities" /></div>
      <DetailHeaderWrapper event={event} />
      <section className="section detail-body"><div className="container narrow">
        <CoverFrame src={text(event.data, 'cover_image')} title={event.title} kind="event" />
        <ProseBlock title="About this activity" body={text(event.data, 'full_description') || text(event.data, 'short_description')} />
        <ProseBlock title="Outcomes" body={text(event.data, 'outcomes')} />
        {participants.length > 0 && <Reveal className="prose-block"><h2>Participants</h2><ul className="plain-list">{participants.map(person => <li key={person}>{person}</li>)}</ul></Reveal>}
        <GalleryGrid images={strings(event.data, 'gallery')} title={event.title} />
        <ExternalLinks links={[["Register", text(event.data, 'registration_url')], ["Read the report", text(event.data, 'external_report_url')]]} />
      </div></section>
      {related.length > 0 && <section className="section variant-light"><div className="container"><Reveal><h2 className="section-title">Related projects</h2><div className="project-grid">{related.map(project => <ProjectCard key={project.id} project={project} />)}</div></Reveal></div></section>}
    </main>
  );
}
function DetailHeaderWrapper({ event }: { event: ContentRecord }) {
  const start = text(event.data, 'start_date');
  const end = text(event.data, 'end_date');
  return (
    <section className="section detail-header"><div className="container"><Reveal>
      <p className="eyebrow">{text(event.data, 'category', 'Event')} · {eventStatus(event.data)}</p>
      <h1 className="detail-title">{event.title}</h1>
      <div className="detail-meta">
        <span><CalendarDays size={15} strokeWidth={1.75} />{start ? `${dateLabel(start)}${end && end !== start ? ` – ${dateLabel(end)}` : ''}` : 'Date not recorded'}</span>
        {text(event.data, 'venue') && <span><MapPin size={15} strokeWidth={1.75} />{text(event.data, 'venue')}</span>}
      </div>
      <p className="detail-lead">{text(event.data, 'short_description')}</p>
    </Reveal></div></section>
  );
}
