-- Ensure the academic materials storage bucket exists on deployed projects.
insert into storage.buckets (id, name, public)
values ('academic_materials', 'academic_materials', true)
on conflict (id) do update set public = true;

drop policy if exists "academic_materials_read" on storage.objects;
drop policy if exists "academic_materials_upload" on storage.objects;
drop policy if exists "academic_materials_update" on storage.objects;
drop policy if exists "academic_materials_delete" on storage.objects;

create policy "academic_materials_read" on storage.objects
  for select using (bucket_id = 'academic_materials');
create policy "academic_materials_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'academic_materials');
create policy "academic_materials_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'academic_materials' and owner = auth.uid());
create policy "academic_materials_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'academic_materials' and owner = auth.uid());
