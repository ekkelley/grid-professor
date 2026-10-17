-- Changes prompted by David's prototype inventory (GRIDPROF-PROTOTYPE-INVENTORY-2026-10-15.md).
--
-- 1. Official names are unique per kind, not globally. An exercise's video, reading and workbook
--    share its name ("discounting-exercise-1"); the kind tells them apart. David proposed adopting
--    MyRumbo's slugs for his workbooks, which collide with the videos under global uniqueness.
--    Pending Eric's confirmation (DECISIONS 2026-10-17).
alter table public.items drop constraint items_slug_key;
alter table public.items add constraint items_kind_slug_key unique (kind, slug);

-- 2. Most of David's workbooks have one file, with practice as a run mode rather than a second build.
alter type public.build_variant add value if not exists 'single';

-- 3. Sequences: a workbook made of workbooks, served by the add-in in one sitting with one clock
--    (David's "timed pack"; its members are his one-tab "unit" workbooks). The add-in owns the list;
--    this mirrors it.
create table public.workbook_members (
  sequence_id uuid not null references public.items (id) on delete cascade,
  member_id uuid not null references public.items (id),
  position integer not null check (position > 0),
  primary key (sequence_id, member_id),
  constraint workbook_members_position_unique unique (sequence_id, position),
  constraint workbook_members_not_self check (sequence_id <> member_id)
);
create index workbook_members_member_idx on public.workbook_members (member_id);

-- Delivery facts about a workbook that students see before opening it: length, levels, difficulty
-- on the source's own scale. Free text until SPEC settles a common difficulty scale.
alter table public.items add column delivery_note text;

alter table public.workbook_members enable row level security;
grant select on public.workbook_members to anon, authenticated;
grant all on public.workbook_members to service_role;
create policy "content is readable" on public.workbook_members for select to anon, authenticated using (true);
