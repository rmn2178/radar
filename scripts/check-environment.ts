/**
 * Pre-deployment environment check. Prints PASS/FAIL per requirement and never
 * prints secret values. Exit code 0 only when every required check passes.
 */
const checks: { label: string; pass: boolean; hint?: string }[] = [];

const nodeMajor = Number(process.versions.node.split('.')[0]);
checks.push({ label: `Node.js >= 20 (found ${process.versions.node})`, pass: nodeMajor >= 20 });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
checks.push({ label: 'NEXT_PUBLIC_SUPABASE_URL is set', pass: !!url, hint: 'Copy it from Supabase → Project Settings → API.' });
checks.push({ label: 'Anon/publishable key is set', pass: !!key, hint: 'Use the anon public key, never the service-role key.' });
if (key) {
  checks.push({ label: 'Key is not a secret/service-role key', pass: !key.startsWith('sb_secret_') });
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      checks.push({ label: 'JWT key has the anon role', pass: payload.role === 'anon' });
    } catch { checks.push({ label: 'JWT key has the anon role', pass: false, hint: 'The key could not be decoded.' }); }
  }
}
const email = process.env.RADAR_ADMIN_LOGIN_EMAIL?.trim();
checks.push({ label: 'RADAR_ADMIN_LOGIN_EMAIL is set', pass: !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), hint: 'Must match the Supabase Auth user you created.' });
checks.push({ label: 'RADAR_RATE_LIMIT_SECRET is set (32+ chars)', pass: (process.env.RADAR_RATE_LIMIT_SECRET?.length ?? 0) >= 32, hint: 'Generate any random 32+ character string.' });
checks.push({ label: 'RADAR_CONTENT_PREVIEW is not forcing preview', pass: process.env.RADAR_CONTENT_PREVIEW !== 'true', hint: 'Unset it for a live deployment.' });

let failed = 0;
for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.label}${!check.pass && check.hint ? ` — ${check.hint}` : ''}`);
  if (!check.pass) failed += 1;
}
console.log(failed === 0 ? '\nEnvironment ready for a live deployment.' : `\n${failed} check(s) failed. Fix them before deploying.`);
process.exit(failed === 0 ? 0 : 1);