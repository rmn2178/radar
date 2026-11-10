import { SettingsEditor } from '@/components/admin/settings-editor';

export const metadata = { title: 'Contact Details' };

export default function ContactDetailsPage() {
  return <SettingsEditor mode="contact" />;
}