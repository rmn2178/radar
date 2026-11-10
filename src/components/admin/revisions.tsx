'use client';

import { useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import type { Collection, ContentRecord, Revision } from '@/types/content';
import { adminRequest, errorMessage, timestamp, useAdminQuery } from './api';
import { Loading, Modal, Notice, StatusBadge } from './ui';

export function RevisionsModal({ collection, record, onClose, onRestored }: {
  collection: Collection; record: ContentRecord; onClose: () => void; onRestored: () => void;
}) {
  const { data, error, loading } = useAdminQuery<{ revisions: Revision[] }>(`/api/admin/revisions?entity_type=${collection}&entity_id=${record.id}`);
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  async function restore(revision: Revision) {
    if (busy) return;
    setBusy(revision.id); setActionError('');
    try {
      await adminRequest('/api/admin/revisions', { method: 'POST', body: JSON.stringify({ id: revision.id }) });
      onRestored(); onClose();
    } catch (cause) { setActionError(errorMessage(cause)); setBusy(''); }
  }
  return <Modal title={`Revisions — ${record.title}`} onClose={onClose} wide locked={!!busy}>
    <p className="admin-description">Every save keeps a snapshot. Restoring creates a draft; the live site only changes when you publish.</p>
    {actionError && <Notice>{actionError}</Notice>}
    {loading && <Loading label="Loading revisions…" />}
    {error && <Notice>{error}</Notice>}
    {data && data.revisions.length === 0 && <div className="admin-empty"><div className="admin-empty-mark"><History size={25} /></div><h3>No revisions yet</h3><p>Snapshots appear here after the first edit of this record.</p></div>}
    <div className="admin-revision-list">
      {(data?.revisions ?? []).map(revision => <div key={revision.id} className="admin-revision-row">
        <div><strong>{revision.snapshot.title}</strong><small>{timestamp(revision.created_at)}</small></div>
        <StatusBadge status={revision.snapshot.status} />
        <button type="button" className="admin-button admin-button-secondary admin-button-small" disabled={!!busy} onClick={() => void restore(revision)}>
          {busy === revision.id ? <Loader2 size={15} className="admin-spin" /> : 'Restore as draft'}
        </button>
      </div>)}
    </div>
  </Modal>;
}