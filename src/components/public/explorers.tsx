'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ContentRecord } from '@/types/content';
import { eventStatus, text } from '@/lib/content';
import { EventCard, MemberCard, ProjectCard } from './cards';
import { EmptyState } from '@/components/ui/empty-state';
const eventCategories = ['All', 'Outreach', 'Workshops', 'Industrial Visits', 'Exhibitions', 'Knowledge Sharing', 'Other'];
const projectCategories = ['All', 'Medical Imaging', 'Healthcare AI', 'Assistive Technology', 'Biomedical Engineering', 'Other Research'];
function matches(record: ContentRecord, query: string, keys: string[]) {
  if (!query) return true;
  const q = query.toLowerCase();
  return record.title.toLowerCase().includes(q) || keys.some(key => text(record.data, key).toLowerCase().includes(q));
}
function FilterBar({ categories, active, onChange, query, onQuery, placeholder }: { categories: string[]; active: string; onChange: (v: string) => void; query: string; onQuery: (v: string) => void; placeholder: string }) {
  return (
    <div className="explorer-toolbar">
      <div className="filter-tabs" role="tablist" aria-label="Filter by category">
        {categories.map(category => <button key={category} type="button" role="tab" aria-selected={active === category} className={active === category ? 'active' : ''} onClick={() => onChange(category)}>{category}</button>)}
      </div>
      <label className="search-field"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>
    </div>
  );
}
export function EventExplorer({ events }: { events: ContentRecord[] }) {
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(6);
  const filtered = useMemo(() => {
    const list = events.filter(event => (category === 'All' || text(event.data, 'category') === category) && (status === 'All' || eventStatus(event.data) === status) && matches(event, query, ['venue', 'short_description', 'full_description']));
    const rank = (event: ContentRecord) => { const s = eventStatus(event.data); return s === 'Upcoming' || s === 'Ongoing' ? 0 : s === 'Completed' ? 1 : 2; };
    return list.sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      const da = text(a.data, 'start_date'), db = text(b.data, 'start_date');
      if (!da && !db) return a.display_order - b.display_order;
      if (!da) return 1;
      if (!db) return -1;
      return ra === 1 ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [events, category, status, query]);
  return (
    <div>
      <FilterBar categories={eventCategories} active={category} onChange={v => { setCategory(v); setCount(6); }} query={query} onQuery={v => { setQuery(v); setCount(6); }} placeholder="Search events" />
      <div className="status-tabs" aria-label="Filter by event status">
        {['All', 'Upcoming', 'Completed', 'Date not recorded'].map(value => <button key={value} type="button" className={status === value ? 'active' : ''} onClick={() => { setStatus(value); setCount(6); }}>{value}</button>)}
      </div>
      {filtered.length === 0 ? <EmptyState title="No matching events" description="Try a different category or search term." /> : (
        <>
          <div className="event-grid">{filtered.slice(0, count).map((event, i) => <EventCard key={event.id} event={event} featured={i === 0 && category === 'All' && status === 'All' && !query} />)}</div>
          {count < filtered.length && <div className="load-more"><button type="button" className="btn btn-secondary" onClick={() => setCount(c => c + 6)}>Load more events</button></div>}
        </>
      )}
    </div>
  );
}
export function ProjectExplorer({ projects }: { projects: ContentRecord[] }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(6);
  const filtered = useMemo(() => projects.filter(project => (category === 'All' || text(project.data, 'category') === category) && matches(project, query, ['short_description', 'mentor', 'problem_statement'])).sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.display_order - b.display_order), [projects, category, query]);
  return (
    <div>
      <FilterBar categories={projectCategories} active={category} onChange={v => { setCategory(v); setCount(6); }} query={query} onQuery={v => { setQuery(v); setCount(6); }} placeholder="Search projects" />
      {filtered.length === 0 ? <EmptyState title="No matching projects" description="Try a different category or search term." /> : (
        <>
          <div className="project-grid">{filtered.slice(0, count).map(project => <ProjectCard key={project.id} project={project} />)}</div>
          {count < filtered.length && <div className="load-more"><button type="button" className="btn btn-secondary" onClick={() => setCount(c => c + 6)}>Load more projects</button></div>}
        </>
      )}
    </div>
  );
}
export function MemberExplorer({ members }: { members: ContentRecord[] }) {
  const categories = useMemo(() => ['All', ...Array.from(new Set(members.map(member => text(member.data, 'category')).filter(Boolean)))], [members]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => members.filter(member => (category === 'All' || text(member.data, 'category') === category) && matches(member, query, ['designation', 'department', 'biography'])).sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.display_order - b.display_order), [members, category, query]);
  return (
    <div>
      {categories.length > 2 && <FilterBar categories={categories} active={category} onChange={setCategory} query={query} onQuery={setQuery} placeholder="Search members" />}
      {filtered.length === 0 ? <EmptyState title="No matching members" description="Profiles will appear here once published." /> : <div className="member-grid">{filtered.map(member => <MemberCard key={member.id} member={member} />)}</div>}
    </div>
  );
}
