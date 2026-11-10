'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowUpRight, Award, CalendarDays, ChevronLeft, ChevronRight, Contact, FlaskConical, FolderKanban, ImageIcon, LayoutDashboard, Layers3, Loader2, LogOut, Menu, MessageSquare, Navigation, Quote, Radar, Settings2, Users, X, type LucideIcon } from 'lucide-react';
import { adminRequest, errorMessage } from './api';
import { Notice } from './ui';

const items: { label: string; href: string; icon: LucideIcon; group: string }[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Page Builder', href: '/admin/pages', icon: Layers3, group: 'Content' },
  { label: 'Members', href: '/admin/members', icon: Users, group: 'Content' },
  { label: 'Events', href: '/admin/events', icon: CalendarDays, group: 'Content' },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban, group: 'Content' },
  { label: 'Research Areas', href: '/admin/research-areas', icon: FlaskConical, group: 'Content' },
  { label: 'Quotes', href: '/admin/quotes', icon: Quote, group: 'Content' },
  { label: 'Achievements', href: '/admin/achievements', icon: Award, group: 'Content' },
  { label: 'Media Library', href: '/admin/media', icon: ImageIcon, group: 'Manage' },
  { label: 'Contact Details', href: '/admin/contact-details', icon: Contact, group: 'Manage' },
  { label: 'Enquiries', href: '/admin/enquiries', icon: MessageSquare, group: 'Manage' },
  { label: 'Navigation', href: '/admin/navigation', icon: Navigation, group: 'Manage' },
  { label: 'Website Settings', href: '/admin/website-settings', icon: Settings2, group: 'Manage' },
  { label: 'Activity Log', href: '/admin/activity', icon: Activity, group: 'Manage' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const drawer = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const active = items.find(item => item.href === pathname);
  useEffect(() => {
    if (!mobileOpen) return;
    const menuTrigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(element => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); menuTrigger?.focus(); };
  }, [mobileOpen]);
  async function logout() {
    setLoggingOut(true); setError('');
    try { await adminRequest('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh(); }
    catch (cause) { setError(errorMessage(cause)); setLoggingOut(false); }
  }
  return <div className={`admin-shell ${collapsed ? 'admin-shell-collapsed' : ''} ${mobileOpen ? 'admin-shell-open' : ''}`}>
    <a href="#admin-main" className="admin-skip">Skip to workspace</a>
    {mobileOpen && <button className="admin-drawer-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className="admin-sidebar" id="admin-sidebar" ref={drawer} aria-label="Admin navigation" role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined}>
      <Link className="admin-brand" href="/admin/dashboard" onClick={() => setMobileOpen(false)}><span className="admin-brand-icon"><Radar size={25} /></span><span className="admin-brand-copy">RADAR<small>CONTENT STUDIO</small></span></Link>
      <button className="admin-mobile-close admin-icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
      <div className="admin-sidebar-rule" />
      <nav className="admin-nav">{items.map((item, index) => <div key={item.href}>
        {(index === 0 || item.group !== items[index - 1].group) && <p className="admin-nav-group">{item.group}</p>}
        <Link href={item.href} title={item.label} className={`admin-nav-link ${pathname === item.href ? 'admin-nav-active' : ''}`} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setMobileOpen(false)}><item.icon size={18} /><span>{item.label}</span>{pathname === item.href && <span className="admin-active-dot" />}</Link>
      </div>)}</nav>
      <div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer" className="admin-nav-link" title="View Website"><ArrowUpRight size={18} /><span>View Website</span></a><button className="admin-nav-link" onClick={logout} disabled={loggingOut} title="Logout">{loggingOut ? <Loader2 size={18} className="admin-spin" /> : <LogOut size={18} />}<span>{loggingOut ? 'Signing out…' : 'Logout'}</span></button><div className="admin-sidebar-profile"><span className="admin-avatar">R</span><div><strong>RADAR Administrator</strong><small>Website management</small></div><button className="admin-collapse" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button></div></div>
    </aside>
    <div className="admin-workspace" inert={mobileOpen || undefined}>
      <header className="admin-topbar"><div className="admin-breadcrumb"><button ref={menuButton} className="admin-mobile-menu admin-icon-button" aria-label="Open navigation" aria-controls="admin-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{active?.label ?? 'Content editor'}</strong></div><div className="admin-topbar-right"><span className="admin-secure-label"><span />Private admin</span><span className="admin-avatar admin-avatar-light">R</span></div></header>
      <main id="admin-main" className="admin-main" tabIndex={-1}>{error && <Notice>{error}</Notice>}{children}</main>
      <footer className="admin-workspace-footer"><span>RADAR · Research. Discover. Make a difference.</span><span>Content Studio</span></footer>
    </div>
  </div>;
}
