-- Identity (SPEC section 10, first slice) and the first performance fact recorded by the content
-- system: video watched (SPEC section 8). Eric, 2026-10-17: track a student's viewing of each video
-- and turn the share watched into a grade; across repeat viewings keep the best.
--
-- Sign-in is Supabase Auth with a one-time email code; Google and Microsoft can be added as
-- providers later without changing anything here. A student's key everywhere is the auth user id
-- (a UUID), never an email.

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'instructor', 'admin');

-- Who gets a role other than student when they first sign in, by email (lowercased).
create table public.role_grants (
  email text primary key check (email = lower(email)),
  role public.user_role not null,
  note text
);
insert into public.role_grants (email, role, note) values
  ('ekk@utk.edu', 'admin', 'Eric Kelley'),
  ('dcbrown@arizona.edu', 'instructor', 'David Brown');

create table public.profiles (
  user_id uuid primary key,
  email text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((select g.role from public.role_grants g where g.email = lower(coalesce(new.email, ''))), 'student')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

do $$
begin
  if to_regclass('auth.users') is not null then
    alter table public.profiles
      add constraint profiles_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Video watching: facts, then a rollup
-- ---------------------------------------------------------------------------

-- Append-only. One row per flush from the player: the stretches of the video that played during
-- that flush, as [start, end] pairs in seconds. Never updated.
create table public.video_watch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid not null references public.items (id),
  -- One id per page load, so repeat viewings can be told apart.
  session_id text not null,
  duration_seconds numeric(9, 2) not null check (duration_seconds > 0),
  intervals jsonb not null,
  recorded_at timestamptz not null default now()
);
create index video_watch_events_user_item_idx on public.video_watch_events (user_id, item_id, recorded_at);

-- Derived from the events: the union of everything this student has played, and the best single
-- viewing. percent is the share of the video's running time that has ever played (0 to 100).
create table public.video_progress (
  user_id uuid not null,
  item_id uuid not null references public.items (id),
  duration_seconds numeric(9, 2) not null,
  intervals jsonb not null,
  watched_seconds numeric(9, 2) not null,
  percent numeric(5, 2) not null check (percent between 0 and 100),
  best_session_percent numeric(5, 2) not null check (best_session_percent between 0 and 100),
  first_watched_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

do $$
begin
  if to_regclass('auth.users') is not null then
    alter table public.video_watch_events
      add constraint video_watch_events_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
    alter table public.video_progress
      add constraint video_progress_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access. A signed-in person reads only their own rows. All writes go through the server.
-- ---------------------------------------------------------------------------
alter table public.role_grants enable row level security;
grant all on public.role_grants to service_role;

alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy "own profile" on public.profiles for select to authenticated using (user_id = (select auth.uid()));

alter table public.video_watch_events enable row level security;
grant select on public.video_watch_events to authenticated;
grant all on public.video_watch_events to service_role;
create policy "own watch events" on public.video_watch_events for select to authenticated using (user_id = (select auth.uid()));

alter table public.video_progress enable row level security;
grant select on public.video_progress to authenticated;
grant all on public.video_progress to service_role;
create policy "own progress" on public.video_progress for select to authenticated using (user_id = (select auth.uid()));
