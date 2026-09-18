-- Publish ScholaRise in the student welfare scholarship hub.
insert into public.welfare_items (
  type,
  title,
  organization,
  description,
  eligibility,
  source_url,
  status
)
select
  'scholarship'::welfare_type,
  'ScholaRise: Gateway to Scholarships',
  'ScholaRise',
  'Explore scholarship opportunities and application guidance through ScholaRise.',
  'Check the current eligibility requirements on the ScholaRise website.',
  'https://scholarise.in/',
  'published'
where not exists (
  select 1
  from public.welfare_items
  where source_url = 'https://scholarise.in/'
);
