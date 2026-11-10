import Image from 'next/image';
import { safeUrl } from '@/lib/content';
export function MediaImage({ src, alt, className, sizes = '(max-width: 768px) 100vw, 50vw', priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const url = safeUrl(src);
  if (!url) return null;
  return <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className={className} style={{ objectFit: 'cover' }} />;
}
