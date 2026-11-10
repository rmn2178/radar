import type { NextConfig } from 'next';
const storage = process.env.NEXT_PUBLIC_SUPABASE_URL;
const config: NextConfig = {
  images: { remotePatterns: storage ? [{ protocol: 'https', hostname: new URL(storage).hostname, pathname: '/storage/v1/object/public/radar-media/**' }] : [] },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" }
    ] }];
  }
};
export default config;
