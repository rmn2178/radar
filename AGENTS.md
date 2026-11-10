# Project instructions — RADAR Centre website

## Design system
- Tokens live in `src/app/globals.css`: navy `#0D2749`, deep `#091C34`, teal `#087E83`, light teal `#E8F4F2`, gold `#C69A39`, warm white `#FAFAF7`, border `#E5E9ED`.
- Manrope for UI/body; DM Serif Display for quotations and the closing statement only.
- Premium academic editorial style: thin 1px borders, generous whitespace, restrained motion. No neon gradients, glassmorphism, emoji icons, fake statistics or AI-generated institutional photography.
- Original logos in `public/brand/` are immutable source assets; never redraw, recolour or crop them. CMS may replace them via media settings, with repository copies as fallback.

## Architecture rules
- Public editable content must come from Supabase (or the labelled local preview fixture). Do not hardcode editable copy in components.
- CMS content is structured JSON validated by Zod (`src/lib/content.ts`). The section renderer maps registered types to trusted React components. Never `eval`, `new Function`, or `dangerouslySetInnerHTML` with CMS data.
- Records use a common envelope (`id,title,slug,status,display_order,is_featured,data,published_data`). Draft edits live in `data`; the public site reads only `published_data` of published rows.
- Every mutating API route and server action must verify the administrator role server-side. RLS is the final authority; hidden UI is not security.

## Database & auth
- Use `@supabase/ssr` clients. Only the anon/publishable key reaches the browser. No service-role key in the runtime.
- Administrator authorization comes from `admin_profiles`, never a client flag. Users cannot self-promote.
- Keep migrations idempotent and ordered; regenerate seed SQL with `npm run seed:generate` after editing `src/data/seed.ts`.

## Content integrity
- Do not invent names, dates, portraits, achievements, technical results or clinical validation. Leave unknown fields blank/null.
- Preserve “accepted” vs “uploaded” paper distinctions. Keep the contact email blank until configured.

## Quality gates
- Run `npm run check` (lint, typecheck, unit tests, build) before declaring work complete.
- Add responsive browser checks at 1440/768/390px for public and admin surfaces.
- Distinguish local/preview verification from live Supabase integration; never simulate a successful database write.
