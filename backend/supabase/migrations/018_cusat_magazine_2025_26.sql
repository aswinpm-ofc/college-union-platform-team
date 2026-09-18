-- Publish the current CUSAT magazine and keep its external reader URL.
alter table public.magazine_issues
  add column if not exists source_url text;

insert into public.magazine_issues (
  title,
  edition,
  description,
  published_at,
  source_url,
  status
)
select
  'CUSAT MAGAZINE 2025-26',
  '2025-26',
  'Current CUSAT magazine edition.',
  current_date,
  'https://online.fliphtml5.com/yzjbm/CUSAT-26-5-V7B7/#p=1',
  'published'
where not exists (
  select 1
  from public.magazine_issues
  where source_url = 'https://online.fliphtml5.com/yzjbm/CUSAT-26-5-V7B7/#p=1'
);
