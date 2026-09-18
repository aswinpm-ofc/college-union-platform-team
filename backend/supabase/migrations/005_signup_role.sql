-- 005_signup_role.sql
-- Allow the signup form to persist the role selected by the user.
-- The value is constrained to the application's known app_role enum values.
-- For a production deployment, privileged roles should additionally be gated
-- by an invite/approval flow rather than being freely self-selectable.

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
  v_role app_role;
begin
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

  -- Only accept values that are actually part of app_role. Unknown or
  -- malformed metadata safely falls back to student.
  begin
    v_role := coalesce(nullif(new.raw_user_meta_data->>'role', '')::app_role, 'student'::app_role);
  exception when others then
    v_role := 'student'::app_role;
  end;

  begin
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, v_student_id, new.email, v_department_id, v_semester, v_role)
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, null, new.email, v_department_id, v_semester, v_role)
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
