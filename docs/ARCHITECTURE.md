# Architecture

## Overview

One Next.js App Router application serves two surfaces that share a Supabase backend:

1. **Public website** — server-rendered institutional pages under `src/app/(public)/`.
2. **Admin CMS** — passcode login plus a protected route group under `src/app/admin/(protected)/`.

## Public rendering pipeline

```
Supabase (published snapshots)
  -> src/lib/database/queries.ts getPublicData()
  -> src/lib/site-data.ts loadSiteData() (React cache, per-request dedupe)
  -> PageRenderer (src/components/cms/page-renderer.tsx)
  -> SectionRenderer (typed registry, src/components/cms/section-renderer.tsx)
  -> trusted React components (hero, research, members, events, projects, …)
```

- Pages are stored as records with an ordered `sections` array in `data`. Each section has a registered `type`, `variant`, `visible` flag and validated `data`.
- The renderer never executes CMS content. Unknown section types are skipped; every field is validated by Zod before persistence.
- Detail routes (`/members/[slug]`, `/events/[slug]`, `/projects/[slug]`, `/research/[slug]`) read the same published collections.
- Listing pages use client-side explorers for search/filter/pagination over server-fetched published records.

## Data model

Content collections share a common envelope: `id, title, slug, status, display_order, is_featured, data, published_data, created_at, updated_at`. Structured fields live inside `data` (JSONB) and are validated per collection by `src/lib/content.ts`. This keeps the page builder and CRUD editors schema-driven while preserving unique slugs, ordering and publish state as real columns.

- `data` holds the current (possibly draft) edit.
- `published_data` holds the last published snapshot.
- Public reads expose **only** `published_data` for `status = 'published'` rows, via database views/RPC so draft JSON is never selectable by anonymous clients.

## Authentication & authorization

- `@supabase/ssr` browser/server clients with cookie-based sessions.
- `/admin/login` submits a single passcode to `POST /api/auth/login`; the server uses `RADAR_ADMIN_LOGIN_EMAIL` + Supabase Auth password grant, then verifies `admin_profiles.role = 'admin'`. Non-admins are signed out.
- `requireAdmin()` guards protected layouts, preview and every mutating API route.
- RLS policies use a fixed-`search_path` SECURITY DEFINER helper to check the admin role without recursive policies or self-promotion.

## Media flow

```
select file -> client validation/preview -> POST /api/admin/media (multipart)
  -> server validates bytes/MIME/size -> Supabase Storage radar-media/<folder>/<uuid>.<ext>
  -> media_assets metadata row -> reusable MediaPicker across all editors
```

Images are stored in Storage, never as Base64 in PostgreSQL. Deletion/replacement of referenced assets is rejected to avoid breaking live pages.

## Publishing

Saving a draft writes `data`. Publishing validates the record, copies `data` into `published_data`, sets status, records a revision and activity log entry in one database transaction, and revalidates public paths. No Git commit or Vercel redeploy is needed for content changes.

## Preview mode

`src/lib/supabase/config.ts` controls configuration. Without credentials, non-production builds may render the labelled seed fixture (`RADAR_CONTENT_PREVIEW`). Production requires either real Supabase configuration or an explicit `RADAR_CONTENT_PREVIEW=true`. Write APIs return `503` when unconfigured — they never simulate success.
