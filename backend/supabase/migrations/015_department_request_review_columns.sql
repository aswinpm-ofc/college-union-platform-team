-- Keep deployed databases compatible with the department approval workflow.
alter table public.department_requests
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_department_requests_reviewed_by
  on public.department_requests(reviewed_by);
