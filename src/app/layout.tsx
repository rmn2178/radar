import type { Metadata } from 'next';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'RADAR Centre | Rajalakshmi Institute of Technology', template: '%s | RADAR Centre' },
  description: 'Engineering a healthier tomorrow through interdisciplinary healthcare research.',
  applicationName: 'RADAR Centre',
  icons: { icon: '/brand/radar-logo.png' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
