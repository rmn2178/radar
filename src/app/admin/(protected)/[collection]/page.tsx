import { notFound } from 'next/navigation';
import { CollectionManager } from '@/components/admin/collection-manager';
import type { Collection } from '@/types/content';

const routes: Record<string, Collection> = {
  members: 'members',
  events: 'events',
  projects: 'projects',
  'research-areas': 'research_areas',
  quotes: 'quotes',
  achievements: 'achievements',
  navigation: 'navigation_items',
};

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  return { title: routes[collection] ? collection.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Content' };
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const target = routes[collection];
  if (!target) notFound();
  return <CollectionManager collection={target} />;
}