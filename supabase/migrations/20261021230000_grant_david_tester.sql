-- David Brown's test account is an instructor (Eric, 2026-10-21). The grant sets the role on
-- first sign-in; the update covers the case where the address has already signed in as a student.
insert into public.role_grants (email, role, note)
values ('gridproftester1@gmail.com', 'instructor', 'David Brown, test account')
on conflict (email) do update set role = excluded.role, note = excluded.note;

update public.profiles set role = 'instructor'
where lower(email) = 'gridproftester1@gmail.com' and role = 'student';
