-- 006_fix_signup_profile_persistence.sql
-- Finalizes Auth -> profiles synchronization. All signup metadata is copied
-- into public.profiles when auth.users is created, including the selected role.

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

  begin
    v_role := coalesce(nullif(new.raw_user_meta_data->>'role', '')::app_role, 'student'::app_role);
  exception when others then
    v_role := 'student'::app_role;
  end;

  -- First attempt saves every submitted profile field.
  begin
    insert into public.profiles (id, full_name, student_id, email, department_id, semester, role)
    values (new.id, v_full_name, v_student_id, new.email, v_department_id, v_semester, v_role)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      department_id = excluded.department_id,
      semester = excluded.semester,
      role = excluded.role,
      student_id = excluded.student_id;
  exception when unique_violation then
    -- A duplicate student ID must not prevent account creation. Save the
    -- rest of the profile and leave student_id empty for later editing.
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
for each row execute function public.handle_new_user();

-- Ensure the function can insert despite profiles RLS.
revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to postgres, service_role;
