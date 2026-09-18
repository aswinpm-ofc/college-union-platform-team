-- 008_signup_role_hardening.sql
--
-- 005/006 let a self-signup request set its own role via signup metadata,
-- and the signup form (frontend) offered every role in a public dropdown,
-- including super_admin — anyone who found the signup page could make
-- themselves an admin. This migration makes the trigger stop trusting
-- role from signup metadata entirely: every self-signup becomes
-- 'student', matching profiles.role's own default.
--
-- Promoting an account to a staff/admin role is not done through signup
-- at all — for now that's a manual step by whoever already has dashboard
-- access, e.g.:
--   update profiles set role = 'academic_maintainer' where email = '...';
-- A proper admin-invite flow can replace this later.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_department_id uuid := null;
  v_semester int := null;
  v_full_name text;
  v_student_id text;
begin
  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1));
  v_student_id := nullif(trim(new.raw_user_meta_data->>'student_id'), '');

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

  -- Role is never read from signup metadata. Every self-signup is a
  -- 'student'; profiles.role's own default would do this anyway, but
  -- setting it explicitly keeps the intent obvious here.
  begin
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, v_student_id, new.email, v_department_id, v_semester, 'student'::app_role)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      department_id = excluded.department_id,
      semester = excluded.semester,
      student_id = excluded.student_id;
      -- role is intentionally NOT in this SET list: if this ever fires
      -- again for an id that was since promoted by an admin, a repeat
      -- signup attempt must not silently demote them back to student.
  exception when unique_violation then
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, null, new.email, v_department_id, v_semester, 'student'::app_role)
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to postgres, service_role;
