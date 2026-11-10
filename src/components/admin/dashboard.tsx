'use client';

import Link from 'next/link';
import { ArrowUpRight, Award, CalendarDays, FlaskConical, FolderKanban, ImageIcon, Layers3, MessageSquare, Quote, Settings2, Users } from 'lucide-react';
import { timestamp, useAdminQuery } from './api';
import { Loading, Notice, PageHeading } from './ui';

interface DashboardData {
  counts: Record<string, { total: number; published: number }>;
  unread_enquiries: number;
  media_count: number;
  recent: { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string }[];
}

const cards = [
  { key: 'pages', label: 'Pages', icon: Layers3, href: '/admin/pages' },
  { key: 'members', label: 'Members', icon: Users, href: '/admin/members' },
  { key: 'events', label: 'Events', icon: CalendarDays, href: '/admin/events' },
  { key: 'projects', label: 'Projects', icon: FolderKanban, href: '/admin/projects' },
  { key: 'research_areas', label: 'Research areas', icon: FlaskConical, href: '/admin/research-areas' },
  { key: 'quotes', label: 'Quotes', icon: Quote, href: '/admin/quotes' },
  { key: 'achievements', label: 'Achievements', icon: Award, href: '/admin/achievements' },
];

const quickLinks = [
  { href: '/admin/pages', label: 'Compose a page', description: 'Build pages from typed sections' },
  { href: '/admin/media', label: 'Upload media', description: 'Images and documents for content' },
  { href: '/admin/enquiries', label: 'Read enquiries', description: 'Messages from the contact form' },
  { href: '/admin/website-settings', label: 'Website settings', description: 'Branding, SEO and design' },
];

export function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'content.create': 'Created', 'content.draft': 'Saved draft', 'content.publish': 'Published',
    'content.archive': 'Archived', 'content.delete': 'Deleted', 'content.restore': 'Restored revision',
    'media.upload': 'Uploaded media', 'media.update': 'Updated media', 'media.delete': 'Deleted media',
    'enquiry.read': 'Read enquiry', 'enquiry.resolved': 'Resolved enquiry', 'enquiry.unread': 'Reopened enquiry', 'enquiry.delete': 'Deleted enquiry',
  };
  return labels[action] ?? action;
}

export function Dashboard() {
  const { data, error, loading } = useAdminQuery<DashboardData>('/api/admin/dashboard');
  return <div className="admin-page">
    <PageHeading eyebrow="OVERVIEW" title="Dashboard" description="A live picture of the RADAR website. Every count below comes from the database." />
    {error && <Notice>{error}</Notice>}
    {loading && <Loading />}
    {data && <>
      <div className="admin-stat-grid">
        {cards.map(card => <Link key={card.key} href={card.href} className="admin-stat-card">
          <card.icon size={20} />
          <strong>{data.counts[card.key]?.published ?? 0}</strong>
          <span>{card.label} live</span>
          <small>{data.counts[card.key]?.total ?? 0} total{(data.counts[card.key]?.total ?? 0) > (data.counts[card.key]?.published ?? 0) ? ` · ${(data.counts[card.key]?.total ?? 0) - (data.counts[card.key]?.published ?? 0)} unpublished` : ''}</small>
        </Link>)}
        <Link href="/admin/enquiries" className="admin-stat-card admin-stat-accent">
          <MessageSquare size={20} /><strong>{data.unread_enquiries}</strong><span>Unread enquiries</span><small>From the contact form</small>
        </Link>
        <Link href="/admin/media" className="admin-stat-card">
          <ImageIcon size={20} /><strong>{data.media_count}</strong><span>Media files</span><small>In the library</small>
        </Link>
      </div>
      <div className="admin-dashboard-columns">
        <section className="admin-panel">
          <h2 className="admin-panel-title">Quick actions</h2>
          <div className="admin-quick-grid">{quickLinks.map(link => <Link key={link.href} href={link.href} className="admin-quick-card">
            <div><strong>{link.label}</strong><small>{link.description}</small></div><ArrowUpRight size={17} />
          </Link>)}</div>
          <Link href="/admin/contact-details" className="admin-quick-card admin-quick-wide"><div><strong>Contact details</strong><small>Phone, WhatsApp, email and address</small></div><Settings2 size={17} /></Link>
        </section>
        <section className="admin-panel">
          <h2 className="admin-panel-title">Recent activity</h2>
          {data.recent.length === 0 ? <p className="admin-description">Actions will appear here as you work.</p> :
            <ul className="admin-activity-list">{data.recent.map(item => <li key={item.id}>
              <span className="admin-activity-dot" />
              <div><strong>{actionLabel(item.action)}</strong><small>{item.entity_type.replace(/_/g, ' ')} · {timestamp(item.created_at)}</small></div>
            </li>)}</ul>}
          <Link href="/admin/activity" className="admin-panel-link">View full activity log<ArrowUpRight size={14} /></Link>
        </section>
      </div>
    </>}
  </div>;
}