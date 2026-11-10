# Admin guide

## Sign in

1. Open `/admin`. Unauthenticated visitors are redirected to `/admin/login`.
2. Enter the administrator passcode (the Supabase Auth password for the configured admin account). Use the eye icon to reveal it; press Enter to submit.
3. Invalid passcodes show a generic error. Accounts without the admin role are rejected and signed out.
4. Use **Logout** in the sidebar to end the session.

The login email is configured server-side (`RADAR_ADMIN_LOGIN_EMAIL`); visitors never see or choose an email, and public sign-up is disabled.

## Dashboard

Shows real counts (published members/events/projects, research areas, achievements, quotes, unread enquiries), recent activity and quick-create links. No placeholder analytics.

## Page Builder

- Choose a page (Home, About, Research, Members, Events, Projects, Contact, or a custom page).
- Add any registered block: hero, editorial/rich text, image+text, gallery, quote, research/member/event/project/achievement showcases, statistics, timeline, vision & mission, call-to-action, contact, divider, spacer, full-width image, two columns.
- Edit fields with structured forms — no HTML or code is exposed.
- Reorder by drag-and-drop or keyboard up/down; duplicate, hide/show, or delete (with confirmation) blocks.
- Choose a layout variant (default/light/dark/split).
- **Save draft** keeps changes private; **Publish** copies the draft to the live snapshot; **Preview** renders the draft on an admin-only route; **Revisions** can restore an earlier snapshot as a draft.

## Members / Events / Projects / Research / Quotes / Achievements

Each manager provides search, filters, ordering, feature flags and draft/publish/archive controls. Open a record to edit all fields; images use the shared MediaPicker. Deleting requires confirmation and never removes a media file still referenced elsewhere.

- Events: leave dates blank when unknown; end date cannot precede start date. Past events automatically classify as completed.
- Projects: keep “Details pending” until specifications are confirmed; do not invent results.
- Achievements: preserve accepted vs uploaded wording.

## Media Library

- Drag-and-drop or browse to upload multiple JPEG/PNG/WebP images (≤ 8 MB each). Oversized photos can be compressed client-side; logos are preserved.
- Preview before upload; progress and errors are shown per file.
- Search, edit alt text/caption, copy URL, reuse across any editor, replace or delete unused assets.
- Files live in Supabase Storage; metadata lives in PostgreSQL.

## Navigation, Contact & Settings

- Navigation: add/rename/reorder/hide links, set header/footer location, external URLs and new-tab behaviour.
- Contact Details / Website Settings: phone, WhatsApp, email (blank until provided), address, department, maps, socials, logos, SEO and approved layout variants. Changes appear publicly after saving/publishing without redeployment.

## Enquiries

Read contact-form submissions, search/filter by status, mark read/unread/resolved, or delete. Only administrators can read these messages.
