-- Eric gave the address as gridproftester1@gmai.com; the previous migration assumed gmail.com.
-- Grant both spellings so whichever David signs in with gets the instructor role.
insert into public.role_grants (email, role, note)
values ('gridproftester1@gmai.com', 'instructor', 'David Brown, test account (as given)')
on conflict (email) do update set role = excluded.role, note = excluded.note;

update public.profiles set role = 'instructor'
where lower(email) in ('gridproftester1@gmai.com', 'gridproftester1@gmail.com') and role = 'student';
