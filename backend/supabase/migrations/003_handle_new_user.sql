-- 003_handle_new_user.sql
--
-- Every table's RLS policies (002, 004) key off profiles existing for the
-- signed-in user. Without this trigger, a fresh Supabase Auth sign-up
-- creates a row in auth.users but nothing in public.profiles, so the new
-- user would fail every policy check (has_role/is_academic_staff would
-- find no profile row and quietly deny everything). This trigger keeps
-- the two in sync automatically.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_department_id uuid;
  v_semester int;
  v_full_name text;
  v_student_id text;
begin
  -- Metadata comes from supabase.auth.signUp(..., { options: { data } }).
  -- Cast defensively: this trigger must never block a sign-up because a
  -- client sent an odd value.
  begin
    v_department_id := nullif(new.raw_user_meta_data->>'department_id', '')::uuid;
  exception when others then
    v_department_id := null;
  end;

  begin
    v_semester := nullif(new.raw_user_meta_data->>'semester', '')::int;
  exception when others then
    v_semester := null;
  end;

  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1));
  v_student_id := nullif(new.raw_user_meta_data->>'student_id', '');

  -- role is always 'student' here — granting academic_maintainer,
  -- academic_coordinator, grievance_officer, content_editor or
  -- super_admin is an admin action (update profiles.role directly), not
  -- something a public sign-up form can request for itself.
  begin
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, v_student_id, new.email, v_department_id, v_semester, 'student')
    on conflict (id) do nothing;
  exception when unique_violation then
    -- Someone else already used that student_id. Don't fail the sign-up
    -- over it — create the profile without it; they can fix it later
    -- from their profile page.
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, null, new.email, v_department_id, v_semester, 'student')
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Safe public profile lookup ───────────────────────────────────────────
-- profiles' own RLS (004) only lets someone read their own row, so
-- anything that wants to show "posted by <name>" elsewhere (events,
-- grievances, announcements...) needs a narrower, non-sensitive view. A
-- plain view owned by the migration role runs with that owner's
-- privileges in Postgres (pre-15 view semantics), which is what lets it
-- see every row despite profiles' RLS, while only ever exposing name and
-- role — never email or student_id.
create or replace view public_profiles as
  select id, full_name, role from profiles;

grant select on public_profiles to authenticated;
