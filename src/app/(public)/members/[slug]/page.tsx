import { notFound } from 'next/navigation';
import { GraduationCap, Mail } from 'lucide-react';
import { loadSiteData } from '@/lib/site-data';
import { strings, text } from '@/lib/content';
import { BackLink, ChipList, ExternalLinks, ProseBlock } from '@/components/public/detail';
import { PlaceholderArt } from '@/components/public/placeholder-art';
import { MediaImage } from '@/components/ui/media-image';
import { EventCard, ProjectCard } from '@/components/public/cards';
import { Reveal } from '@/components/ui/reveal';
import { EmptyState } from '@/components/ui/empty-state';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const content = await loadSiteData(); const member = content.members.find(m => m.slug === slug); if (!member) notFound(); return { title: member.title, description: text(member.data, 'biography').slice(0, 160) }; }
export default async function MemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteData();
  const member = content.members.find(m => m.slug === slug);
  if (!member) notFound();
  const image = text(member.data, 'profile_image');
  const projects = content.projects.filter(project => text(project.data, 'mentor') === member.title || strings(project.data, 'contributors').includes(member.title));
  const events = content.events.filter(event => strings(event.data, 'participants').some(participant => participant.includes(member.title)));
  return (
    <main id="main-content">
      <section className="section"><div className="container">
        <BackLink href="/members" label="All members" />
        <div className="member-detail">
          <Reveal className="member-detail-portrait">{image ? <MediaImage src={image} alt={member.title} priority /> : <PlaceholderArt kind="member" label={member.title} />}</Reveal>
          <Reveal delay={0.1} className="member-detail-info">
            <p className="eyebrow">{text(member.data, 'category', 'Faculty')}</p>
            <h1 className="detail-title">{member.title}</h1>
            <p className="member-designation">{text(member.data, 'designation')}</p>
            <p className="member-department"><GraduationCap size={16} strokeWidth={1.75} />{text(member.data, 'department')}</p>
            <ChipList items={strings(member.data, 'research_interests')} />
            <ProseBlock title="Biography" body={text(member.data, 'biography')} />
            <div className="button-row">
              {text(member.data, 'email') && <a className="btn btn-secondary" href={`mailto:${text(member.data, 'email')}`}><Mail size={15} strokeWidth={1.75} /><span>Email</span></a>}
              <ExternalLinks links={[["LinkedIn", text(member.data, 'linkedin_url')], ["Google Scholar", text(member.data, 'google_scholar_url')], ["Website", text(member.data, 'website_url')]]} />
            </div>
          </Reveal>
        </div>
      </div></section>
      {projects.length > 0 && <section className="section variant-light"><div className="container"><Reveal><h2 className="section-title">Associated projects</h2><div className="project-grid">{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div></Reveal></div></section>}
      {events.length > 0 && <section className="section"><div className="container"><Reveal><h2 className="section-title">Activities</h2><div className="event-grid">{events.map(event => <EventCard key={event.id} event={event} />)}</div></Reveal></div></section>}
      {projects.length === 0 && events.length === 0 && <section className="section"><div className="container"><EmptyState title="More profile details coming soon" description="Research interests, publications and activities can be added by the centre administrator." /></div></section>}
    </main>
  );
}
