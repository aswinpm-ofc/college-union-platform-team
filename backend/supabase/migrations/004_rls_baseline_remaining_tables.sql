-- 004_rls_baseline_remaining_tables.sql
--
-- 001_initial_schema.sql never enabled row level security on anything.
-- 002 covered the academics tables it introduced/touched (departments,
-- semesters, subjects, academic_materials, department_requests) but with
-- a plain "profiles.role in (...)" check and no baseline grants. This
-- migration defines the real role helpers, adds the grants, upgrades
-- those four 002 policies to use the helpers, and adds RLS to
-- everything else. Apply 002, 003, 004 in order.
--
-- Why the upgrade lives here instead of just editing 002: on any
-- database where 002 already ran (including anything pushed with
-- `supabase db push` before this fix existed), Supabase tracks
-- migrations by version number, not content — editing 002's file
-- locally does nothing for a database that already has "002" recorded
-- as applied. DROP POLICY + CREATE POLICY here is what actually reaches
-- a database in that state. `create or replace function` below is
-- likewise safe to run whether or not 002 already defined it.
--
-- These are starter policies based on the columns and roles the schema
-- already defines (app_role: student, academic_maintainer,
-- academic_coordinator, grievance_officer, content_editor, super_admin).
-- Review them against how each feature actually behaves before real
-- student data goes in, per backend/README.md.

-- ── Role-check helpers (see 002 for the original definitions/notes) ─────
create or replace function has_role(variadic roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role::text = any(roles)
  );
$$;

create or replace function is_academic_staff(p_department_id uuid, p_semester_id uuid default null, p_subject_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_role('academic_coordinator','super_admin')
  or exists (
    select 1 from academic_maintainers am
    where am.user_id = auth.uid()
      and am.active
      and am.department_id = p_department_id
      and (am.semester_id is null or am.semester_id = p_semester_id)
      and (am.subject_id is null or am.subject_id = p_subject_id)
  );
$$;

-- ── Baseline table privileges (see 002 for why these are needed) ────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- ── Upgrade the four 002 policies that used a flat role check ───────────
-- Same effective behavior for academic_coordinator/super_admin; the
-- difference is academic_maintainer access is now scoped to their
-- academic_maintainers assignment instead of being global.
drop policy if exists "departments_staff_write" on departments;
create policy "departments_staff_write" on departments
  for all to authenticated
  using (has_role('academic_coordinator','super_admin'))
  with check (has_role('academic_coordinator','super_admin'));

drop policy if exists "semesters_staff_write" on semesters;
create policy "semesters_staff_write" on semesters
  for all to authenticated
  using (has_role('academic_coordinator','super_admin'))
  with check (has_role('academic_coordinator','super_admin'));

drop policy if exists "materials_select" on academic_materials;
create policy "materials_select" on academic_materials
  for select to authenticated
  using (
    status = 'approved'
    or uploaded_by = auth.uid()
    or is_academic_staff(department_id, semester_id, subject_id)
  );

drop policy if exists "materials_update" on academic_materials;
create policy "materials_update" on academic_materials
  for update to authenticated
  using (
    uploaded_by = auth.uid()
    or is_academic_staff(department_id, semester_id, subject_id)
  );

drop policy if exists "dept_requests_select" on department_requests;
create policy "dept_requests_select" on department_requests
  for select to authenticated
  using (
    requested_by = auth.uid()
    or has_role('academic_coordinator','super_admin')
  );

drop policy if exists "dept_requests_staff_update" on department_requests;
create policy "dept_requests_staff_update" on department_requests
  for update to authenticated
  using (has_role('academic_coordinator','super_admin'));

alter table profiles enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table announcements enable row level security;
alter table grievances enable row level security;
alter table grievance_updates enable row level security;
alter table blood_donors enable row level security;
alter table blood_requests enable row level security;
alter table welfare_items enable row level security;
alter table magazine_issues enable row level security;
alter table magazine_articles enable row level security;
alter table map_locations enable row level security;
alter table emergency_contacts enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table device_tokens enable row level security;
alter table academic_reports enable row level security;
alter table academic_maintainers enable row level security;
alter table academic_moderation_logs enable row level security;
alter table audit_logs enable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────
-- Everyone can read/edit their own row; super_admin can read every row
-- (for admin tooling). Column-level grants (not just RLS) stop a user
-- from promoting their own role or editing someone else's account status
-- — RLS alone only controls *which rows*, not *which columns*, you can
-- touch.
create policy "profiles_select_own_or_admin" on profiles
  for select to authenticated
  using (id = auth.uid() or has_role('super_admin'));
drop policy if exists "profiles_update_own" on profiles;

create policy "profiles_update_own" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on profiles from authenticated;
grant update (full_name, student_id, department_id, semester) on profiles to authenticated;

-- ── events ────────────────────────────────────────────────────────────────
create policy "events_select" on events
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));
create policy "events_write" on events
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

create policy "event_registrations_select" on event_registrations
  for select to authenticated
  using (student_id = auth.uid() or has_role('content_editor','super_admin'));
create policy "event_registrations_insert" on event_registrations
  for insert to authenticated
  with check (student_id = auth.uid());
create policy "event_registrations_delete" on event_registrations
  for delete to authenticated
  using (student_id = auth.uid() or has_role('content_editor','super_admin'));

-- ── announcements ─────────────────────────────────────────────────────────
create policy "announcements_select" on announcements
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));
create policy "announcements_write" on announcements
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

-- ── grievances ────────────────────────────────────────────────────────────
create policy "grievances_select" on grievances
  for select to authenticated
  using (student_id = auth.uid() or assigned_to = auth.uid() or has_role('grievance_officer','super_admin'));
create policy "grievances_insert" on grievances
  for insert to authenticated
  with check (student_id = auth.uid());
create policy "grievances_update" on grievances
  for update to authenticated
  using (student_id = auth.uid() or assigned_to = auth.uid() or has_role('grievance_officer','super_admin'));

create policy "grievance_updates_select" on grievance_updates
  for select to authenticated
  using (exists (
    select 1 from grievances g where g.id = grievance_id
      and (g.student_id = auth.uid() or g.assigned_to = auth.uid() or has_role('grievance_officer','super_admin'))
  ));
create policy "grievance_updates_insert" on grievance_updates
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from grievances g where g.id = grievance_id
        and (g.student_id = auth.uid() or g.assigned_to = auth.uid() or has_role('grievance_officer','super_admin'))
    )
  );

-- ── blood bank ────────────────────────────────────────────────────────────
-- A donor directory only works if signed-in users can browse it.
create policy "blood_donors_select" on blood_donors
  for select to authenticated using (true);
create policy "blood_donors_write_own" on blood_donors
  for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "blood_requests_select" on blood_requests
  for select to authenticated using (true);
create policy "blood_requests_insert" on blood_requests
  for insert to authenticated
  with check (requester_id = auth.uid());
create policy "blood_requests_update" on blood_requests
  for update to authenticated
  using (requester_id = auth.uid() or has_role('super_admin'));

-- ── welfare ───────────────────────────────────────────────────────────────
create policy "welfare_items_select" on welfare_items
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));
create policy "welfare_items_write" on welfare_items
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

-- ── magazine ──────────────────────────────────────────────────────────────
create policy "magazine_issues_select" on magazine_issues
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));
create policy "magazine_issues_write" on magazine_issues
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

create policy "magazine_articles_select" on magazine_articles
  for select to authenticated
  using (
    status = 'published'
    or has_role('content_editor','super_admin')
    or exists (select 1 from magazine_issues mi where mi.id = issue_id and mi.created_by = auth.uid())
  );
create policy "magazine_articles_write" on magazine_articles
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

-- ── campus map & emergency contacts ──────────────────────────────────────
-- Reference info with no owner column; safe to read even before login.
create policy "map_locations_select" on map_locations
  for select to public using (true);
create policy "map_locations_write" on map_locations
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

create policy "emergency_contacts_select" on emergency_contacts
  for select to public using (true);
create policy "emergency_contacts_write" on emergency_contacts
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

-- ── notifications ─────────────────────────────────────────────────────────
-- Strictly private, and deliberately no insert policy: notifications are
-- meant to be written by trusted server-side code (e.g. the
-- send-notification edge function, using the service role key, which
-- bypasses RLS) — not by any signed-in client on another user's behalf.
create policy "notifications_select_own" on notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on notifications
  for update to authenticated using (user_id = auth.uid());

drop policy if exists "notification_preferences_own" on notification_preferences;
create policy "notification_preferences_own" on notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "device_tokens_own" on device_tokens;
create policy "device_tokens_own" on device_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── academics support tables (reports, maintainers, moderation log) ─────
create policy "academic_reports_select" on academic_reports
  for select to authenticated
  using (
    reported_by = auth.uid()
    or exists (
      select 1 from academic_materials m where m.id = material_id
        and is_academic_staff(m.department_id, m.semester_id, m.subject_id)
    )
  );
create policy "academic_reports_insert" on academic_reports
  for insert to authenticated
  with check (reported_by = auth.uid());
create policy "academic_reports_update" on academic_reports
  for update to authenticated
  using (exists (
    select 1 from academic_materials m where m.id = material_id
      and is_academic_staff(m.department_id, m.semester_id, m.subject_id)
  ));

-- Maintainer assignments are readable by anyone signed in (it's just
-- "who reviews this department/subject", not sensitive), but only
-- coordinators/admins can create or change assignments.
create policy "academic_maintainers_select" on academic_maintainers
  for select to authenticated using (true);
create policy "academic_maintainers_write" on academic_maintainers
  for all to authenticated
  using (has_role('academic_coordinator','super_admin'))
  with check (has_role('academic_coordinator','super_admin'));

create policy "academic_moderation_logs_select" on academic_moderation_logs
  for select to authenticated
  using (
    actor_id = auth.uid()
    or exists (
      select 1 from academic_materials m where m.id = material_id
        and is_academic_staff(m.department_id, m.semester_id, m.subject_id)
    )
  );
create policy "academic_moderation_logs_insert" on academic_moderation_logs
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from academic_materials m where m.id = material_id
        and is_academic_staff(m.department_id, m.semester_id, m.subject_id)
    )
  );

-- ── audit log ─────────────────────────────────────────────────────────────
-- Read-only from the client, and only for super_admin. No insert policy
-- on purpose: an audit trail that any authenticated user could write to
-- isn't trustworthy. Write it from trusted server-side code (service
-- role) instead.
create policy "audit_logs_select_admin" on audit_logs
  for select to authenticated
  using (has_role('super_admin'));
