import type { ContentRecord, PublicData, Section } from '@/types/content';
import { safeUrl, strings, text } from '@/lib/content';
import { ButtonLink } from '@/components/ui/button-link';
import { Reveal } from '@/components/ui/reveal';
import { MediaImage } from '@/components/ui/media-image';
import { EmptyState } from '@/components/ui/empty-state';
import { AchievementCard, EventCard, MemberCard, ProjectCard, ResearchCard } from '@/components/public/cards';
import { EventExplorer, MemberExplorer, ProjectExplorer } from '@/components/public/explorers';
import { ContactSection } from '@/components/public/contact-section';
import { ResearchVisual } from '@/components/public/research-visual';
import { ResearchIcon } from '@/components/public/research-icon';
import { PlaceholderArt } from '@/components/public/placeholder-art';

function ordered(records: ContentRecord[]) { return [...records].sort((a, b) => a.display_order - b.display_order); }
function take(records: ContentRecord[], limit: number) { const list = ordered(records); return limit > 0 ? list.slice(0, limit) : list; }
function Heading({ section, as: Tag = 'h2' }: { section: Section; as?: 'h1' | 'h2' }) {
  return (
    <div className="section-heading">
      {text(section.data, 'eyebrow') && <p className="eyebrow">{text(section.data, 'eyebrow')}</p>}
      {text(section.data, 'heading') && <Tag className="section-title">{text(section.data, 'heading')}</Tag>}
      {text(section.data, 'description') && <p className="section-description">{text(section.data, 'description')}</p>}
    </div>
  );
}
function Buttons({ section }: { section: Section }) {
  return (
    <div className="button-row">
      {text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/')}>{text(section.data, 'button_label')}</ButtonLink>}
      {text(section.data, 'secondary_label') && <ButtonLink href={text(section.data, 'secondary_url', '/')} variant="secondary" arrow={false}>{text(section.data, 'secondary_label')}</ButtonLink>}
    </div>
  );
}
export function SectionRenderer({ section, content, first = false }: { section: Section; content: PublicData; first?: boolean }) {
  if (!section.visible) return null;
  const limit = Number(section.data.limit ?? 0) || 0;
  const variant = section.variant;
  // The first visible block owns the page's single h1; later blocks use h2.
  const tag: 'h1' | 'h2' = first ? 'h1' : 'h2';
  const wrap = (children: React.ReactNode, extra = '') => <section id={section.id} className={`section section-${section.type} variant-${variant} ${extra}`}><div className="container">{children}</div></section>;
  switch (section.type) {
    case 'hero': {
      const image = text(section.data, 'image');
      return wrap(
        <div className="hero-grid">
          <Reveal className="hero-copy">
            <Heading section={section} as={tag} />
            <Buttons section={section} />
            {content.research_areas.length > 0 && <div className="hero-indicators">{ordered(content.research_areas).slice(0, 4).map(area => <span key={area.id}><ResearchIcon name={text(area.data, 'icon', 'scan')} size={14} />{area.title}</span>)}</div>}
          </Reveal>
          <Reveal delay={0.15} className="hero-visual">{image ? <div className="hero-image"><MediaImage src={image} alt={text(section.data, 'image_alt', 'RADAR research')} priority /></div> : <ResearchVisual />}</Reveal>
        </div>, 'hero-section');
    }
    case 'quote':
      return wrap(<Reveal><figure className="quote-strip"><span className="gold-rule" aria-hidden="true" /><blockquote>{text(section.data, 'quote_text')}</blockquote>{text(section.data, 'attribution') && <figcaption>— {text(section.data, 'attribution')}</figcaption>}</figure></Reveal>);
    case 'editorial': {
      const image = text(section.data, 'image');
      if (variant === 'split') return wrap(
        <div className="split-grid">
          <Reveal><Heading section={section} as={tag} /><Buttons section={section} /></Reveal>
          <Reveal delay={0.1}>
            {image ? <div className="editorial-image"><MediaImage src={image} alt={text(section.data, 'image_alt', text(section.data, 'heading'))} /></div> : (
              <div className="focus-panel">
                <p className="focus-panel-label">Research focus</p>
                <ul>{ordered(content.research_areas).slice(0, 6).map(area => <li key={area.id}><ResearchIcon name={text(area.data, 'icon', 'scan')} size={18} /><span>{area.title}</span></li>)}</ul>
              </div>
            )}
          </Reveal>
        </div>);
      return wrap(<Reveal><Heading section={section} as={tag} /><Buttons section={section} /></Reveal>);
    }
    case 'rich_text':
      return wrap(<Reveal><Heading section={section} as={tag} /><div className="prose">{text(section.data, 'body').split(/\n{2,}/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div></Reveal>);
    case 'image_text': {
      const image = text(section.data, 'image');
      return wrap(<div className="split-grid"><Reveal><Heading section={section} as={tag} /><Buttons section={section} /></Reveal><Reveal delay={0.1}><div className="editorial-image">{image ? <MediaImage src={image} alt={text(section.data, 'image_alt', text(section.data, 'heading'))} /> : <PlaceholderArt label={text(section.data, 'heading')} />}</div></Reveal></div>);
    }
    case 'gallery': {
      const images = strings(section.data, 'images');
      return wrap(<Reveal><Heading section={section} as={tag} />{images.length === 0 ? <EmptyState title="Gallery coming soon" description="Photographs will appear here once uploaded." /> : <div className="gallery-grid">{images.map((src, i) => <figure key={`${src}-${i}`} className="gallery-item"><MediaImage src={src} alt={`${text(section.data, 'heading', 'Gallery')} ${i + 1}`} /></figure>)}</div>}</Reveal>);
    }
    case 'research': {
      const areas = take(content.research_areas, limit);
      return wrap(<Reveal><div className="section-head-row"><Heading section={section} as={tag} />{text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/research')} variant="ghost">{text(section.data, 'button_label')}</ButtonLink>}</div>{areas.length === 0 ? <EmptyState title="Research areas coming soon" /> : <div className="research-grid">{areas.map((area, i) => <ResearchCard key={area.id} area={area} large={i === 0 && areas.length > 2} />)}</div>}</Reveal>);
    }
    case 'members': {
      const members = take(content.members, limit);
      return wrap(<Reveal><div className="section-head-row"><Heading section={section} as={tag} />{text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/members')} variant="ghost">{text(section.data, 'button_label')}</ButtonLink>}</div>{limit === 0 ? <MemberExplorer members={ordered(content.members)} /> : members.length === 0 ? <EmptyState title="Member profiles coming soon" /> : <div className="member-grid">{members.map(member => <MemberCard key={member.id} member={member} />)}</div>}</Reveal>);
    }
    case 'events': {
      const events = take(content.events, limit);
      const featured = ordered(content.events).find(event => event.is_featured) ?? events[0];
      const rest = events.filter(event => event.id !== featured?.id);
      return wrap(<Reveal><div className="section-head-row"><Heading section={section} as={tag} />{text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/events')} variant="ghost">{text(section.data, 'button_label')}</ButtonLink>}</div>{limit === 0 ? <EventExplorer events={ordered(content.events)} /> : events.length === 0 ? <EmptyState title="Events coming soon" /> : <div className="event-showcase">{featured && <EventCard event={featured} featured />}{rest.length > 0 && <div className="event-side">{rest.map(event => <EventCard key={event.id} event={event} />)}</div>}</div>}</Reveal>);
    }
    case 'projects': {
      const projects = take(content.projects, limit);
      return wrap(<Reveal><div className="section-head-row"><Heading section={section} as={tag} />{text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/projects')} variant="ghost">{text(section.data, 'button_label')}</ButtonLink>}</div>{limit === 0 ? <ProjectExplorer projects={ordered(content.projects)} /> : projects.length === 0 ? <EmptyState title="Projects coming soon" /> : <div className="project-grid">{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div>}</Reveal>);
    }
    case 'achievements': {
      const achievements = take(content.achievements, limit);
      return wrap(<Reveal><Heading section={section} as={tag} />{achievements.length === 0 ? <EmptyState title="Achievements coming soon" description="Verified achievements will appear here once recorded." /> : <div className="achievement-grid">{achievements.map(item => <AchievementCard key={item.id} achievement={item} />)}</div>}</Reveal>);
    }
    case 'statistics': {
      const items = strings(section.data, 'items').map(item => item.split('|').map(part => part.trim()));
      return wrap(<Reveal><Heading section={section} as={tag} />{items.length === 0 ? <EmptyState title="No statistics recorded" description="Only verified figures are shown here." /> : <dl className="statistics-grid">{items.map(([value, label], i) => <div key={i}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}</Reveal>);
    }
    case 'timeline': {
      const items = strings(section.data, 'items').map(item => item.split('|').map(part => part.trim()));
      return wrap(<Reveal><Heading section={section} as={tag} />{items.length === 0 ? <EmptyState title="Timeline coming soon" /> : <ol className="timeline">{items.map(([date, description], i) => <li key={i}><span className="timeline-date">{date}</span><p>{description}</p></li>)}</ol>}</Reveal>);
    }
    case 'vision': {
      const mission = strings(section.data, 'mission');
      const objectives = strings(section.data, 'objectives');
      return wrap(<Reveal><Heading section={section} as={tag} /><div className="vision-grid"><div className="vision-mission"><h3>Mission</h3><ul>{mission.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div className="vision-objectives"><h3>Objectives</h3><ol>{objectives.map((item, i) => <li key={i}><span className="objective-number">{String(i + 1).padStart(2, '0')}</span><span>{item}</span></li>)}</ol></div></div></Reveal>);
    }
    case 'cta':
      return wrap(<Reveal><div className="closing"><span className="closing-rules" aria-hidden="true" /><p className="eyebrow">{text(section.data, 'eyebrow')}</p><h2 className="closing-title">{text(section.data, 'heading')}</h2>{text(section.data, 'description') && <p className="closing-attribution">— {text(section.data, 'description')}</p>}{text(section.data, 'button_label') && <ButtonLink href={text(section.data, 'button_url', '/contact')} variant="light">{text(section.data, 'button_label')}</ButtonLink>}</div></Reveal>);
    case 'contact':
      return wrap(<Reveal><Heading section={section} as={tag} /><ContactSection content={content} /></Reveal>);
    case 'divider':
      return wrap(<hr className="section-divider" />);
    case 'spacer':
      return <div className="section-spacer" aria-hidden="true" />;
    case 'image': {
      const src = text(section.data, 'image');
      return wrap(<Reveal>{src ? <figure className="full-image"><MediaImage src={src} alt={text(section.data, 'image_alt', text(section.data, 'caption', 'RADAR Centre'))} sizes="100vw" />{text(section.data, 'caption') && <figcaption>{text(section.data, 'caption')}</figcaption>}</figure> : <PlaceholderArt label={text(section.data, 'caption', 'Image')} />}</Reveal>);
    }
    case 'columns':
      return wrap(<Reveal><Heading section={section} as={tag} /><div className="columns-grid"><div className="column-card"><h3>{text(section.data, 'heading')}</h3><p>{text(section.data, 'description')}</p></div><div className="column-card"><h3>{text(section.data, 'second_heading')}</h3><p>{text(section.data, 'second_description')}</p></div></div></Reveal>);
    default:
      return null;
  }
}
export function sectionHref(section: Section) { return safeUrl(text(section.data, 'button_url')); }
