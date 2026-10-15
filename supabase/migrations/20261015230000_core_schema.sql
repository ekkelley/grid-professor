-- Grid Professor: core content and course-organization schema (prototype slice of SPEC.md 0.3).
-- Content items, workbook builds, skill/topic vocabularies and tags, reusable modules,
-- and courses (templates and instructor sections) made of units and module placements.
-- No student data lives in this schema.

-- ---------------------------------------------------------------------------
-- Value lists
-- ---------------------------------------------------------------------------
create type public.item_kind as enum ('video', 'read', 'workbook', 'guide', 'file');
create type public.item_audience as enum ('student', 'instructor');
create type public.release_rule as enum ('immediate', 'after_due', 'after_unlock', 'after_run');
create type public.item_origin as enum ('primitive', 'derived');
create type public.item_status as enum ('active', 'retired');
create type public.owner_type as enum ('person', 'brand', 'not_established');
create type public.build_variant as enum ('training', 'competition');
create type public.build_status as enum ('current', 'retired');
create type public.skill_type as enum ('function', 'technique');
create type public.tag_basis as enum ('declared', 'observed', 'claimed');
create type public.course_kind as enum ('template', 'section');
create type public.library_section as enum ('explainer', 'function_guide', 'practice', 'game');

-- Official names: lowercase words joined by single hyphens; a double hyphen marks a derived item
-- (for example annuities-exercise-2--read).
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-{1,2}[a-z0-9]+)*$' and length(value) <= 120);

-- ---------------------------------------------------------------------------
-- Owners and items
-- ---------------------------------------------------------------------------
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  name text not null,
  type public.owner_type not null,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  kind public.item_kind not null,
  title text not null,
  summary text,
  audience public.item_audience not null default 'student',
  default_release public.release_rule not null default 'immediate',
  owner_id uuid not null references public.owners (id),
  rights jsonb not null default '{"channels": [], "restrictions": [], "note": null}'::jsonb,
  -- Where the file lives: a Vimeo link for a video, a storage location for a guide or file.
  -- Workbooks point to their builds instead (workbook_builds).
  stored_at text,
  -- Text kept in this system: the body of a reading or guide (Markdown).
  body_md text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  origin public.item_origin not null,
  derived_from uuid references public.items (id),
  source text not null,
  status public.item_status not null default 'active',
  created_at timestamptz not null default now(),
  constraint derived_has_source check ((origin = 'derived') = (derived_from is not null)),
  constraint workbook_not_stored_here check (kind <> 'workbook' or stored_at is null)
);
create index items_kind_idx on public.items (kind);
create index items_derived_from_idx on public.items (derived_from);

-- A workbook's files live on David's add-in. Each build is one file there.
create table public.workbook_builds (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  variant public.build_variant not null,
  addin_ref text not null,
  -- How a student opens this build today. Replaced by the add-in API when it exists.
  open_url text,
  status public.build_status not null default 'current',
  created_at timestamptz not null default now()
);
create unique index workbook_builds_one_current_per_variant
  on public.workbook_builds (item_id, variant) where status = 'current';

-- ---------------------------------------------------------------------------
-- Vocabularies and tags
-- ---------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  name text not null,
  type public.skill_type not null
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  name text not null
);

create table public.item_skills (
  item_id uuid not null references public.items (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  basis public.tag_basis not null,
  primary key (item_id, skill_id, basis)
);
create index item_skills_skill_idx on public.item_skills (skill_id);

create table public.item_topics (
  item_id uuid not null references public.items (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  basis public.tag_basis not null,
  primary key (item_id, topic_id, basis)
);
create index item_topics_topic_idx on public.item_topics (topic_id);

-- ---------------------------------------------------------------------------
-- Modules: reusable containers of ordered slots. Items in one slot are substitutes
-- (a video and its reading): completing either satisfies the slot.
-- ---------------------------------------------------------------------------
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  title text not null,
  summary text
);

create table public.module_slots (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  position integer not null check (position > 0),
  constraint module_slots_position_unique unique (module_id, position) deferrable initially immediate
);

create table public.slot_items (
  slot_id uuid not null references public.module_slots (id) on delete cascade,
  item_id uuid not null references public.items (id),
  position integer not null default 1,
  primary key (slot_id, item_id)
);
create index slot_items_item_idx on public.slot_items (item_id);

-- ---------------------------------------------------------------------------
-- Courses: course > unit > module placement. A template is copied into an
-- instructor's section; the section then changes its own copy only.
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  title text not null,
  summary text,
  kind public.course_kind not null,
  source_course_id uuid references public.courses (id),
  created_at timestamptz not null default now(),
  constraint section_has_template check ((kind = 'section') = (source_course_id is not null))
);

create table public.course_units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug public.slug not null,
  title text not null,
  summary text,
  position integer not null check (position > 0),
  constraint course_units_slug_unique unique (course_id, slug),
  constraint course_units_position_unique unique (course_id, position) deferrable initially immediate
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.course_units (id) on delete cascade,
  module_id uuid not null references public.modules (id),
  position integer not null check (position > 0),
  is_hidden boolean not null default false,
  title_override text,
  opens_on date,
  constraint course_modules_module_unique unique (unit_id, module_id),
  constraint course_modules_position_unique unique (unit_id, position) deferrable initially immediate
);
create index course_modules_module_idx on public.course_modules (module_id);

-- Help library: items a course offers outside its path, by section.
create table public.course_library (
  course_id uuid not null references public.courses (id) on delete cascade,
  item_id uuid not null references public.items (id),
  section public.library_section not null,
  position integer not null check (position > 0),
  primary key (course_id, item_id, section)
);

-- ---------------------------------------------------------------------------
-- Course operations, run on the server only (service role).
-- ---------------------------------------------------------------------------

-- Copy a template into a new instructor section. Returns the new course's slug.
create function public.create_section_from_template(p_template_slug text, p_title text)
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

-- Swap a module placement with its neighbor in the same unit. p_direction is -1 (up) or 1 (down).
create function public.move_course_module(p_course_module_id uuid, p_direction integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_row public.course_modules%rowtype;
  v_neighbor public.course_modules%rowtype;
begin
  if p_direction not in (-1, 1) then
    raise exception 'direction must be -1 or 1';
  end if;

  select * into v_row from public.course_modules where id = p_course_module_id for update;
  if not found then
    raise exception 'No module placement %', p_course_module_id;
  end if;

  select * into v_neighbor from public.course_modules
  where unit_id = v_row.unit_id
    and (case when p_direction = -1 then position < v_row.position else position > v_row.position end)
  order by (case when p_direction = -1 then -position else position end)
  limit 1
  for update;
  if not found then
    return;
  end if;

  set constraints public.course_modules_position_unique deferred;
  update public.course_modules set position = v_neighbor.position where id = v_row.id;
  update public.course_modules set position = v_row.position where id = v_neighbor.id;
end;
$$;

revoke all on function public.create_section_from_template(text, text) from public, anon, authenticated;
revoke all on function public.move_course_module(uuid, integer) from public, anon, authenticated;
grant execute on function public.create_section_from_template(text, text) to service_role;
grant execute on function public.move_course_module(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Access. Row-level security on every table. Content is readable by anyone;
-- every write goes through the server with the service role, after the server
-- checks the caller's role. Real per-user policies arrive with the identity section.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'owners', 'items', 'workbook_builds', 'skills', 'topics', 'item_skills', 'item_topics',
    'modules', 'module_slots', 'slot_items', 'courses', 'course_units', 'course_modules', 'course_library'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy "content is readable" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end;
$$;
