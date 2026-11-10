-- RADAR Centre core schema
-- Security model:
--   * Anonymous visitors can only read the public_* security-barrier views,
--     which project published_data exclusively. Draft `data` is never exposed.
--   * All writes require a verified admin_profiles.role = 'admin' via RLS.
--   * Contact submissions and rate limiting run through narrow SECURITY DEFINER
--     RPCs with a fixed search_path; the underlying tables are not publicly readable.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin profiles (authorization source of truth)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

drop policy if exists admin_profiles_self_read on public.admin_profiles;
create policy admin_profiles_self_read on public.admin_profiles
  for select to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies: profiles are granted by controlled SQL only.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Persistent anonymised rate limiting
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limit_buckets (
  key text primary key check (char_length(key) <= 128),
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;
-- No policies: only the SECURITY DEFINER RPC below may touch this table.

create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if p_key is null or char_length(p_key) > 128 or p_max < 1 or p_window_seconds < 1 then
    return false;
  end if;
  insert into public.rate_limit_buckets as bucket (key, attempts, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    attempts = case
      when bucket.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else bucket.attempts + 1
    end,
    window_start = case
      when bucket.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else bucket.window_start
    end
  returning attempts <= p_max into allowed;
  return allowed;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Content collections: shared envelope + JSONB draft/published snapshots
-- ---------------------------------------------------------------------------

do $$
declare
  collection text;
begin
  foreach collection in array array[
    'pages', 'members', 'events', 'projects', 'research_areas',
    'quotes', 'achievements', 'navigation_items', 'site_settings'
  ]
  loop
    execute format($ddl$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        title text not null check (char_length(title) between 1 and 240),
        slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
        status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
        display_order integer not null default 0 check (display_order between 0 and 100000),
        is_featured boolean not null default false,
        data jsonb not null default '{}'::jsonb,
        published_data jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    $ddl$, collection);

    execute format('create index if not exists %I on public.%I (status, display_order)', collection || '_status_order_idx', collection);

    execute format('drop trigger if exists set_updated_at on public.%I', collection);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', collection);

    execute format('alter table public.%I enable row level security', collection);

    execute format('drop policy if exists %I on public.%I', collection || '_admin_all', collection);
    execute format($pol$
      create policy %I on public.%I
        for all to authenticated
        using (public.is_admin())
        with check (public.is_admin())
    $pol$, collection || '_admin_all', collection);

    -- Public snapshot view: projects published_data only, published rows only.
    -- SECURITY BARRIER + owner privileges mean anonymous clients cannot see the
    -- draft `data` column even on published rows.
    execute format($view$
      create or replace view public.public_%I
      with (security_barrier = true) as
        select id, title, slug, status, display_order, is_featured,
               published_data as data, created_at, updated_at
        from public.%I
        where status = 'published' and published_data is not null
    $view$, collection, collection);

    execute format('revoke all on public.%I from anon, authenticated', collection);
    execute format('grant all on public.%I to authenticated', collection);
    execute format('grant select on public.public_%I to anon, authenticated', collection);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contact enquiries (anonymous submit via RPC only; admin read/manage)
-- ---------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 3 and 180),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all on public.contact_messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.contact_messages from anon, authenticated;
grant all on public.contact_messages to authenticated;

create or replace function public.submit_contact_enquiry(
  p_name text, p_email text, p_subject text, p_message text, p_client_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_name is null or char_length(trim(p_name)) not between 2 and 120
    or p_email is null or char_length(p_email) > 254 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or p_subject is null or char_length(trim(p_subject)) not between 3 and 180
    or p_message is null or char_length(trim(p_message)) not between 10 and 5000
    or p_client_hash is null or char_length(p_client_hash) > 128 then
    raise exception 'Invalid enquiry details.';
  end if;
  if not public.check_rate_limit('contact:' || p_client_hash, 5, 3600) then
    raise exception 'Rate limit exceeded. Please try again later.';
  end if;
  insert into public.contact_messages (name, email, subject, message)
  values (trim(p_name), trim(p_email), trim(p_subject), trim(p_message))
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.submit_contact_enquiry(text, text, text, text, text) from public;
grant execute on function public.submit_contact_enquiry(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Revisions, activity log, media metadata (admin-only)
-- ---------------------------------------------------------------------------

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  snapshot jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_revisions_entity_idx on public.content_revisions (entity_type, entity_id, created_at desc);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_recent_idx on public.admin_activity_logs (created_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  image_width integer,
  image_height integer,
  alt_text text not null default '',
  caption text not null default '',
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
declare
  system_table text;
begin
  foreach system_table in array array['content_revisions', 'admin_activity_logs', 'media_assets']
  loop
    execute format('alter table public.%I enable row level security', system_table);
    execute format('drop policy if exists %I on public.%I', system_table || '_admin_all', system_table);
    execute format($pol$
      create policy %I on public.%I
        for all to authenticated
        using (public.is_admin())
        with check (public.is_admin())
    $pol$, system_table || '_admin_all', system_table);
    execute format('revoke all on public.%I from anon, authenticated', system_table);
    execute format('grant all on public.%I to authenticated', system_table);
  end loop;
end;
$$;