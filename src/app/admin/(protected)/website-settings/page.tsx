import { SettingsEditor } from '@/components/admin/settings-editor';

export const metadata = { title: 'Website Settings' };

export default function WebsiteSettingsPage() {
  return <SettingsEditor mode="general" />;
}