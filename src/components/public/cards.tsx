import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { ContentRecord } from '@/types/content';
import { dateLabel, eventStatus, strings, text } from '@/lib/content';
import { MediaImage } from '@/components/ui/media-image';
import { PlaceholderArt } from './placeholder-art';
import { ResearchIcon } from './research-icon';

export function MemberCard({ member }: { member: ContentRecord }) {
  const image = text(member.data, 'profile_image');
  return (
    <Link href={`/members/${member.slug}`} className="member-card">
      <div className="member-portrait">{image ? <MediaImage src={image} alt={member.title} sizes="(max-width: 640px) 100vw, 30vw" /> : <PlaceholderArt kind="member" label={member.title} />}</div>
      <div className="member-card-body">
        <h3>{member.title}</h3>
        <p className="member-designation">{text(member.data, 'designation')}</p>
        <p className="member-department">{text(member.data, 'department')}</p>
        {strings(member.data, 'research_interests').length > 0 && <div className="chip-row">{strings(member.data, 'research_interests').slice(0, 3).map(interest => <span key={interest} className="chip">{interest}</span>)}</div>}
      </div>
    </Link>
  );
}
export function EventCard({ event, featured = false }: { event: ContentRecord; featured?: boolean }) {
  const image = text(event.data, 'cover_image');
  const start = text(event.data, 'start_date');
  return (
    <Link href={`/events/${event.slug}`} className={`event-card${featured ? ' is-featured' : ''}`}>
      <div className="event-cover">{image ? <MediaImage src={image} alt={event.title} /> : <PlaceholderArt kind="event" label={text(event.data, 'category', 'Event')} />}</div>
      <div className="event-card-body">
        <div className="card-meta"><span className="badge">{text(event.data, 'category', 'Event')}</span><span>{start ? dateLabel(start) : 'Date not recorded'}</span></div>
        <h3>{event.title}</h3>
        {text(event.data, 'venue') && <p className="card-venue"><MapPin size={14} strokeWidth={1.75} />{text(event.data, 'venue')}</p>}
        <p>{text(event.data, 'short_description')}</p>
        <span className="text-link">Read more<ArrowUpRight size={14} strokeWidth={1.75} /></span>
      </div>
    </Link>
  );
}
export function ProjectCard({ project }: { project: ContentRecord }) {
  const image = text(project.data, 'cover_image');
  return (
    <Link href={`/projects/${project.slug}`} className="project-card">
      <div className="project-cover">{image ? <MediaImage src={image} alt={project.title} /> : <PlaceholderArt kind="project" label={text(project.data, 'category', 'Project')} />}</div>
      <div className="project-card-body">
        <div className="card-meta"><span className="badge badge-teal">{text(project.data, 'category', 'Research')}</span><span>{text(project.data, 'project_status')}</span></div>
        <h3>{project.title}</h3>
        <p>{text(project.data, 'short_description')}</p>
        {text(project.data, 'mentor') && <p className="card-mentor">Mentor · {text(project.data, 'mentor')}</p>}
        <span className="text-link">View project<ArrowUpRight size={14} strokeWidth={1.75} /></span>
      </div>
    </Link>
  );
}
export function ResearchCard({ area, large = false }: { area: ContentRecord; large?: boolean }) {
  const image = text(area.data, 'cover_image');
  return (
    <Link href={`/research/${area.slug}`} className={`research-card${large ? ' is-large' : ''}`}>
      {image && <div className="research-card-image"><MediaImage src={image} alt={area.title} /></div>}
      <span className="research-card-icon"><ResearchIcon name={text(area.data, 'icon', 'scan')} /></span>
      <h3>{area.title}</h3>
      <p>{text(area.data, 'description')}</p>
      <span className="text-link">Explore area<ArrowUpRight size={14} strokeWidth={1.75} /></span>
    </Link>
  );
}
export function AchievementCard({ achievement }: { achievement: ContentRecord }) {
  const url = text(achievement.data, 'external_url');
  return (
    <article className="achievement-card">
      <span className="badge badge-gold">{text(achievement.data, 'achievement_type', 'Achievement')}</span>
      <h3>{achievement.title}</h3>
      <p className="achievement-person">{text(achievement.data, 'person_name')}</p>
      <p>{text(achievement.data, 'description')}</p>
      {url && <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">Supporting link<ArrowUpRight size={14} strokeWidth={1.75} /></a>}
    </article>
  );
}
export function eventStatusLabel(event: ContentRecord) { return eventStatus(event.data); }
