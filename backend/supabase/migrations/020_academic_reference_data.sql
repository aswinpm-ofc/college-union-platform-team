-- Ensure every active department has real semester rows for material uploads.
insert into public.semesters (department_id, semester_number, name)
select d.id, semester_number, 'Semester ' || semester_number || ' (S' || semester_number || ')'
from public.departments d
cross join generate_series(1, 8) as semester_number
where d.active = true
on conflict (department_id, semester_number) do nothing;

-- Student uploads may create a subject when one does not exist yet.
grant insert on public.subjects to authenticated;
drop policy if exists "subjects_insert" on public.subjects;
create policy "subjects_insert" on public.subjects
  for insert to authenticated
  with check (true);
