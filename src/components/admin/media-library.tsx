'use client';

import { useRef, useState } from 'react';
import { Check, Copy, FileText, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import type { MediaAsset } from '@/types/content';
import { adminRequest, errorMessage, timestamp, useAdminQuery } from './api';
import { copyText } from './fields';
import { EmptyState, Loading, Modal, Notice, PageHeading, useConfirmation } from './ui';

const folders = ['general', 'branding', 'members', 'events', 'projects', 'research', 'achievements', 'pages'];

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function EditAsset({ asset, onClose, onSaved }: { asset: MediaAsset; onClose: () => void; onSaved: () => void }) {
  const [alt, setAlt] = useState(asset.alt_text);
  const [caption, setCaption] = useState(asset.caption);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try {
      await adminRequest('/api/admin/media', { method: 'PATCH', body: JSON.stringify({ id: asset.id, alt_text: alt, caption }) });
      onSaved(); onClose();
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }
  return <Modal title={`Media details — ${asset.file_name}`} onClose={onClose} locked={busy}>
    {error && <Notice>{error}</Notice>}
    <div className="admin-field"><label className="admin-label" htmlFor="asset-alt">Alternative text</label>
      <input id="asset-alt" className="admin-input" value={alt} maxLength={300} onChange={event => setAlt(event.target.value)} />
      <p className="admin-field-help">Describe the image for screen readers and search engines.</p></div>
    <div className="admin-field"><label className="admin-label" htmlFor="asset-caption">Caption</label>
      <textarea id="asset-caption" className="admin-input admin-textarea" rows={3} value={caption} maxLength={1000} onChange={event => setCaption(event.target.value)} /></div>
    <div className="admin-dialog-actions">
      <button type="button" className="admin-button admin-button-secondary" onClick={onClose} disabled={busy}>Cancel</button>
      <button type="button" className="admin-button" onClick={() => void save()} disabled={busy}>{busy ? <><Loader2 size={16} className="admin-spin" />Saving…</> : 'Save details'}</button>
    </div>
  </Modal>;
}

export function MediaLibrary() {
  const { data, error, loading, refresh } = useAdminQuery<{ assets: MediaAsset[] }>('/api/admin/media');
  const fileInput = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState('general');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [copiedId, setCopiedId] = useState('');
  const [busyId, setBusyId] = useState('');
  const { confirm, dialog } = useConfirmation();

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file) { setUploadError('Choose a file first.'); return; }
    setUploading(true); setUploadError(''); setNotice('');
    try {
      const form = new FormData();
      form.set('file', file); form.set('folder', folder); form.set('alt_text', alt); form.set('caption', caption);
      await adminRequest('/api/admin/media', { method: 'POST', body: form });
      setNotice(`“${file.name}” uploaded.`); setAlt(''); setCaption(''); setFileName('');
      if (fileInput.current) fileInput.current.value = '';
      refresh();
    } catch (cause) { setUploadError(errorMessage(cause)); }
    setUploading(false);
  }

  async function remove(asset: MediaAsset) {
    if (!await confirm({ title: 'Delete media?', description: `“${asset.file_name}” will be removed from storage. Pages still referencing it will show a placeholder.`, label: 'Delete', danger: true })) return;
    setBusyId(asset.id);
    try {
      await adminRequest('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ id: asset.id }) });
      refresh();
    } catch (cause) { setUploadError(errorMessage(cause)); }
    setBusyId('');
  }

  async function copy(asset: MediaAsset) {
    if (await copyText(asset.public_url)) { setCopiedId(asset.id); setTimeout(() => setCopiedId(''), 2000); }
  }

  return <div className="admin-page">
    <PageHeading eyebrow="MANAGE" title="Media Library" description="Upload and organise images and documents. Files are stored in Supabase Storage with public read access." />
    {notice && <Notice success>{notice}</Notice>}
    {uploadError && <Notice>{uploadError}</Notice>}
    {error && <Notice>{error}</Notice>}
    <div className="admin-panel admin-upload-panel">
      <h2>Upload a file</h2>
      <div className="admin-upload-grid">
        <div className="admin-field"><label className="admin-label" htmlFor="media-file">File (JPEG, PNG, WebP, GIF ≤ 8 MB · PDF ≤ 15 MB)</label>
          <input id="media-file" ref={fileInput} className="admin-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" disabled={uploading} onChange={event => setFileName(event.target.files?.[0]?.name ?? '')} /></div>
        <div className="admin-field"><label className="admin-label" htmlFor="media-folder">Folder</label>
          <select id="media-folder" className="admin-input" value={folder} disabled={uploading} onChange={event => setFolder(event.target.value)}>{folders.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="admin-field"><label className="admin-label" htmlFor="media-alt">Alternative text</label>
          <input id="media-alt" className="admin-input" value={alt} maxLength={300} disabled={uploading} onChange={event => setAlt(event.target.value)} placeholder="Describe the image" /></div>
        <div className="admin-field"><label className="admin-label" htmlFor="media-caption">Caption</label>
          <input id="media-caption" className="admin-input" value={caption} maxLength={1000} disabled={uploading} onChange={event => setCaption(event.target.value)} placeholder="Optional caption" /></div>
      </div>
      <button type="button" className="admin-button" onClick={() => void upload()} disabled={uploading || !fileName}>
        {uploading ? <><Loader2 size={16} className="admin-spin" />Uploading…</> : <><Upload size={16} />Upload{fileName ? ` “${fileName}”` : ''}</>}
      </button>
    </div>
    {loading && <Loading label="Loading media…" />}
    {!loading && !error && (data?.assets.length === 0
      ? <EmptyState title="No media yet" description="Upload your first image or document above." />
      : <div className="admin-media-grid">{(data?.assets ?? []).map(asset => <article key={asset.id} className="admin-media-card">
        <div className="admin-media-thumb">
          {asset.mime_type.startsWith('image/')
            ? <img src={asset.public_url} alt={asset.alt_text || asset.file_name} loading="lazy" />
            : <FileText size={34} />}
        </div>
        <div className="admin-media-info"><strong title={asset.file_name}>{asset.file_name}</strong><small>{formatSize(asset.file_size)} · {timestamp(asset.created_at)}</small></div>
        <div className="admin-media-actions">
          <button type="button" className="admin-icon-button" aria-label={`Copy URL for ${asset.file_name}`} onClick={() => void copy(asset)}>{copiedId === asset.id ? <Check size={16} /> : <Copy size={16} />}</button>
          <button type="button" className="admin-icon-button" aria-label={`Edit details for ${asset.file_name}`} onClick={() => setEditing(asset)}><Pencil size={16} /></button>
          <button type="button" className="admin-icon-button admin-icon-danger" aria-label={`Delete ${asset.file_name}`} disabled={busyId === asset.id} onClick={() => void remove(asset)}>{busyId === asset.id ? <Loader2 size={16} className="admin-spin" /> : <Trash2 size={16} />}</button>
        </div>
      </article>)}</div>)}
    {editing && <EditAsset asset={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
    {dialog}
  </div>;
}