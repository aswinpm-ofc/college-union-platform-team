-- Allow academic staff to remove moderated materials and their stored files.
grant delete on public.academic_materials to authenticated;

drop policy if exists "materials_delete_staff" on public.academic_materials;
create policy "materials_delete_staff" on public.academic_materials
  for delete to authenticated
  using (has_role('academic_maintainer','academic_coordinator','super_admin'));

drop policy if exists "academic_materials_delete" on storage.objects;
create policy "academic_materials_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'academic_materials'
    and (
      owner = auth.uid()
      or has_role('academic_maintainer','academic_coordinator','super_admin')
    )
  );
