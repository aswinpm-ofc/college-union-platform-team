-- Allow the admin console to manage roles without exposing general profile updates.
create or replace function public.set_profile_role(target_user_id uuid, target_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role('super_admin') then
    raise exception 'Only super_admin can change profile roles';
  end if;

  update public.profiles
  set role = target_role
  where id = target_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.set_profile_role(uuid, app_role) from public;
grant execute on function public.set_profile_role(uuid, app_role) to authenticated;
