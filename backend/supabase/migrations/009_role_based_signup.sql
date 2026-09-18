-- 009_role_based_signup.sql
--
-- Signup can now choose an application role. The role is validated against
-- the database enum and copied from auth.users.raw_user_meta_data.
-- NOTE: For a public production deployment, remove super_admin from the
-- signup UI and/or replace this with an invitation/approval flow.

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
  v_role app_role := 'student'::app_role;
begin
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
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

  begin
    v_role := (nullif(trim(new.raw_user_meta_data->>'role'), ''))::app_role;
  exception when invalid_text_representation then
    v_role := 'student'::app_role;
  end;

  begin
    insert into public.profiles (
      id, full_name, student_id, email, department_id, semester, role
    )
    values (
      new.id, v_full_name, v_student_id, new.email,
      v_department_id, v_semester, v_role
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      department_id = excluded.department_id,
      semester = excluded.semester,
      student_id = excluded.student_id,
      role = excluded.role;
  exception when unique_violation then
    -- student_id is unique. If it is already used, preserve the account
    -- and create the profile without the duplicate student ID.
    insert into public.profiles (
      id, full_name, student_id, email, department_id, semester, role
    )
    values (
      new.id, v_full_name, null, new.email,
      v_department_id, v_semester, v_role
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      department_id = excluded.department_id,
      semester = excluded.semester,
      role = excluded.role;
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
