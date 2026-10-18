-- Membership: who is in which course. A section gets a join code; students enter it once. The
-- instructor who makes a section is its first member. Rosters and class views build on this.

create type public.course_role as enum ('student', 'instructor');

-- Join codes live in their own table so they are never readable from the browser: no grants to
-- anon or authenticated; the server reads and matches them with the service role.
create table public.course_join_codes (
  course_id uuid primary key references public.courses (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);

-- Six characters from an alphabet without look-alikes (no 0/O, 1/I/L).
create function public.new_join_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.course_join_codes where code = v_code);
  end loop;
  return v_code;
end;
$$;

insert into public.course_join_codes (course_id, code)
select id, public.new_join_code() from public.courses where kind = 'section';

create table public.course_members (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role public.course_role not null default 'student',
  joined_at timestamptz not null default now(),
  primary key (course_id, user_id)
);
create index course_members_user_idx on public.course_members (user_id);

-- Sections now get a join code at birth.
create or replace function public.create_section_from_template(p_template_slug text, p_title text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_template public.courses%rowtype;
  v_new_id uuid;
  v_slug text;
  v_unit record;
  v_new_unit_id uuid;
begin
  select * into v_template from public.courses where slug = p_template_slug and kind = 'template';
  if not found then
    raise exception 'No template course with slug %', p_template_slug;
  end if;

  v_slug := v_template.slug || '--' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.courses (slug, title, summary, kind, source_course_id)
  values (v_slug, coalesce(nullif(trim(p_title), ''), v_template.title), v_template.summary, 'section', v_template.id)
  returning id into v_new_id;
  insert into public.course_join_codes (course_id, code) values (v_new_id, public.new_join_code());

  for v_unit in select * from public.course_units where course_id = v_template.id order by position loop
    insert into public.course_units (course_id, slug, title, summary, position)
    values (v_new_id, v_unit.slug, v_unit.title, v_unit.summary, v_unit.position)
    returning id into v_new_unit_id;

    insert into public.course_modules (unit_id, module_id, position, is_hidden, title_override, opens_on)
    select v_new_unit_id, module_id, position, is_hidden, title_override, opens_on
    from public.course_modules where unit_id = v_unit.id;
  end loop;

  insert into public.course_library (course_id, item_id, section, position)
  select v_new_id, item_id, section, position from public.course_library where course_id = v_template.id;

  return v_slug;
end;
$$;

-- Does the signed-in person teach this course? Security definer so the roster policy below can
-- ask without re-entering row-level security on the same table.
create function public.is_course_instructor(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.course_members
    where course_id = p_course_id and user_id = (select auth.uid()) and role = 'instructor'
  );
$$;

-- Access. A signed-in person reads their own memberships; instructors of a course read its roster.
-- Join codes: no browser access at all. All writes go through the server.
alter table public.course_join_codes enable row level security;
grant all on public.course_join_codes to service_role;

alter table public.course_members enable row level security;
grant select on public.course_members to authenticated;
grant all on public.course_members to service_role;
create policy "own memberships" on public.course_members for select to authenticated using (user_id = (select auth.uid()));
create policy "instructors see their roster" on public.course_members for select to authenticated using (public.is_course_instructor(course_id));

revoke all on function public.new_join_code() from public, anon, authenticated;
grant execute on function public.new_join_code() to service_role;
revoke all on function public.is_course_instructor(uuid) from public, anon;
grant execute on function public.is_course_instructor(uuid) to authenticated, service_role;
