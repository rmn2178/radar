import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { safeUrl } from '@/lib/content';
export function ButtonLink({ href, children, variant = 'primary', className = '', arrow = true }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'light'; className?: string; arrow?: boolean }) {
  const url = safeUrl(href);
  if (!url) return null;
  const external = /^https?:/i.test(url);
  return (
    <Link href={url} className={`btn btn-${variant} ${className}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span>{children}</span>{arrow && <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />}
    </Link>
  );
}
