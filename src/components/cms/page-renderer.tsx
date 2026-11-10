import type { ContentRecord, PublicData } from '@/types/content';
import { sections } from '@/lib/content';
import { SectionRenderer } from './section-renderer';
import { EmptyState } from '@/components/ui/empty-state';
export function PageRenderer({ page, content }: { page: ContentRecord; content: PublicData }) {
  const blocks = sections(page.data);
  if (blocks.length === 0) return <div className="container section"><EmptyState title="This page has no published sections yet" description="Content will appear here once an administrator publishes it." /></div>;
  const firstVisible = blocks.findIndex(block => block.visible);
  return <main id="main-content">{blocks.map((section, index) => <SectionRenderer key={section.id} section={section} content={content} first={index === firstVisible} />)}</main>;
}
