import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import type { PublicData } from '@/types/content';
import { safeUrl, text } from '@/lib/content';
import { settingsOf } from '@/lib/site-data';

export function SiteFooter({ content }: { content: PublicData }) {
  const settings = settingsOf(content);
  const data = settings?.data;
  const links = content.navigation_items.filter(item => ['footer', 'both'].includes(text(item.data, 'location', 'both'))).sort((a, b) => a.display_order - b.display_order);
  const phone = text(data, 'phone');
  const email = text(data, 'email');
  const whatsapp = text(data, 'whatsapp_number').replace(/[^\d]/g, '');
  const socials = [['linkedin_url', 'LinkedIn'], ['instagram_url', 'Instagram'], ['facebook_url', 'Facebook'], ['youtube_url', 'YouTube']] as const;
  return (
    <footer className={`site-footer${text(data, 'footer_variant') === 'compact' ? ' is-compact' : ''}`}>
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logos">
            <Image src={text(data, 'radar_logo', '/brand/radar-logo.png')} alt="RADAR Centre emblem" width={72} height={72} className="logo-radar" />
            <Image src={text(data, 'rit_logo', '/brand/rit-logo.jpg')} alt="Rajalakshmi Institute of Technology" width={170} height={44} className="logo-rit" />
          </div>
          <p>{text(data, 'footer_description')}</p>
          <p className="footer-department">{text(data, 'department')}</p>
        </div>
        <nav aria-label="Footer">
          <h3>Explore</h3>
          <ul>{links.map(item => { const url = safeUrl(text(item.data, 'url', '/')); return url ? <li key={item.id}><Link href={url}>{item.title}</Link></li> : null; })}</ul>
        </nav>
        <div>
          <h3>Research</h3>
          <ul>{content.research_areas.slice(0, 6).map(area => <li key={area.id}><Link href={`/research/${area.slug}`}>{area.title}</Link></li>)}</ul>
        </div>
        <div>
          <h3>Connect</h3>
          <address>
            {text(data, 'address') && <p>{text(data, 'address')}</p>}
            {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}><Phone size={15} strokeWidth={1.75} />{phone}</a>}
            {email && <a href={`mailto:${email}`}><Mail size={15} strokeWidth={1.75} />{email}</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp<ArrowUpRight size={14} strokeWidth={1.75} /></a>}
            {safeUrl(text(data, 'maps_url')) && <a href={safeUrl(text(data, 'maps_url'))} target="_blank" rel="noopener noreferrer">View on map<ArrowUpRight size={14} strokeWidth={1.75} /></a>}
          </address>
          <div className="footer-socials">
            {socials.map(([key, label]) => { const url = safeUrl(text(data, key)); return url ? <a key={key} href={url} target="_blank" rel="noopener noreferrer">{label}</a> : null; })}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {text(data, 'site_name', 'RADAR Centre')} · {text(data, 'institution', 'Rajalakshmi Institute of Technology')}</p>
        <p>{text(data, 'initiative')}</p>
      </div>
    </footer>
  );
}
