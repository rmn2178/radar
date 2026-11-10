'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, History, Loader2, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { definitions } from '@/lib/content';
import type { Collection, ContentRecord } from '@/types/content';
import { adminRequest, errorMessage, timestamp, useAdminQuery } from './api';
import { RecordForm } from './record-form';
import { RevisionsModal } from './revisions';
import { EmptyState, Loading, Modal, Notice, PageHeading, Pagination, StatusBadge, useConfirmation } from './ui';

const PAGE_SIZE = 12;

export function CollectionManager({ collection }: { collection: Collection }) {
  const definition = definitions[collection];
  const { data, setData, error, loading, refresh } = useAdminQuery<{ records: ContentRecord[] }>(`/api/admin/content/${collection}`);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ContentRecord | null | undefined>(undefined);
  const [revisionsFor, setRevisionsFor] = useState<ContentRecord | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const { confirm, dialog } = useConfirmation();
  const records = useMemo(() => data?.records ?? [], [data]);

  const filtered = records.filter(record =>
    (status === 'all' || record.status === status) &&
    (!search || `${record.title} ${record.slug}`.toLowerCase().includes(search.toLowerCase())));
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function replaceRecord(updated: ContentRecord) {
    setData(current => current ? { records: current.records.map(record => record.id === updated.id ? updated : record) } : current);
  }

  async function mutate(record: ContentRecord, intent: 'draft' | 'publish' | 'archive', overrides: Partial<ContentRecord> = {}) {
    setBusyId(record.id); setActionError(''); setNotice('');
    try {
      const result = await adminRequest<{ record: ContentRecord }>(`/api/admin/content/${collection}`, {
        method: 'POST', body: JSON.stringify({ intent, record: { ...record, ...overrides } }),
      });
      replaceRecord(result.record);
      setNotice(intent === 'publish' ? `“${result.record.title}” is now live.` : intent === 'archive' ? `“${result.record.title}” was archived and removed from the public site.` : 'Changes saved.');
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  async function remove(record: ContentRecord) {
    const approved = await confirm({ title: `Delete ${definition.singular.toLowerCase()}?`, description: `“${record.title}” will be removed permanently. A final snapshot is kept in revisions, but deletion cannot be undone from the workspace.`, label: 'Delete', danger: true });
    if (!approved) return;
    setBusyId(record.id); setActionError('');
    try {
      await adminRequest(`/api/admin/content/${collection}`, { method: 'DELETE', body: JSON.stringify({ id: record.id }) });
      setData(current => current ? { records: current.records.filter(item => item.id !== record.id) } : current);
      setNotice(`“${record.title}” was deleted.`);
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  async function move(record: ContentRecord, direction: -1 | 1) {
    const index = records.findIndex(item => item.id === record.id);
    const neighbour = records[index + direction];
    if (!neighbour) return;
    setBusyId(record.id); setActionError('');
    try {
      const [a, b] = await Promise.all([
        adminRequest<{ record: ContentRecord }>(`/api/admin/content/${collection}`, { method: 'POST', body: JSON.stringify({ intent: 'draft', record: { ...record, display_order: neighbour.display_order } }) }),
        adminRequest<{ record: ContentRecord }>(`/api/admin/content/${collection}`, { method: 'POST', body: JSON.stringify({ intent: 'draft', record: { ...neighbour, display_order: record.display_order } }) }),
      ]);
      setData(current => current ? { records: current.records.map(item => item.id === a.record.id ? a.record : item.id === b.record.id ? b.record : item).sort((x, y) => x.display_order - y.display_order) } : current);
    } catch (cause) { setActionError(errorMessage(cause)); refresh(); }
    setBusyId('');
  }

  return <div className="admin-page">
    <PageHeading eyebrow="CONTENT" title={definition.label} description={`Create, edit and publish ${definition.label.toLowerCase()}. Drafts stay private until you publish them.`}>
      <button type="button" className="admin-button" onClick={() => setEditing(null)}><Plus size={17} />New {definition.singular.toLowerCase()}</button>
    </PageHeading>
    {notice && <Notice success>{notice}</Notice>}
    {actionError && <Notice>{actionError}</Notice>}
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {!loading && !error && <div className="admin-panel">
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={16} /><input aria-label={`Search ${definition.label.toLowerCase()}`} placeholder={`Search ${definition.label.toLowerCase()}…`} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
        <select className="admin-input admin-filter" aria-label="Filter by status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
          <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
        </select>
        <span className="admin-toolbar-count">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
      </div>
      {filtered.length === 0 ? <EmptyState title={`No ${definition.label.toLowerCase()} found`} description={records.length === 0 ? `Create your first ${definition.singular.toLowerCase()} to get started.` : 'Try a different search or status filter.'}>
        {records.length === 0 && <button type="button" className="admin-button" onClick={() => setEditing(null)}><Plus size={16} />New {definition.singular.toLowerCase()}</button>}
      </EmptyState> : <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th className="admin-th-order">Order</th><th>Title</th><th>Status</th><th>Featured</th><th>Updated</th><th className="admin-th-actions">Actions</th></tr></thead>
        <tbody>{pageRecords.map(record => {
          const index = records.findIndex(item => item.id === record.id);
          const busy = busyId === record.id;
          return <tr key={record.id}>
            <td><div className="admin-order-buttons">
              <button type="button" className="admin-icon-button" aria-label={`Move ${record.title} up`} disabled={busy || index === 0} onClick={() => void move(record, -1)}><ArrowUp size={15} /></button>
              <button type="button" className="admin-icon-button" aria-label={`Move ${record.title} down`} disabled={busy || index === records.length - 1} onClick={() => void move(record, 1)}><ArrowDown size={15} /></button>
            </div></td>
            <td><div className="admin-cell-title"><strong>{record.title}</strong><small>/{record.slug}</small></div></td>
            <td><StatusBadge status={record.status} /></td>
            <td><button type="button" className={`admin-icon-button admin-star ${record.is_featured ? 'admin-star-on' : ''}`} aria-label={record.is_featured ? `Unfeature ${record.title}` : `Feature ${record.title}`} aria-pressed={record.is_featured} disabled={busy} onClick={() => void mutate(record, 'draft', { is_featured: !record.is_featured })}><Star size={16} /></button></td>
            <td className="admin-cell-muted">{timestamp(record.updated_at)}</td>
            <td><div className="admin-row-actions">
              {busy && <Loader2 size={16} className="admin-spin" />}
              <button type="button" className="admin-button admin-button-secondary admin-button-small" disabled={busy} onClick={() => setEditing(record)}><Pencil size={14} />Edit</button>
              <button type="button" className="admin-icon-button" aria-label={`Revisions for ${record.title}`} disabled={busy} onClick={() => setRevisionsFor(record)}><History size={16} /></button>
              {record.status !== 'published'
                ? <button type="button" className="admin-button admin-button-small" disabled={busy} onClick={() => void mutate(record, 'publish')}>Publish</button>
                : <button type="button" className="admin-button admin-button-ghost admin-button-small" disabled={busy} onClick={async () => { if (await confirm({ title: 'Archive record?', description: `“${record.title}” will be removed from the public site. You can publish it again later.`, label: 'Archive' })) void mutate(record, 'archive'); }}>Archive</button>}
              <button type="button" className="admin-icon-button admin-icon-danger" aria-label={`Delete ${record.title}`} disabled={busy} onClick={() => void remove(record)}><Trash2 size={16} /></button>
            </div></td>
          </tr>;
        })}</tbody>
      </table></div>}
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>}
    {editing !== undefined && <Modal title={editing ? `Edit ${definition.singular.toLowerCase()} — ${editing.title}` : `New ${definition.singular.toLowerCase()}`} onClose={() => setEditing(undefined)} wide>
      <RecordForm collection={collection} record={editing} onCancel={() => setEditing(undefined)} onSaved={record => { replaceRecord(record); if (!records.some(item => item.id === record.id)) refresh(); setEditing(undefined); setNotice(`“${record.title}” saved${record.status === 'published' ? ' and published' : ' as a draft'}.`); }} />
    </Modal>}
    {revisionsFor && <RevisionsModal collection={collection} record={revisionsFor} onClose={() => setRevisionsFor(null)} onRestored={refresh} />}
    {dialog}
  </div>;
}