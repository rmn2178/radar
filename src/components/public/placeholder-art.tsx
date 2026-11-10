import { CalendarDays, FlaskConical, Image as ImageIcon, UserRound, type LucideIcon } from 'lucide-react';
import { ResearchIcon } from './research-icon';
const kindIcons: Record<string, LucideIcon> = { member: UserRound, event: CalendarDays, project: FlaskConical, image: ImageIcon };
export function PlaceholderArt({ kind = 'image', icon, label, className = '' }: { kind?: 'member' | 'event' | 'project' | 'research' | 'image'; icon?: string; label?: string; className?: string }) {
  const Icon = kindIcons[kind];
  return (
    <div className={`placeholder-art placeholder-${kind} ${className}`} role="img" aria-label={label ? `${label} — image pending` : 'Image pending'}>
      <svg className="placeholder-grid" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id={`grid-${kind}`} width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth="0.6" /></pattern></defs>
        <rect width="400" height="300" fill={`url(#grid-${kind})`} />
        <circle cx="330" cy="60" r="70" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <circle cx="330" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
      </svg>
      <span className="placeholder-icon">{kind === 'research' ? <ResearchIcon name={icon ?? 'scan'} size={30} /> : Icon ? <Icon size={30} strokeWidth={1.5} /> : null}</span>
      {label && <span className="placeholder-label">{label}</span>}
    </div>
  );
}
