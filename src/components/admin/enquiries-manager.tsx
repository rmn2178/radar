'use client';

import { useState } from 'react';
import { Loader2, Mail, Trash2 } from 'lucide-react';
import type { Enquiry } from '@/types/content';
import { adminRequest, errorMessage, timestamp, useAdminQuery } from './api';
import { EmptyState, Loading, Modal, Notice, PageHeading, StatusBadge, useConfirmation } from './ui';

const filters = ['all', 'unread', 'read', 'resolved'] as const;

export function EnquiriesManager() {
  const { data, setData, error, loading } = useAdminQuery<{ enquiries: Enquiry[] }>('/api/admin/enquiries');
  const [filter, setFilter] = useState<typeof filters[number]>('all');
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const { confirm, dialog } = useConfirmation();
  const enquiries = (data?.enquiries ?? []).filter(enquiry => filter === 'all' || enquiry.status === filter);

  async function setStatus(enquiry: Enquiry, status: Enquiry['status']) {
    setBusyId(enquiry.id); setActionError('');
    try {
      await adminRequest('/api/admin/enquiries', { method: 'PATCH', body: JSON.stringify({ id: enquiry.id, status }) });
      setData(current => current ? { enquiries: current.enquiries.map(item => item.id === enquiry.id ? { ...item, status } : item) } : current);
      setSelected(current => current?.id === enquiry.id ? { ...current, status } : current);
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  async function remove(enquiry: Enquiry) {
    if (!await confirm({ title: 'Delete enquiry?', description: `The message from ${enquiry.name} will be permanently deleted.`, label: 'Delete', danger: true })) return;
    setBusyId(enquiry.id); setActionError('');
    try {
      await adminRequest('/api/admin/enquiries', { method: 'DELETE', body: JSON.stringify({ id: enquiry.id }) });
      setData(current => current ? { enquiries: current.enquiries.filter(item => item.id !== enquiry.id) } : current);
      setSelected(null);
    } catch (cause) { setActionError(errorMessage(cause)); }
    setBusyId('');
  }

  return <div className="admin-page">
    <PageHeading eyebrow="MANAGE" title="Enquiries" description="Messages submitted through the public contact form. Only administrators can read them." />
    {actionError && <Notice>{actionError}</Notice>}
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {!loading && !error && <div className="admin-panel">
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Filter enquiries">
          {filters.map(item => <button key={item} type="button" role="tab" aria-selected={filter === item} className={`admin-tab ${filter === item ? 'admin-tab-active' : ''}`} onClick={() => setFilter(item)}>
            {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
            {item === 'unread' && (data?.enquiries ?? []).some(enquiry => enquiry.status === 'unread') && <span className="admin-tab-dot" />}
          </button>)}
        </div>
        <span className="admin-toolbar-count">{enquiries.length} message{enquiries.length === 1 ? '' : 's'}</span>
      </div>
      {enquiries.length === 0 ? <EmptyState title="No enquiries" description={filter === 'all' ? 'Messages from the contact form will appear here.' : `No ${filter} enquiries right now.`} />
        : <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>From</th><th>Subject</th><th>Received</th><th>Status</th><th className="admin-th-actions">Actions</th></tr></thead>
          <tbody>{enquiries.map(enquiry => <tr key={enquiry.id} className={enquiry.status === 'unread' ? 'admin-row-unread' : ''}>
            <td><div className="admin-cell-title"><strong>{enquiry.name}</strong><small>{enquiry.email}</small></div></td>
            <td><button type="button" className="admin-link-button" onClick={() => { setSelected(enquiry); if (enquiry.status === 'unread') void setStatus(enquiry, 'read'); }}>{enquiry.subject}</button></td>
            <td className="admin-cell-muted">{timestamp(enquiry.created_at)}</td>
            <td><StatusBadge status={enquiry.status} /></td>
            <td><div className="admin-row-actions">
              {busyId === enquiry.id && <Loader2 size={16} className="admin-spin" />}
              <button type="button" className="admin-button admin-button-secondary admin-button-small" onClick={() => setSelected(enquiry)}>Open</button>
              <button type="button" className="admin-icon-button admin-icon-danger" aria-label={`Delete enquiry from ${enquiry.name}`} disabled={busyId === enquiry.id} onClick={() => void remove(enquiry)}><Trash2 size={16} /></button>
            </div></td>
          </tr>)}</tbody>
        </table></div>}
    </div>}
    {selected && <Modal title={selected.subject} onClose={() => setSelected(null)} wide>
      <div className="admin-enquiry-meta">
        <div><strong>{selected.name}</strong><small>{selected.email}</small></div>
        <StatusBadge status={selected.status} />
        <span className="admin-cell-muted">{timestamp(selected.created_at)}</span>
      </div>
      <p className="admin-enquiry-message">{selected.message}</p>
      <div className="admin-dialog-actions">
        <a className="admin-button admin-button-secondary" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}><Mail size={15} />Reply by email</a>
        {selected.status !== 'resolved' && <button type="button" className="admin-button" disabled={busyId === selected.id} onClick={() => void setStatus(selected, 'resolved')}>Mark resolved</button>}
        {selected.status === 'resolved' && <button type="button" className="admin-button admin-button-secondary" disabled={busyId === selected.id} onClick={() => void setStatus(selected, 'unread')}>Mark unread</button>}
        <button type="button" className="admin-button admin-button-danger" disabled={busyId === selected.id} onClick={() => void remove(selected)}><Trash2 size={15} />Delete</button>
      </div>
    </Modal>}
    {dialog}
  </div>;
}