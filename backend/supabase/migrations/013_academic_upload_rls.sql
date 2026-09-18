-- Ensure signed-in students can upload their own academic materials and files.
grant usage on schema public to authenticated;
grant select, insert, update on public.academic_materials to authenticated;
grant select on public.departments, public.semesters, public.subjects to authenticated;

drop policy if exists "materials_insert_own" on public.academic_materials;
create policy "materials_insert_own" on public.academic_materials
  for insert to authenticated
  with check (uploaded_by = auth.uid());

drop policy if exists "academic_materials_upload" on storage.objects;
create policy "academic_materials_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'academic_materials');