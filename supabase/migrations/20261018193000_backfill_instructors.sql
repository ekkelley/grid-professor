-- Sections made before membership existed have no instructor. They were all made by the admin
-- (ekk@utk.edu), so he becomes their instructor; nothing happens if that profile doesn't exist yet.
insert into public.course_members (course_id, user_id, role)
select c.id, p.user_id, 'instructor'
from public.courses c
cross join public.profiles p
where c.kind = 'section'
  and p.email = 'ekk@utk.edu'
  and not exists (select 1 from public.course_members m where m.course_id = c.id and m.role = 'instructor')
on conflict (course_id, user_id) do nothing;
