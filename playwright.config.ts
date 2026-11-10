import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    // Test the real production output (stable, no dev compile workers). Blanking
    // the Supabase vars forces the labelled read-only preview even when a live
    // .env.local is present, so the suite is deterministic on any machine/CI.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    timeout: 240000,
    reuseExistingServer: false,
    env: {
      RADAR_CONTENT_PREVIEW: 'true',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      RADAR_ADMIN_LOGIN_EMAIL: ''
    }
  }
});
