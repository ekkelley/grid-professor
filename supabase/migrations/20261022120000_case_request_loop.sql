-- Closing the loop on case requests (Eric, 2026-10-22): the builder's guidance goes into the brief,
-- the finished files come back to the requester through the platform, both sides talk in a thread,
-- and a request has a deployed state once the case is registered in the add-in.

alter type public.case_request_status add value if not exists 'deployed';
alter type public.case_request_file_kind add value if not exists 'deliverable';

alter table public.case_requests
  add column builder_notes text,
  add column assignment_link text,
  add column delivered_at timestamptz,
  add column deployed_at timestamptz;

create type public.case_request_event_kind as enum ('message', 'status');

-- The thread: messages from either side, and status changes as system entries.
create table public.case_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.case_requests (id) on delete cascade,
  author_id uuid references public.profiles (user_id) on delete set null,
  kind public.case_request_event_kind not null default 'message',
  body text not null check (length(body) between 1 and 4000),
  status public.case_request_status,
  created_at timestamptz not null default now(),
  constraint status_event_has_status check ((kind = 'status') = (status is not null))
);
create index case_request_events_request_idx on public.case_request_events (request_id, created_at);

alter table public.case_request_events enable row level security;
grant select on public.case_request_events to authenticated;
grant all on public.case_request_events to service_role;
create policy "own case request events" on public.case_request_events for select to authenticated
  using (exists (select 1 from public.case_requests r where r.id = request_id and r.requester_id = (select auth.uid())));
create policy "admins see every case request event" on public.case_request_events for select to authenticated using (public.is_admin());

-- Notes the admin had already written become the first message in each thread.
insert into public.case_request_events (request_id, author_id, kind, body, created_at)
select r.id, p.user_id, 'message', r.admin_notes, r.updated_at
from public.case_requests r
left join public.profiles p on p.email = 'ekk@utk.edu'
where r.admin_notes is not null and length(trim(r.admin_notes)) > 0;
