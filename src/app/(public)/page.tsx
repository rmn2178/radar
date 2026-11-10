import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/cms/page-renderer';
import { loadSiteData, pageOf, settingsOf } from '@/lib/site-data';
import { pageMetadata } from '@/lib/metadata';
import { text } from '@/lib/content';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { const content = await loadSiteData(); return pageMetadata(pageOf(content, 'home'), content, 'RADAR Centre'); }
export default async function HomePage() {
  const content = await loadSiteData();
  const page = pageOf(content, 'home');
  if (!page) notFound();
  const settings = settingsOf(content)?.data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: text(settings, 'site_name', 'RADAR Centre'),
    parentOrganization: { '@type': 'CollegeOrUniversity', name: text(settings, 'institution') },
    ...(text(settings, 'address') ? { address: { '@type': 'PostalAddress', streetAddress: text(settings, 'address'), addressLocality: 'Chennai', addressCountry: 'IN' } } : {}),
    ...(text(settings, 'phone') ? { telephone: text(settings, 'phone') } : {}),
    ...(text(settings, 'email') ? { email: text(settings, 'email') } : {})
  };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><PageRenderer page={page} content={content} /></>);
}
