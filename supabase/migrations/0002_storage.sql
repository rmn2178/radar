-- RADAR media storage: public-read bucket, admin-only writes.
-- Object paths are UUID names under typed folders; the application validates
-- MIME type and byte size server-side before uploading.

insert into storage.buckets (id, name, public)
values ('radar-media', 'radar-media', true)
on conflict (id) do nothing;

drop policy if exists radar_media_public_read on storage.objects;
create policy radar_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'radar-media');

drop policy if exists radar_media_admin_insert on storage.objects;
create policy radar_media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'radar-media' and public.is_admin());

drop policy if exists radar_media_admin_update on storage.objects;
create policy radar_media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'radar-media' and public.is_admin())
  with check (bucket_id = 'radar-media' and public.is_admin());

drop policy if exists radar_media_admin_delete on storage.objects;
create policy radar_media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'radar-media' and public.is_admin());