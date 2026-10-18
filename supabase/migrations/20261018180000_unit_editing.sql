-- Instructors shape their own course: add, rename, reorder and delete units, and move a module
-- into the unit above or below. Functions run with the service role after the server's role check.

-- Swap a unit with its neighbor in the same course. p_direction is -1 (up) or 1 (down).
create function public.move_course_unit(p_unit_id uuid, p_direction integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_row public.course_units%rowtype;
  v_neighbor public.course_units%rowtype;
begin
  if p_direction not in (-1, 1) then
    raise exception 'direction must be -1 or 1';
  end if;

  select * into v_row from public.course_units where id = p_unit_id for update;
  if not found then
    raise exception 'No unit %', p_unit_id;
  end if;

  select * into v_neighbor from public.course_units
  where course_id = v_row.course_id
    and (case when p_direction = -1 then position < v_row.position else position > v_row.position end)
  order by (case when p_direction = -1 then -position else position end)
  limit 1
  for update;
  if not found then
    return;
  end if;

  set constraints public.course_units_position_unique deferred;
  update public.course_units set position = v_neighbor.position where id = v_row.id;
  update public.course_units set position = v_row.position where id = v_neighbor.id;
end;
$$;

-- Move a module placement into the previous unit (-1, to its end) or the next unit (1, to its
-- start), so the course order reads continuously across the boundary.
create function public.move_course_module_across_units(p_course_module_id uuid, p_direction integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_row public.course_modules%rowtype;
  v_unit public.course_units%rowtype;
  v_target public.course_units%rowtype;
begin
  if p_direction not in (-1, 1) then
    raise exception 'direction must be -1 or 1';
  end if;

  select * into v_row from public.course_modules where id = p_course_module_id for update;
  if not found then
    raise exception 'No module placement %', p_course_module_id;
  end if;
  select * into v_unit from public.course_units where id = v_row.unit_id;

  select * into v_target from public.course_units
  where course_id = v_unit.course_id
    and (case when p_direction = -1 then position < v_unit.position else position > v_unit.position end)
  order by (case when p_direction = -1 then -position else position end)
  limit 1
  for update;
  if not found then
    return;
  end if;

  if p_direction = -1 then
    update public.course_modules
    set unit_id = v_target.id,
        position = coalesce((select max(position) from public.course_modules where unit_id = v_target.id), 0) + 1
    where id = v_row.id;
  else
    set constraints public.course_modules_position_unique deferred;
    update public.course_modules set position = position + 1 where unit_id = v_target.id;
    update public.course_modules set unit_id = v_target.id, position = 1 where id = v_row.id;
  end if;
end;
$$;

-- Close the gap left by a deletion so positions stay contiguous (not required, keeps numbering tidy).
create function public.delete_empty_course_unit(p_unit_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_row public.course_units%rowtype;
begin
  select * into v_row from public.course_units where id = p_unit_id for update;
  if not found then
    return;
  end if;
  if exists (select 1 from public.course_modules where unit_id = p_unit_id) then
    raise exception 'Move or delete the modules in this unit first.';
  end if;
  delete from public.course_units where id = p_unit_id;
  set constraints public.course_units_position_unique deferred;
  update public.course_units set position = position - 1 where course_id = v_row.course_id and position > v_row.position;
end;
$$;

revoke all on function public.move_course_unit(uuid, integer) from public, anon, authenticated;
revoke all on function public.move_course_module_across_units(uuid, integer) from public, anon, authenticated;
revoke all on function public.delete_empty_course_unit(uuid) from public, anon, authenticated;
grant execute on function public.move_course_unit(uuid, integer) to service_role;
grant execute on function public.move_course_module_across_units(uuid, integer) to service_role;
grant execute on function public.delete_empty_course_unit(uuid) to service_role;
