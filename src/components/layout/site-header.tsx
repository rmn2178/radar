'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ContentRecord } from '@/types/content';
import { safeUrl, text } from '@/lib/content';

interface Props { settings?: ContentRecord; navigation: ContentRecord[] }
export function SiteHeader({ settings, navigation }: Props) {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const open = menu.open && menu.path === pathname;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  const links = navigation
    .filter(item => ['header', 'both'].includes(text(item.data, 'location', 'both')))
    .sort((a, b) => a.display_order - b.display_order);
  const radarLogo = text(settings?.data, 'radar_logo', '/brand/radar-logo.png');
  const ritLogo = text(settings?.data, 'rit_logo', '/brand/rit-logo.jpg');
  const siteName = text(settings?.data, 'site_name', 'RADAR Centre');
  const isActive = (url: string) => url === '/' ? pathname === '/' : pathname === url || pathname.startsWith(`${url}/`);
  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${text(settings?.data, 'header_variant') === 'compact' ? ' is-compact' : ''}`}>
      <div className="header-inner">
        <Link href="/" className="brand-radar" aria-label={`${siteName} home`}>
          <Image src={radarLogo} alt="RADAR Centre emblem" width={64} height={64} priority className="logo-radar" />
          <span className="brand-wordmark">{siteName}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {links.map(item => {
            const url = safeUrl(text(item.data, 'url', '/'));
            if (!url) return null;
            return <Link key={item.id} href={url} className={isActive(url) ? 'active' : ''} aria-current={isActive(url) ? 'page' : undefined}>{item.title}</Link>;
          })}
        </nav>
        <div className="header-right">
          <Image src={ritLogo} alt="Rajalakshmi Institute of Technology" width={190} height={49} priority className="logo-rit" />
          <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setMenu({ open: !open, path: pathname })}>
            {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      <div id="mobile-nav" className={`mobile-nav${open ? ' is-open' : ''}`} hidden={!open}>
        <nav aria-label="Mobile">
          {links.map(item => {
            const url = safeUrl(text(item.data, 'url', '/'));
            if (!url) return null;
            return <Link key={item.id} href={url} className={isActive(url) ? 'active' : ''} onClick={() => setMenu({ open: false, path: pathname })}>{item.title}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
