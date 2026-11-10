# Security

## Authentication

- Supabase Auth handles credential verification and password hashing. The `/admin` passcode is the Auth password for a single pre-created administrator account; the email is supplied server-side via `RADAR_ADMIN_LOGIN_EMAIL`.
- Public sign-ups are disabled. There is no hardcoded password comparison in the browser and no passcode stored in website tables.
- After sign-in, the server checks `admin_profiles.role`. Authenticated users without the admin role are signed out and rejected.
- Sessions use HTTP-only cookies via `@supabase/ssr`; logout clears them. Protected layouts and every mutating route call `requireAdmin()`.

## Authorization & RLS

- RLS is enabled on all tables. Anonymous reads are limited to published snapshots through views/RPC that never expose draft `data` columns.
- Admin writes require a database-verified role through a SECURITY DEFINER helper with a fixed safe `search_path` and restricted grants. Policies avoid recursion; users cannot insert their own admin profile.
- `admin_profiles`, `contact_messages`, `admin_activity_logs`, `content_revisions` and rate-limit internals are admin-only.
- A hidden `/admin` URL is not treated as security; the database enforces permissions independently of the UI.

## Secrets

- Only the Supabase anon/publishable key is used by the application and may appear in `NEXT_PUBLIC_` variables.
- No service-role key is required by the runtime and none may be exposed to the browser. One-time elevated setup (if ever needed) stays isolated from the deployed app.
- `.env*` is gitignored; `.env.example` contains no secrets. `RADAR_RATE_LIMIT_SECRET` is server-only and used to anonymise rate-limit keys.

## Input & output safety

- All CMS records and sections are validated with Zod before persistence; URLs are restricted to relative paths or `http(s)/mailto/tel`, blocking `javascript:` and `data:` vectors.
- The section renderer uses a typed registry of trusted components. CMS content is never evaluated as code (`eval`, `new Function`) or injected as raw HTML.
- Contact submissions are validated, honeypot-protected and rate-limited through a narrow RPC; success is shown only after a confirmed database write.

## Media & transport

- Uploads are validated server-side for MIME, magic bytes and size (≤ 8 MB); SVG and executable types are rejected. Files use unique UUID paths in Storage.
- Storage is public-read for published assets; insert/update/delete require admin. Referenced assets cannot be deleted or replaced destructively.
- Security headers set `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, a restrictive `Permissions-Policy`, and a CSP baseline (`object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`).
- Mutating APIs enforce same-origin checks and bounded request bodies.

## Verification

Static tests assert no public service-role variable and no executable CMS rendering. Live RLS/Auth/Storage behaviour must be tested with anonymous and admin sessions using the checklist in DEPLOYMENT.md before launch.
