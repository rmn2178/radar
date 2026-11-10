'use client';

import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, ExternalLink, Eye, EyeOff, History, Layers3, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { sectionFields, sectionLabels, slugify } from '@/lib/content';
import { sectionTypes, type ContentData, type ContentRecord, type Section, type SectionType } from '@/types/content';
import { adminRequest, errorMessage, timestamp, useAdminQuery } from './api';
import { FieldInput } from './fields';
import { RevisionsModal } from './revisions';
import { EmptyState, Loading, Notice, PageHeading, StatusBadge, useConfirmation } from './ui';

function newSection(type: SectionType): Section {
  return { id: crypto.randomUUID(), type, visible: true, variant: 'default', data: {} };
}

function sectionsOf(record: ContentRecord): Section[] {
  const value = record.data.sections;
  return Array.isArray(value) ? value as Section[] : [];
}

function SectionEditor({ section, onChange, onRemove, onDuplicate, onMove, canMoveUp, canMoveDown, expanded, onToggle }: {
  section: Section; onChange: (section: Section) => void; onRemove: () => void; onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void; canMoveUp: boolean; canMoveDown: boolean; expanded: boolean; onToggle: () => void;
}) {
  const fields = sectionFields(section.type);
  return <div className={`admin-section-card ${section.visible ? '' : 'admin-section-hidden'}`}>
    <div className="admin-section-head">
      <button type="button" className="admin-section-toggle" onClick={onToggle} aria-expanded={expanded}>
        <Layers3 size={16} /><strong>{sectionLabels[section.type]}</strong>
        {!section.visible && <span className="admin-badge admin-badge-draft">Hidden</span>}
      </button>
      <div className="admin-section-tools">
        <select className="admin-input admin-variant" aria-label="Section style" value={section.variant} onChange={event => onChange({ ...section, variant: event.target.value as Section['variant'] })}>
          <option value="default">Default</option><option value="light">Light</option><option value="dark">Dark</option><option value="split">Split</option>
        </select>
        <button type="button" className="admin-icon-button" aria-label={section.visible ? 'Hide section' : 'Show section'} aria-pressed={!section.visible} onClick={() => onChange({ ...section, visible: !section.visible })}>{section.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button type="button" className="admin-icon-button" aria-label="Move section up" disabled={!canMoveUp} onClick={() => onMove(-1)}><ArrowUp size={16} /></button>
        <button type="button" className="admin-icon-button" aria-label="Move section down" disabled={!canMoveDown} onClick={() => onMove(1)}><ArrowDown size={16} /></button>
        <button type="button" className="admin-icon-button" aria-label="Duplicate section" onClick={onDuplicate}><Copy size={16} /></button>
        <button type="button" className="admin-icon-button admin-icon-danger" aria-label="Delete section" onClick={onRemove}><Trash2 size={16} /></button>
      </div>
    </div>
    {expanded && <div className="admin-section-body">
      {fields.length === 0 && <p className="admin-field-help">This block has no editable fields. Use the style selector above to change its appearance.</p>}
      {fields.map(field => <div className="admin-field" key={field.key}>
        {field.kind !== 'checkbox' && <label className="admin-label" htmlFor={`section-${section.id}-${field.key}`}>{field.label}</label>}
        <FieldInput field={field} value={section.data[field.key]} onChange={value => onChange({ ...section, data: { ...section.data, [field.key]: value } })} />
        {field.help && <p className="admin-field-help">{field.help}</p>}
      </div>)}
    </div>}
  </div>;
}

function PageEditor({ record, onBack, onSaved }: { record: ContentRecord | null; onBack: () => void; onSaved: (record: ContentRecord) => void }) {
  const [title, setTitle] = useState(record?.title ?? '');
  const [slug, setSlug] = useState(record?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!record);
  const [seoTitle, setSeoTitle] = useState(typeof record?.data.seo_title === 'string' ? record.data.seo_title : '');
  const [seoDescription, setSeoDescription] = useState(typeof record?.data.seo_description === 'string' ? record.data.seo_description : '');
  const [sections, setSections] = useState<Section[]>(record ? sectionsOf(record) : [newSection('hero')]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addType, setAddType] = useState<SectionType>('editorial');
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<ContentRecord | null>(record);
  const [showRevisions, setShowRevisions] = useState(false);
  const { confirm, dialog } = useConfirmation();

  function updateSection(index: number, section: Section) { setSections(current => current.map((item, i) => i === index ? section : item)); }
  function moveSection(index: number, direction: -1 | 1) {
    setSections(current => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  async function removeSection(index: number) {
    if (await confirm({ title: 'Delete this section?', description: 'The block is removed from this page. Save afterwards to apply the change.', label: 'Delete section', danger: true })) {
      setSections(current => current.filter((_, i) => i !== index));
    }
  }

  async function save(intent: 'draft' | 'publish') {
    if (busy) return;
    setBusy(intent); setError('');
    try {
      const data: ContentData = { seo_title: seoTitle, seo_description: seoDescription, sections };
      const result = await adminRequest<{ record: ContentRecord }>('/api/admin/content/pages', {
        method: 'POST', body: JSON.stringify({ intent, record: { id: record?.id, title, slug, status: record?.status ?? 'draft', display_order: record?.display_order ?? 0, is_featured: false, data } }),
      });
      setSaved(result.record); onSaved(result.record);
    } catch (cause) { setError(errorMessage(cause)); }
    setBusy(null);
  }

  return <div className="admin-page">
    <div className="admin-editor-top">
      <button type="button" className="admin-button admin-button-ghost" onClick={onBack}><ArrowLeft size={16} />All pages</button>
      <div className="admin-editor-top-actions">
        {saved && <a className="admin-button admin-button-secondary" href={`/admin/preview/${saved.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={15} />Preview draft</a>}
        {saved && <button type="button" className="admin-button admin-button-secondary" onClick={() => setShowRevisions(true)}><History size={15} />Revisions</button>}
        <button type="button" className="admin-button admin-button-secondary" disabled={!!busy || !title || !slug} onClick={() => void save('draft')}>{busy === 'draft' ? <><Loader2 size={15} className="admin-spin" />Saving…</> : 'Save draft'}</button>
        <button type="button" className="admin-button" disabled={!!busy || !title || !slug} onClick={() => void save('publish')}>{busy === 'publish' ? <><Loader2 size={15} className="admin-spin" />Publishing…</> : 'Publish page'}</button>
      </div>
    </div>
    {error && <Notice>{error}</Notice>}
    {saved && <Notice success>Saved — status: {saved.status}. Preview shows the draft; visitors see the published version.</Notice>}
    <div className="admin-panel admin-page-meta">
      <div className="admin-form-grid">
        <div className="admin-field"><label className="admin-label" htmlFor="page-title">Page title</label>
          <input id="page-title" className="admin-input" value={title} maxLength={240} disabled={!!busy} onChange={event => { setTitle(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} /></div>
        <div className="admin-field"><label className="admin-label" htmlFor="page-slug">Slug</label>
          <input id="page-slug" className="admin-input" value={slug} maxLength={160} disabled={!!busy} onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} />
          <p className="admin-field-help">Public URL: /{slug || '…'} (the home page uses “home”).</p></div>
        <div className="admin-field"><label className="admin-label" htmlFor="page-seo-title">SEO title</label>
          <input id="page-seo-title" className="admin-input" value={seoTitle} maxLength={2000} disabled={!!busy} onChange={event => setSeoTitle(event.target.value)} /></div>
        <div className="admin-field"><label className="admin-label" htmlFor="page-seo-description">SEO description</label>
          <textarea id="page-seo-description" className="admin-input admin-textarea" rows={2} value={seoDescription} disabled={!!busy} onChange={event => setSeoDescription(event.target.value)} /></div>
      </div>
    </div>
    <div className="admin-builder-heading"><h2>Sections</h2><span>{sections.length} block{sections.length === 1 ? '' : 's'} · top to bottom</span></div>
    <div className="admin-section-list">
      {sections.map((section, index) => <SectionEditor key={section.id} section={section} expanded={expanded === section.id}
        onToggle={() => setExpanded(current => current === section.id ? null : section.id)}
        onChange={value => updateSection(index, value)} onMove={direction => moveSection(index, direction)}
        canMoveUp={index > 0} canMoveDown={index < sections.length - 1}
        onDuplicate={() => setSections(current => [...current.slice(0, index + 1), { ...section, id: crypto.randomUUID(), data: { ...section.data } }, ...current.slice(index + 1)])}
        onRemove={() => void removeSection(index)} />)}
    </div>
    <div className="admin-add-section">
      <select className="admin-input" aria-label="Section type to add" value={addType} onChange={event => setAddType(event.target.value as SectionType)}>
        {sectionTypes.map(type => <option key={type} value={type}>{sectionLabels[type]}</option>)}
      </select>
      <button type="button" className="admin-button admin-button-secondary" disabled={sections.length >= 100} onClick={() => { const section = newSection(addType); setSections(current => [...current, section]); setExpanded(section.id); }}><Plus size={16} />Add section</button>
    </div>
    {showRevisions && saved && <RevisionsModal collection="pages" record={saved} onClose={() => setShowRevisions(false)} onRestored={onBack} />}
    {dialog}
  </div>;
}

export function PagesManager() {
  const { data, setData, error, loading, refresh } = useAdminQuery<{ records: ContentRecord[] }>('/api/admin/content/pages');
  const [editing, setEditing] = useState<ContentRecord | null | undefined>(undefined);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const { confirm, dialog } = useConfirmation();
  const records = data?.records ?? [];

  async function mutate(record: ContentRecord, intent: 'publish' | 'archive') {
    setBusyId(record.id); setActionError('');
    try {
      const result = await adminRequest<{ record: ContentRecord }>('/api/admin/content/pages', { method: 'POST', body: JSON.stringify({ intent, record }) });
      setData(current => current ? { records: current.records.map(item => item.id === result.record.id ? result.record : item) } : current);
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  async function remove(record: ContentRecord) {
    if (!await confirm({ title: 'Delete page?', description: `“${record.title}” (/${record.slug}) will be removed from the website permanently.`, label: 'Delete page', danger: true })) return;
    setBusyId(record.id); setActionError('');
    try {
      await adminRequest('/api/admin/content/pages', { method: 'DELETE', body: JSON.stringify({ id: record.id }) });
      setData(current => current ? { records: current.records.filter(item => item.id !== record.id) } : current);
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  if (editing !== undefined) return <PageEditor record={editing} onBack={() => { setEditing(undefined); refresh(); }} onSaved={record => setData(current => current ? { records: current.records.some(item => item.id === record.id) ? current.records.map(item => item.id === record.id ? record : item) : [...current.records, record] } : { records: [record] })} />;

  return <div className="admin-page">
    <PageHeading eyebrow="CONTENT" title="Page Builder" description="Compose public pages from typed sections. Reorder, hide, duplicate and publish blocks without touching code.">
      <button type="button" className="admin-button" onClick={() => setEditing(null)}><Plus size={17} />New page</button>
    </PageHeading>
    {actionError && <Notice>{actionError}</Notice>}
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {!loading && !error && (records.length === 0
      ? <EmptyState title="No pages yet" description="Create your first page and compose it from sections."><button type="button" className="admin-button" onClick={() => setEditing(null)}><Plus size={16} />New page</button></EmptyState>
      : <div className="admin-page-grid">{records.map(record => {
        const busy = busyId === record.id;
        const count = sectionsOf(record).length;
        return <article key={record.id} className="admin-page-card">
          <div className="admin-page-card-top"><Layers3 size={20} /><StatusBadge status={record.status} /></div>
          <h3>{record.title}</h3>
          <p className="admin-cell-muted">/{record.slug} · {count} section{count === 1 ? '' : 's'}</p>
          <p className="admin-cell-muted">Updated {timestamp(record.updated_at)}</p>
          <div className="admin-page-card-actions">
            <button type="button" className="admin-button admin-button-secondary admin-button-small" disabled={busy} onClick={() => setEditing(record)}><Pencil size={14} />Edit</button>
            <a className="admin-button admin-button-ghost admin-button-small" href={`/admin/preview/${record.slug}`} target="_blank" rel="noreferrer"><Eye size={14} />Preview</a>
            {record.status !== 'published'
              ? <button type="button" className="admin-button admin-button-small" disabled={busy} onClick={() => void mutate(record, 'publish')}>Publish</button>
              : <button type="button" className="admin-button admin-button-ghost admin-button-small" disabled={busy} onClick={async () => { if (await confirm({ title: 'Archive page?', description: `/${record.slug} will stop resolving on the public website.`, label: 'Archive' })) void mutate(record, 'archive'); }}>Archive</button>}
            <button type="button" className="admin-icon-button admin-icon-danger" aria-label={`Delete ${record.title}`} disabled={busy || record.slug === 'home'} onClick={() => void remove(record)}><Trash2 size={15} /></button>
          </div>
        </article>;
      })}</div>)}
    {dialog}
  </div>;
}