-- Instructors can put a line of text between modules ("Do these three before Thursday"). A note
-- is a row in the same ordered list as module placements, so it moves, hides and copies like one.
alter table public.course_modules alter column module_id drop not null;
alter table public.course_modules add column note text;
alter table public.course_modules add constraint course_modules_module_or_note
  check ((module_id is null) <> (note is null));

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

    insert into public.course_modules (unit_id, module_id, position, is_hidden, title_override, opens_on, note)
    select v_new_unit_id, module_id, position, is_hidden, title_override, opens_on, note
    from public.course_modules where unit_id = v_unit.id;
  end loop;

  insert into public.course_library (course_id, item_id, section, position)
  select v_new_id, item_id, section, position from public.course_library where course_id = v_template.id;

  return v_slug;
end;
$$;
