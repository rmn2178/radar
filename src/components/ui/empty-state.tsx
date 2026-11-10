import { Inbox } from 'lucide-react';
export function EmptyState({ title = 'Nothing here yet', description = 'New content will appear here once it is published.' }: { title?: string; description?: string }) {
  return <div className="empty-state"><Inbox size={28} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}
