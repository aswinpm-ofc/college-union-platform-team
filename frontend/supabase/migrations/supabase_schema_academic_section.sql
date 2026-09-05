-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto" with schema "extensions";

-- ============================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================
create table if not exists public.departments (
  id text primary key,
  name text not null,
  code text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 3. SEMESTERS TABLE
-- ============================================================
create table if not exists public.semesters (
  id text primary key default gen_random_uuid()::text,
  department_id text references public.departments(id) on delete cascade,
  semester_number integer not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 4. DEPARTMENT REQUESTS TABLE
-- ============================================================
create table if not exists public.department_requests (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null,
  requested_by text default 'student',
  requester_name text default 'Student',
  reason text default '',
  status text not null default 'pending',
  admin_note text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone
);

-- ============================================================
-- 5. ACADEMIC MATERIALS TABLE
-- ============================================================
create table if not exists public.academic_materials (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text default '',
  department_id text references public.departments(id) on delete set null,
  semester_id text,
  semester integer default 1,
  subject text default 'General',
  material_type text default 'notes',
  academic_year text default '2025-2026',
  storage_path text not null,
  file_url text default '',
  original_filename text default 'document.pdf',
  mime_type text default 'application/pdf',
  file_size bigint default 0,
  uploaded_by text default 'student',
  status text not null default 'pending_review',
  rejection_reason text default '',
  downloads_count integer default 0,
  views_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
alter table public.departments enable row level security;
alter table public.semesters enable row level security;
alter table public.department_requests enable row level security;
alter table public.academic_materials enable row level security;

create policy "Public access departments" on public.departments for all to public using (true) with check (true);
create policy "Public access semesters" on public.semesters for all to public using (true) with check (true);
create policy "Public access department_requests" on public.department_requests for all to public using (true) with check (true);
create policy "Public access academic_materials" on public.academic_materials for all to public using (true) with check (true);

-- ============================================================
-- 7. STORAGE BUCKET & POLICIES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('academic_materials', 'academic_materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public select" on storage.objects;
drop policy if exists "Allow public update" on storage.objects;
drop policy if exists "Allow public delete" on storage.objects;

create policy "Allow public uploads" on storage.objects for insert to public with check ( bucket_id = 'academic_materials' );
create policy "Allow public select" on storage.objects for select to public using ( bucket_id = 'academic_materials' );
create policy "Allow public update" on storage.objects for update to public using ( bucket_id = 'academic_materials' ) with check ( bucket_id = 'academic_materials' );
create policy "Allow public delete" on storage.objects for delete to public using ( bucket_id = 'academic_materials' );