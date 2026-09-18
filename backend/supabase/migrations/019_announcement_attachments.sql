-- Allow announcements to include an optional image or PDF attachment.
alter table public.announcements
  add column if not exists attachment_url text,
  add column if not exists attachment_type text,
  add column if not exists attachment_name text;

insert into storage.buckets (id, name, public)
values ('announcement-attachments', 'announcement-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "announcement_attachments_read" on storage.objects;
drop policy if exists "announcement_attachments_write" on storage.objects;
drop policy if exists "announcement_attachments_delete" on storage.objects;

create policy "announcement_attachments_read" on storage.objects
  for select using (bucket_id = 'announcement-attachments');
create policy "announcement_attachments_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'announcement-attachments' and has_role('content_editor','super_admin'));
create policy "announcement_attachments_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'announcement-attachments' and has_role('content_editor','super_admin'));
