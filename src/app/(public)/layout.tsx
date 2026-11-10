import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { PreviewBanner } from '@/components/cms/preview-banner';
import { loadSiteData, settingsOf } from '@/lib/site-data';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const content = await loadSiteData();
  const settings = settingsOf(content);
  return (
    <div className={`public-site theme-${settings?.data.theme === 'white' ? 'white' : 'ivory'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {content.preview && <PreviewBanner />}
      <SiteHeader settings={settings} navigation={content.navigation_items} />
      {children}
      <SiteFooter content={content} />
    </div>
  );
}
