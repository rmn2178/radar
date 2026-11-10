'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { definitions, slugify } from '@/lib/content';
import type { Collection, ContentData, ContentRecord } from '@/types/content';
import { adminRequest, errorMessage } from './api';
import { FieldInput, fieldDefault } from './fields';
import { Notice } from './ui';

export function RecordForm({ collection, record, onSaved, onCancel }: {
  collection: Collection; record: ContentRecord | null;
  onSaved: (record: ContentRecord) => void; onCancel: () => void;
}) {
  const definition = definitions[collection];
  const [title, setTitle] = useState(record?.title ?? '');
  const [slug, setSlug] = useState(record?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!record);
  const [order, setOrder] = useState(record?.display_order ?? 0);
  const [featured, setFeatured] = useState(record?.is_featured ?? false);
  const [data, setData] = useState<ContentData>(() => {
    const base: ContentData = {};
    for (const field of definition.fields) base[field.key] = fieldDefault(field);
    return { ...base, ...(record?.data ?? {}) };
  });
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');

  async function save(intent: 'draft' | 'publish') {
    if (busy) return;
    setError(''); setBusy(intent);
    try {
      const result = await adminRequest<{ record: ContentRecord }>(`/api/admin/content/${collection}`, {
        method: 'POST',
        body: JSON.stringify({ intent, record: { id: record?.id, title, slug, status: record?.status ?? 'draft', display_order: order, is_featured: featured, data } }),
      });
      onSaved(result.record);
    } catch (cause) { setError(errorMessage(cause)); setBusy(null); }
  }

  return <form className="admin-record-form" onSubmit={event => { event.preventDefault(); void save('draft'); }}>
    {error && <Notice>{error}</Notice>}
    <div className="admin-form-grid">
      <div className="admin-field">
        <label className="admin-label" htmlFor="record-title">Title</label>
        <input id="record-title" className="admin-input" value={title} required maxLength={240} disabled={!!busy}
          onChange={event => { setTitle(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} />
      </div>
      <div className="admin-field">
        <label className="admin-label" htmlFor="record-slug">Slug</label>
        <input id="record-slug" className="admin-input" value={slug} required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={!!busy}
          onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} />
        <p className="admin-field-help">Lowercase letters, numbers and hyphens. Used in the public URL.</p>
      </div>
      <div className="admin-field">
        <label className="admin-label" htmlFor="record-order">Display order</label>
        <input id="record-order" className="admin-input" type="number" min={0} max={100000} value={order} disabled={!!busy} onChange={event => setOrder(Number(event.target.value))} />
      </div>
      <div className="admin-field admin-field-check">
        <FieldInput field={{ key: 'is_featured', label: 'Featured', kind: 'checkbox' }} value={featured} onChange={value => setFeatured(value === true)} disabled={!!busy} />
      </div>
    </div>
    <div className="admin-form-sections">
      {definition.fields.map(field => <div className="admin-field" key={field.key}>
        {field.kind !== 'checkbox' && <label className="admin-label" htmlFor={`field-${field.key}`}>{field.label}</label>}
        <FieldInput field={field} value={data[field.key]} onChange={value => setData(current => ({ ...current, [field.key]: value }))} disabled={!!busy} />
        {field.help && <p className="admin-field-help">{field.help}</p>}
      </div>)}
    </div>
    <div className="admin-dialog-actions admin-form-actions">
      <button type="button" className="admin-button admin-button-secondary" onClick={onCancel} disabled={!!busy}>Cancel</button>
      <button type="submit" className="admin-button admin-button-secondary" disabled={!!busy || !title || !slug}>
        {busy === 'draft' ? <><Loader2 size={16} className="admin-spin" />Saving…</> : 'Save draft'}
      </button>
      <button type="button" className="admin-button" disabled={!!busy || !title || !slug} onClick={() => void save('publish')}>
        {busy === 'publish' ? <><Loader2 size={16} className="admin-spin" />Publishing…</> : 'Save & publish'}
      </button>
    </div>
    <p className="admin-field-help">Saving a draft keeps the current public version live. Publishing replaces it.</p>
  </form>;
}