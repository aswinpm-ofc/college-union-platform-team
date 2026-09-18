-- Student blood donor preferences and matching data.
alter table public.profiles
  add column if not exists willing_to_donate boolean not null default false,
  add column if not exists blood_group text,
  add column if not exists last_donation_date date;

alter table public.blood_requests
  add column if not exists contact_phone text,
  add column if not exists notes text;

grant select, update on public.profiles to authenticated;
grant insert, select, update on public.blood_requests to authenticated;

-- Keep profile self-edit permissions limited to personal and donor fields.
revoke update on public.profiles from authenticated;
grant update (full_name, student_id, department_id, semester, phone, willing_to_donate, blood_group, last_donation_date) on public.profiles to authenticated;

create or replace function public.find_compatible_donors(requested_blood_group text)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  blood_group text,
  last_donation_date date,
  department_id uuid,
  semester integer
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.phone, p.blood_group,
         p.last_donation_date, p.department_id, p.semester
  from public.profiles p
  where p.status = 'active'
    and p.willing_to_donate = true
    and p.blood_group is not null
    and (p.last_donation_date is null or p.last_donation_date <= current_date - 90)
    and (
      p.blood_group = 'O-'
      or (p.blood_group = 'O+' and requested_blood_group in ('O+','A+','B+','AB+'))
      or (p.blood_group = 'A-' and requested_blood_group in ('A-','A+','AB-','AB+'))
      or (p.blood_group = 'A+' and requested_blood_group in ('A+','AB+'))
      or (p.blood_group = 'B-' and requested_blood_group in ('B-','B+','AB-','AB+'))
      or (p.blood_group = 'B+' and requested_blood_group in ('B+','AB+'))
      or (p.blood_group = 'AB-' and requested_blood_group in ('AB-','AB+'))
      or (p.blood_group = 'AB+' and requested_blood_group = 'AB+')
    )
  order by p.last_donation_date nulls first, p.full_name;
$$;

revoke all on function public.find_compatible_donors(text) from public;
grant execute on function public.find_compatible_donors(text) to authenticated;
