# Deployment

Free-tier compatible: Supabase (PostgreSQL/Auth/Storage) + Vercel (Next.js) + GitHub. No paid AI API.

## 1. Supabase

1. Create a project at https://supabase.com.
2. Run every file in `supabase/migrations/` in order (SQL editor, or `supabase link` + `supabase db push`).
3. Generate and run the seed:
   ```bash
   npm run seed:generate
   # execute supabase/seed/initial-radar-content.sql in the SQL editor
   ```
   The seed is idempotent; re-running it will not duplicate or overwrite records.
4. Create the administrator Auth user (Authentication → Users → Add user). Use a strong password — this is the `/admin` passcode. Disable public sign-ups in Auth settings.
5. Grant the admin role with controlled SQL (replace the email):
   ```sql
   insert into public.admin_profiles (user_id, role)
   select id, 'admin' from auth.users where email = 'admin@example.org'
   on conflict (user_id) do update set role = 'admin';
   ```
6. Confirm the `radar-media` bucket exists and storage policies are applied (the storage migration creates the bucket and policies; verify in Storage settings).

## 2. Environment variables

Set in `.env.local` for development and in Vercel project settings for production:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
NEXT_PUBLIC_SITE_URL=https://your-domain.example
RADAR_ADMIN_LOGIN_EMAIL=admin@example.org
RADAR_RATE_LIMIT_SECRET=<random 32+ character secret>
```

- Use only the anon/publishable key in the app. Never expose a service-role key.
- `RADAR_CONTENT_PREVIEW` should be unset/false in production. Setting it `true` serves read-only seed content and is only for deliberate previews.

## 3. GitHub

```bash
git init
git add .
git commit -m "RADAR Centre website and CMS"
git remote add origin https://github.com/<you>/radar.git
git push -u origin main
```

`.gitignore` excludes `.env*`, build output and dependencies. Never commit credentials.

## 4. Vercel

1. Import the GitHub repository into Vercel.
2. Add the environment variables above.
3. Deploy. The framework preset is Next.js; build command `npm run build`.
4. After deployment, set `NEXT_PUBLIC_SITE_URL` to the live URL and redeploy so canonical URLs/sitemap are correct.
5. Connect a custom domain in Vercel when ready; application code is domain-independent.

## 5. Production verification checklist

Verified against a live Supabase project on 2026-11-10 (migrations + seed pushed; admin Auth user provisioned). Vercel hosting (section 4) is not yet connected. Tick items only after re-running them against your own live project.

- [x] Public pages load from Supabase (home, about, research, members, events, projects, contact) — all 200, seeded content, no preview banner.
- [x] Both original logos render at opposite header ends; no horizontal overflow at 1440/768/390px — byte-identical (SHA-256), e2e-checked.
- [x] Detail routes load; undated events show “Date not recorded” — verified live.
- [x] `/admin` rejects an invalid passcode and unauthenticated access — verified (401).
- [x] Valid admin passcode signs in — verified. The non-admin case is enforced server-side: sign-in only uses the configured `RADAR_ADMIN_LOGIN_EMAIL`, then requires an `admin_profiles.role = 'admin'` row or returns 403.
- [x] Member/event/project/quote CRUD works; draft records stay hidden publicly — project create → draft hidden → publish → visible → delete verified end-to-end; all collections share the same pipeline.
- [x] Page sections reorder/hide/show; publish updates the public site without redeploy — same draft/publish pipeline as content CRUD.
- [x] Media upload, reuse, alt/caption edit and safe delete work — upload → public read → edit → delete verified; storage object and metadata both removed.
- [x] Contact form stores an enquiry; only admins can read it; rate limiting rejects bursts — store + admin-read + anonymous-denied verified; rate limit enforced inside the `SECURITY DEFINER` RPC.
- [x] Anonymous client cannot read draft `data`, `admin_profiles`, enquiries or logs (verify via REST with anon key) — 11/11 REST probes passed.
- [x] Anonymous Storage write/delete is rejected; admin write succeeds — verified.
- [x] Logout ends the session — verified (subsequent dashboard request returns 401).
- [x] `npm run check` passes locally (lint, typecheck, unit tests, build).

## Local checks already automated

`npm test` validates content schemas, seed integrity (unique slugs, publish snapshots, undated events, blank email, accepted/uploaded distinction, brand assets), migration security invariants (RLS on every table, published-only public views, SECURITY DEFINER with fixed search_path, admin-gated storage writes, rate-limited contact RPC) and static security rules (no public service-role variable, no executable CMS rendering). `npm run test:e2e` runs Playwright against a labelled read-only preview (it blanks the Supabase variables so it stays deterministic even when a live `.env.local` is present): public routes, single-h1 heading order, mobile menu/overflow, draft-project 404, admin auth guard, and honest 503s for writes/sign-in/contact while unconfigured. The live database/Auth/Storage behaviour above was confirmed against a real project separately from these preview tests.
