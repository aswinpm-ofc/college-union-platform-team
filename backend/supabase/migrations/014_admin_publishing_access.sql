-- Ensure staff can read active publishing records and authorized roles can manage them.
grant select on public.events, public.announcements to authenticated;
grant insert, update, delete on public.events, public.announcements to authenticated;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));

drop policy if exists "events_write" on public.events;
create policy "events_write" on public.events
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));

drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements
  for select to authenticated
  using (status = 'published' or created_by = auth.uid() or has_role('content_editor','super_admin'));

drop policy if exists "announcements_write" on public.announcements;
create policy "announcements_write" on public.announcements
  for all to authenticated
  using (has_role('content_editor','super_admin'))
  with check (has_role('content_editor','super_admin'));
