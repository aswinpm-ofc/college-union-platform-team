-- 002_department_requests_and_academic_storage.sql
--
-- Adds the "request a new department" workflow and the academic_materials
-- storage bucket. Both are already used by the frontend
-- (frontend/src/services/api/academicsService.js) but were missing from
-- 001_initial_schema.sql.
--
-- A second, incompatible copy of part of this schema had been committed
-- directly to frontend/supabase/migrations/ (added in df4b642, "feat:
-- complete academics module and added supabase schema"). It used text
-- slugs as primary keys (e.g. 'dept-cse') instead of this project's uuid
-- convention, defined no relationship to profiles/auth.users, and opened
-- every table and the storage bucket to "public" with no restrictions.
-- That folder has been removed from frontend/ — backend/supabase is the
-- only place schema changes should live. This migration supersedes it.

create table if not exists department_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  requested_by uuid not null references profiles(id) on delete cascade,
  reason text default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text default '',
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists idx_department_requests_status on department_requests(status, created_at desc);

-- ── Row Level Security ───────────────────────────────────────────────────
-- Starter policies scoped to this module only. They assume real Supabase
-- Auth sessions (auth.uid()) — see the note at the bottom of this file,
-- since the frontend does not establish those yet.

alter table departments enable row level security;
alter table semesters enable row level security;
alter table subjects enable row level security;
alter table academic_materials enable row level security;
alter table department_requests enable row level security;

create policy "departments_select" on departments
  for select to authenticated using (true);
create policy "departments_staff_write" on departments
  for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin')));

create policy "semesters_select" on semesters
  for select to authenticated using (true);
create policy "semesters_staff_write" on semesters
  for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin')));

create policy "subjects_select" on subjects
  for select to authenticated using (true);

-- Academic materials: approved materials are visible to any signed-in
-- user; a student can also see their own pending/rejected uploads;
-- maintainers/coordinators/admins can see and moderate everything.
create policy "materials_select" on academic_materials
  for select to authenticated
  using (
    status = 'approved'
    or uploaded_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_maintainer','academic_coordinator','super_admin'))
  );
create policy "materials_insert_own" on academic_materials
  for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy "materials_update" on academic_materials
  for update to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_maintainer','academic_coordinator','super_admin'))
  );

-- Department requests: a student can create and read their own; the
-- coordinator/admin role can read and act on all of them.
create policy "dept_requests_insert_own" on department_requests
  for insert to authenticated
  with check (requested_by = auth.uid());
create policy "dept_requests_select" on department_requests
  for select to authenticated
  using (
    requested_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin'))
  );
create policy "dept_requests_staff_update" on department_requests
  for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('academic_coordinator','super_admin')));

-- ── Storage bucket for uploaded materials ────────────────────────────────
-- Public read (approved materials are meant to be downloadable by anyone),
-- but only signed-in users can upload, and only the uploader can modify or
-- remove their own file.
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
  for insert to authenticated with check (bucket_id = 'academic_materials');
create policy "academic_materials_update" on storage.objects
  for update to authenticated using (bucket_id = 'academic_materials' and owner = auth.uid());
create policy "academic_materials_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'academic_materials' and owner = auth.uid());

-- ── IMPORTANT: read before running ───────────────────────────────────────
-- This file is intentionally left matching what actually shipped first —
-- see 004_rls_baseline_remaining_tables.sql for two things that were
-- originally (wrongly) added here after the fact:
--
--   1. has_role() / is_academic_staff() — the department/semester
--      staff-write and materials/department_requests policies above use
--      a plain "profiles.role in (...)" check. 004 upgrades these four
--      to a properly *scoped* check (a maintainer only gets access
--      within their assigned department/semester/subject, not
--      everywhere) via DROP POLICY + CREATE POLICY, right after it
--      defines those two helper functions.
--   2. Baseline grants for anon/authenticated — RLS restricts *rows*,
--      not table access itself, and this file never granted the
--      underlying table privileges. 004 adds them.
--
-- Editing this file's SQL directly (instead of layering the fix into a
-- later migration) is exactly what caused those two things to go missing
-- on any database where this migration had already run before the fix
-- existed: `supabase db push` tracks migrations by version number, not
-- content, so a file that's already been applied is never re-run just
-- because its local contents changed. Once a migration may have shipped
-- anywhere, later fixes belong in a new migration, not an edit here —
-- which is why they now live in 004 instead.
