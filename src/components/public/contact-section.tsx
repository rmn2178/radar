import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { PublicData } from '@/types/content';
import { safeUrl, text } from '@/lib/content';
import { settingsOf } from '@/lib/site-data';
import { ContactForm } from './contact-form';
export function ContactSection({ content }: { content: PublicData }) {
  const data = settingsOf(content)?.data;
  const phone = text(data, 'phone');
  const email = text(data, 'email');
  const whatsapp = text(data, 'whatsapp_number').replace(/[^\d]/g, '');
  const maps = safeUrl(text(data, 'maps_url'));
  return (
    <div className="contact-grid">
      <div className="contact-details">
        <h3>Reach the centre</h3>
        {text(data, 'address') && <p className="contact-address"><MapPin size={18} strokeWidth={1.75} /><span>{text(data, 'address')}<br />{text(data, 'department')}</span></p>}
        <div className="contact-actions">
          {phone && <a className="contact-action" href={`tel:${phone.replace(/[^\d+]/g, '')}`}><Phone size={18} strokeWidth={1.75} /><span><strong>Call</strong>{phone}</span></a>}
          {whatsapp && <a className="contact-action" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} strokeWidth={1.75} /><span><strong>WhatsApp</strong>Message the team</span></a>}
          {email && <a className="contact-action" href={`mailto:${email}`}><Mail size={18} strokeWidth={1.75} /><span><strong>Email</strong>{email}</span></a>}
          {maps && <a className="contact-action" href={maps} target="_blank" rel="noopener noreferrer"><MapPin size={18} strokeWidth={1.75} /><span><strong>Directions</strong>Open in Google Maps<ArrowUpRight size={13} /></span></a>}
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
