-- Storage for event cover photos managed by content editors and super admins.
insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do update set public = true;

drop policy if exists "event_posters_read" on storage.objects;
drop policy if exists "event_posters_write" on storage.objects;
drop policy if exists "event_posters_delete" on storage.objects;

create policy "event_posters_read" on storage.objects
  for select using (bucket_id = 'event-posters');
create policy "event_posters_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-posters' and has_role('content_editor','super_admin'));
create policy "event_posters_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-posters' and has_role('content_editor','super_admin'));