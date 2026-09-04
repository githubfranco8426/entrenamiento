-- Fotos de progreso (design/stitch-redesign/17-progreso-visual-composicion-corporal).
alter table body_metrics add column photo_path text;

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Cada usuario solo puede leer/escribir dentro de su propia carpeta: progress-photos/<user_id>/...
create policy "progress_photos_select_own" on storage.objects
  for select
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "progress_photos_insert_own" on storage.objects
  for insert
  with check (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "progress_photos_update_own" on storage.objects
  for update
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "progress_photos_delete_own" on storage.objects
  for delete
  using (bucket_id = 'progress-photos' and (select auth.uid())::text = (storage.foldername(name))[1]);
