# Database & Row Level Security

Migrations live in `supabase/migrations/` and run in filename order. Seed SQL is generated from `src/data/seed.ts` via `npm run seed:generate` into `supabase/seed/initial-radar-content.sql` (idempotent `ON CONFLICT DO NOTHING`).

## Content collections

Each collection table uses the shared envelope plus JSONB `data`/`published_data`:

| Table | Purpose |
| --- | --- |
| `site_settings` | Singleton branding, contact, SEO and design settings |
| `pages` | Public pages; `data.sections` holds ordered typed blocks |
| `members` | Core member profiles |
| `events` | Events & activities (nullable dates) |
| `projects` | Student/research projects |
| `research_areas` | Research focus areas |
| `quotes` | Editorial quotations |
| `achievements` | Verified faculty/student achievements |
| `navigation_items` | Header/footer navigation |

Common columns: `id uuid PK`, `title`, `slug unique`, `status check (draft/published/archived)`, `display_order`, `is_featured`, `data jsonb`, `published_data jsonb`, `created_at`, `updated_at` (trigger-maintained). Indexes cover slug, status and display order.

JSONB is used deliberately for schema-driven CMS fields; every shape is validated by Zod in the application before write. Galleries/participants/contributors are arrays of storage paths or strings, never image binaries.

## System tables

| Table | Purpose |
| --- | --- |
| `admin_profiles` | `user_id` → Auth user, `role` (admin). Source of authorization; no self-insert |
| `media_assets` | Storage metadata: path unique, MIME, size, dimensions, alt, caption, uploader |
| `contact_messages` | Enquiries: name/email/subject/message/status (unread/read/resolved) |
| `content_revisions` | Snapshot JSONB per entity for safe restore |
| `admin_activity_logs` | Admin actions with entity reference |
| `rate_limit_buckets` | Persistent anonymised throttling for login/contact |

## Public vs admin access

RLS is enabled on every table.

- **Anonymous** may read only published snapshots. Because `data` contains drafts, public access is granted through security-barrier views / RPC that project `published_data` only — anonymous clients cannot select draft columns even on published rows.
- **Anonymous** may submit contact enquiries through a narrow validated RPC (not direct table insert), subject to persistent rate limiting.
- **Admin** (verified `admin_profiles.role`) may CRUD content, manage media metadata, read enquiries, restore revisions and change settings.
- `admin_profiles`, `contact_messages`, `admin_activity_logs`, `content_revisions` and rate-limit internals are never publicly readable.

The admin check is a SECURITY DEFINER function with a fixed safe `search_path` and restricted execute grants, avoiding recursive RLS on `admin_profiles`.

## Storage

Bucket `radar-media` is public-read for published assets. Object-level policies restrict insert/update/delete to verified admins. The application validates MIME/bytes/size server-side and stores unique UUID paths under `branding/`, `members/`, `events/`, `projects/`, `research/`, `achievements/`, `pages/`.

## Administrator bootstrap

The first admin is created manually in Supabase Auth, then linked via controlled SQL (see DEPLOYMENT.md). No passcode is stored in website tables; authentication uses Supabase Auth password hashing.
