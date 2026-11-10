'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { definitions } from '@/lib/content';
import type { ContentData, ContentRecord, FieldDefinition } from '@/types/content';
import { adminRequest, errorMessage, useAdminQuery } from './api';
import { FieldInput, fieldDefault } from './fields';
import { Loading, Notice, PageHeading, StatusBadge } from './ui';

const contactKeys = ['phone', 'whatsapp_number', 'email', 'address', 'department', 'maps_url', 'linkedin_url', 'instagram_url', 'facebook_url', 'youtube_url'];

function SettingsForm({ record, fields, onSaved }: { record: ContentRecord | null; fields: FieldDefinition[]; onSaved: (record: ContentRecord) => void }) {
  const [data, setData] = useState<ContentData>(() => {
    const base: ContentData = {};
    for (const field of fields) base[field.key] = fieldDefault(field);
    return { ...base, ...(record?.data ?? {}) };
  });
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<ContentRecord | null>(record);

  async function save(intent: 'draft' | 'publish') {
    if (busy) return;
    setBusy(intent); setError('');
    try {
      // Preserve fields outside this editor's scope (contact vs general share one record).
      const merged = { ...(record?.data ?? {}), ...data };
      const result = await adminRequest<{ record: ContentRecord }>('/api/admin/content/site_settings', {
        method: 'POST',
        body: JSON.stringify({ intent, record: { id: record?.id, title: 'Website settings', slug: 'site', status: record?.status ?? 'draft', display_order: 0, is_featured: false, data: merged } }),
      });
      setSaved(result.record); onSaved(result.record);
    } catch (cause) { setError(errorMessage(cause)); }
    setBusy(null);
  }

  return <div className="admin-panel admin-settings-panel">
    {error && <Notice>{error}</Notice>}
    {saved && <Notice success>Settings saved — currently {saved.status}. {saved.status !== 'published' ? 'Publish to make them live.' : 'The public website reflects the published version.'}</Notice>}
    <div className="admin-settings-status">{saved ? <StatusBadge status={saved.status} /> : <StatusBadge status="draft" />}</div>
    <div className="admin-form-sections">
      {fields.map(field => <div className="admin-field" key={field.key}>
        {field.kind !== 'checkbox' && <label className="admin-label" htmlFor={`field-${field.key}`}>{field.label}</label>}
        <FieldInput field={field} value={data[field.key]} onChange={value => setData(current => ({ ...current, [field.key]: value }))} disabled={!!busy} />
        {field.help && <p className="admin-field-help">{field.help}</p>}
      </div>)}
    </div>
    <div className="admin-dialog-actions">
      <button type="button" className="admin-button admin-button-secondary" disabled={!!busy} onClick={() => void save('draft')}>{busy === 'draft' ? <><Loader2 size={16} className="admin-spin" />Saving…</> : 'Save draft'}</button>
      <button type="button" className="admin-button" disabled={!!busy} onClick={() => void save('publish')}>{busy === 'publish' ? <><Loader2 size={16} className="admin-spin" />Publishing…</> : 'Publish changes'}</button>
    </div>
    <p className="admin-field-help">The original RADAR and RIT logos are preserved as supplied. Replace them only with approved official artwork.</p>
  </div>;
}

export function SettingsEditor({ mode }: { mode: 'contact' | 'general' }) {
  const { data, setData, error, loading } = useAdminQuery<{ records: ContentRecord[] }>('/api/admin/content/site_settings');
  const record = data?.records[0] ?? null;
  const fields = mode === 'contact'
    ? definitions.site_settings.fields.filter(field => contactKeys.includes(field.key))
    : definitions.site_settings.fields;
  return <div className="admin-page">
    <PageHeading eyebrow="MANAGE" title={mode === 'contact' ? 'Contact Details' : 'Website Settings'}
      description={mode === 'contact' ? 'How visitors reach RADAR: phone, WhatsApp, email, address and social profiles. Leave the email blank until an official address is confirmed.' : 'Branding, institution details, SEO defaults and approved design options.'} />
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {!loading && !error && <SettingsForm record={record} fields={fields} onSaved={updated => setData(current => current ? { records: current.records.length ? current.records.map(item => item.id === updated.id ? updated : item) : [updated] } : { records: [updated] })} />}
  </div>;
}