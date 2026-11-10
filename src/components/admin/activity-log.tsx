'use client';

import { timestamp, useAdminQuery } from './api';
import { actionLabel } from './dashboard';
import { EmptyState, Loading, Notice, PageHeading } from './ui';
import type { Activity } from '@/types/content';

export function ActivityLog() {
  const { data, error, loading } = useAdminQuery<{ activity: Activity[] }>('/api/admin/activity');
  return <div className="admin-page">
    <PageHeading eyebrow="MANAGE" title="Activity Log" description="A record of administrative actions: content changes, media uploads and enquiry handling." />
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {!loading && !error && (data?.activity.length === 0
      ? <EmptyState title="No activity yet" description="Actions across the workspace will be listed here." />
      : <div className="admin-panel"><div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Action</th><th>Collection</th><th>Record</th><th>When</th></tr></thead>
        <tbody>{(data?.activity ?? []).map(item => <tr key={item.id}>
          <td><strong>{actionLabel(item.action)}</strong></td>
          <td className="admin-cell-muted">{item.entity_type.replace(/_/g, ' ')}</td>
          <td className="admin-cell-muted admin-cell-mono">{item.entity_id ? item.entity_id.slice(0, 8) : '—'}</td>
          <td className="admin-cell-muted">{timestamp(item.created_at)}</td>
        </tr>)}</tbody>
      </table></div></div>)}
  </div>;
}