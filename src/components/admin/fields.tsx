'use client';

import { useState } from 'react';
import { FileText, ImagePlus, Plus, X } from 'lucide-react';
import type { FieldDefinition, MediaAsset } from '@/types/content';
import { useAdminQuery } from './api';
import { Loading, Modal, Notice } from './ui';

export function MediaPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const { data, error, loading } = useAdminQuery<{ assets: MediaAsset[] }>('/api/admin/media');
  return <Modal title="Choose from the media library" onClose={onClose} wide>
    {loading && <Loading label="Loading media…" />}
    {error && <Notice>{error}</Notice>}
    {data && data.assets.length === 0 && <p className="admin-description">The media library is empty. Upload files in the Media Library first.</p>}
    <div className="admin-picker-grid">
      {(data?.assets ?? []).filter(asset => asset.mime_type.startsWith('image/')).map(asset =>
        <button key={asset.id} type="button" className="admin-picker-item" onClick={() => { onSelect(asset.public_url); onClose(); }}>
          <img src={asset.public_url} alt={asset.alt_text || asset.file_name} loading="lazy" />
          <span>{asset.file_name}</span>
        </button>)}
    </div>
    <p className="admin-field-help">Need a new file? Upload it in the Media Library, then choose it here.</p>
  </Modal>;
}

function ListInput({ value, onChange, disabled }: { value: unknown; onChange: (value: string[]) => void; disabled?: boolean }) {
  const initial = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join('\n') : '';
  const [raw, setRaw] = useState(initial);
  return <textarea className="admin-input admin-textarea" rows={4} value={raw} disabled={disabled}
    placeholder="One item per line"
    onChange={event => { setRaw(event.target.value); onChange(event.target.value.split('\n').map(line => line.trim()).filter(Boolean)); }} />;
}

function GalleryInput({ value, onChange, disabled }: { value: unknown; onChange: (value: string[]) => void; disabled?: boolean }) {
  const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const [picking, setPicking] = useState(false);
  return <div className="admin-gallery-field">
    {items.map((url, index) => <div key={`${url}-${index}`} className="admin-gallery-row">
      <img src={url} alt="" loading="lazy" />
      <input className="admin-input" value={url} disabled={disabled} aria-label={`Image ${index + 1} URL`}
        onChange={event => onChange(items.map((item, i) => i === index ? event.target.value : item))} />
      <button type="button" className="admin-icon-button" aria-label={`Remove image ${index + 1}`} disabled={disabled}
        onClick={() => onChange(items.filter((_, i) => i !== index))}><X size={16} /></button>
    </div>)}
    <button type="button" className="admin-button admin-button-secondary admin-button-small" disabled={disabled} onClick={() => setPicking(true)}><Plus size={15} />Add image</button>
    {picking && <MediaPicker onClose={() => setPicking(false)} onSelect={url => onChange([...items, url])} />}
  </div>;
}

export function FieldInput({ field, value, onChange, disabled }: { field: FieldDefinition; value: unknown; onChange: (value: unknown) => void; disabled?: boolean }) {
  const [picking, setPicking] = useState(false);
  const id = `field-${field.key}`;
  const stringValue = typeof value === 'string' ? value : '';
  if (field.kind === 'textarea') return <textarea id={id} className="admin-input admin-textarea" rows={4} value={stringValue} disabled={disabled} onChange={event => onChange(event.target.value)} />;
  if (field.kind === 'list') return <ListInput value={value} onChange={onChange} disabled={disabled} />;
  if (field.kind === 'gallery') return <GalleryInput value={value} onChange={onChange} disabled={disabled} />;
  if (field.kind === 'checkbox') return <label className="admin-checkbox"><input type="checkbox" checked={value === true} disabled={disabled} onChange={event => onChange(event.target.checked)} /><span>{field.label}</span></label>;
  if (field.kind === 'select') return <select id={id} className="admin-input" value={stringValue} disabled={disabled} onChange={event => onChange(event.target.value)}>
    <option value="">Not set</option>
    {(field.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
  </select>;
  if (field.kind === 'image') {
    return <div className="admin-image-field">
      {stringValue ? <div className="admin-image-preview">{stringValue.endsWith('.pdf') ? <FileText size={22} /> :
        <img src={stringValue} alt="" loading="lazy" />}</div> : <div className="admin-image-preview admin-image-empty"><ImagePlus size={22} /></div>}
      <div className="admin-image-controls">
        <input id={id} className="admin-input" value={stringValue} disabled={disabled} placeholder="/brand/… or https://…" onChange={event => onChange(event.target.value)} />
        <div className="admin-image-buttons">
          <button type="button" className="admin-button admin-button-secondary admin-button-small" disabled={disabled} onClick={() => setPicking(true)}>Choose image</button>
          {stringValue && <button type="button" className="admin-button admin-button-ghost admin-button-small" disabled={disabled} onClick={() => onChange('')}>Clear</button>}
        </div>
      </div>
      {picking && <MediaPicker onClose={() => setPicking(false)} onSelect={onChange} />}
    </div>;
  }
  if (field.kind === 'number') return <input id={id} className="admin-input" type="number" min={0} max={9999} value={typeof value === 'number' ? value : stringValue} disabled={disabled} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} />;
  return <input id={id} className="admin-input" type={field.kind === 'date' ? 'date' : field.kind === 'email' ? 'email' : 'text'}
    value={stringValue} disabled={disabled} onChange={event => onChange(event.target.value)} />;
}

export function fieldDefault(field: FieldDefinition): unknown {
  if (field.kind === 'checkbox') return false;
  if (field.kind === 'list' || field.kind === 'gallery') return [];
  return '';
}

export async function copyText(value: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(value); return true; } catch { return false; }
}