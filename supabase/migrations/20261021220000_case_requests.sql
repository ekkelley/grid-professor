-- Case requests (Eric, 2026-10-21). An instructor describes the competition case they want (a
-- story, a data set, a map, an example case, any combination) and sets the structural dials
-- (division, how levels chain, how big each step is). The platform turns the answers into a
-- Markdown case brief, the input the case-builder process consumes (case-builder/kit/09). Files
-- the instructor refers to (data, maps, example cases) are attached to the request.
--
-- Requests are instructor material, not student data: the requester and admins can read a
-- request; everything is written by the server after a role check.

create type public.case_request_status as enum ('draft', 'submitted', 'in_progress', 'delivered', 'declined');
create type public.case_request_file_kind as enum ('data', 'map', 'example_case', 'other');

create table public.case_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  status public.case_request_status not null default 'draft',
  -- The form's answers, as submitted. The brief is rendered from these; they are kept so the
  -- form can be reopened and so later tools can read the choices without parsing Markdown.
  params jsonb not null default '{}'::jsonb,
  -- The rendered case brief (Markdown), regenerated on every save.
  brief_md text not null default '',
  -- Admin notes back to the requester (what was built, what was changed, why).
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index case_requests_requester_idx on public.case_requests (requester_id, updated_at desc);

create table public.case_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.case_requests (id) on delete cascade,
  kind public.case_request_file_kind not null default 'other',
  file_name text not null,
  file_path text not null unique,
  size_bytes bigint not null check (size_bytes >= 0),
  note text,
  created_at timestamptz not null default now()
);
create index case_request_files_request_idx on public.case_request_files (request_id, created_at);

-- Is the signed-in person an admin? Security definer so policies can ask without re-entering
-- row-level security on profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

alter table public.case_requests enable row level security;
grant select on public.case_requests to authenticated;
grant all on public.case_requests to service_role;
create policy "own case requests" on public.case_requests for select to authenticated using (requester_id = (select auth.uid()));
create policy "admins see every case request" on public.case_requests for select to authenticated using (public.is_admin());

alter table public.case_request_files enable row level security;
grant select on public.case_request_files to authenticated;
grant all on public.case_request_files to service_role;
create policy "own case request files" on public.case_request_files for select to authenticated
  using (exists (select 1 from public.case_requests r where r.id = request_id and r.requester_id = (select auth.uid())));
create policy "admins see every case request file" on public.case_request_files for select to authenticated using (public.is_admin());

-- Attachments live in a private bucket read and written only by the service role, served by the
-- platform's own download route after an access check (same pattern as the workbooks bucket).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('case-requests', 'case-requests', false, 20971520)
    on conflict (id) do nothing;
  end if;
end;
$$;
