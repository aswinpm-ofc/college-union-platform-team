-- 007_profiles_phone_column.sql
--
-- The profile page lets a student edit a phone number, but no column
-- existed for it on profiles and it wasn't part of the authenticated
-- column grant from 004, so any save that included it would fail.
-- (Originally drafted as 005, renumbered to 007 — 005/006 were taken in
-- the meantime by the signup/role work.)

alter table profiles add column if not exists phone text;

-- Additive: 004 already granted update on full_name/student_id/
-- department_id/semester; this adds phone to that same set rather than
-- reissuing the whole grant list.
grant update (phone) on profiles to authenticated;
