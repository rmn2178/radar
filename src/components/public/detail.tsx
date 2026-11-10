import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { safeUrl, strings } from '@/lib/content';
import { MediaImage } from '@/components/ui/media-image';
import { Reveal } from '@/components/ui/reveal';
import { PlaceholderArt } from './placeholder-art';

export function BackLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="back-link"><ArrowLeft size={15} strokeWidth={1.75} />{label}</Link>; }
export function DetailHeader({ eyebrow, title, description, meta, children }: { eyebrow?: string; title: string; description?: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <section className="section detail-header"><div className="container">
      <Reveal>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 className="detail-title">{title}</h1>{meta && <div className="detail-meta">{meta}</div>}{description && <p className="detail-lead">{description}</p>}{children}</Reveal>
    </div></section>
  );
}
export function ProseBlock({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return <Reveal className="prose-block"><h2>{title}</h2><div className="prose">{body.split(/\n{2,}/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div></Reveal>;
}
export function GalleryGrid({ images, title }: { images: string[]; title: string }) {
  if (images.length === 0) return null;
  return <Reveal className="detail-gallery"><h2>Gallery</h2><div className="gallery-grid">{images.map((src, i) => <figure key={`${src}-${i}`} className="gallery-item"><MediaImage src={src} alt={`${title} gallery image ${i + 1}`} /></figure>)}</div></Reveal>;
}
export function CoverFrame({ src, title, kind, icon }: { src: string; title: string; kind: 'event' | 'project' | 'research' | 'image'; icon?: string }) {
  return <div className="detail-cover">{src ? <MediaImage src={src} alt={title} priority sizes="(max-width: 1024px) 100vw, 900px" /> : <PlaceholderArt kind={kind} icon={icon} label={title} />}</div>;
}
export function ExternalLinks({ links }: { links: Array<[string, string]> }) {
  const valid = links.filter(([, url]) => safeUrl(url));
  if (valid.length === 0) return null;
  return <div className="button-row">{valid.map(([label, url]) => <a key={label} className="btn btn-secondary" href={safeUrl(url)} target="_blank" rel="noopener noreferrer"><span>{label}</span><ArrowUpRight size={15} strokeWidth={1.75} /></a>)}</div>;
}
export function ChipList({ items }: { items: string[] }) { if (items.length === 0) return null; return <div className="chip-row">{items.map(item => <span key={item} className="chip">{item}</span>)}</div>; }
export function galleryOf(data: Record<string, unknown>) { return strings(data, 'gallery'); }
