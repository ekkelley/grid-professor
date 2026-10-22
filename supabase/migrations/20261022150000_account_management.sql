-- Account management (Eric, 2026-10-22): an admin page that lists every account, adds one, and
-- moves it between student, instructor and admin. Until now a role change was a migration (see
-- 20261021230000_grant_david_tester.sql); from here it is a row edit from /admin/users.
--
-- Adding an account works like the FinTech portal's organizers allowlist: the admin writes a
-- role_grants row (email, name, role) and the person gets that role the first time they sign in.
-- Changing an existing account edits profiles directly.
--
-- How admin status is decided does not change. Before and after, it is profiles.role = 'admin':
-- getViewer() reads it for the app and is_admin() reads it for policies. role_grants keeps its one
-- job, the role an email gets when its auth user is first created; after that only profiles counts.

-- A display name on both tables: typed by the admin on the grant, carried onto the profile at
-- first sign-in, or taken from the sign-in provider (Google, Microsoft) when the grant has none.
alter table public.role_grants add column name text;
alter table public.profiles add column name text;

-- New auth users take their role and name from the grant, and their name from the provider when
-- the grant has none (email-code sign-ins have no provider name).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grant public.role_grants%rowtype;
begin
  select * into v_grant from public.role_grants g where g.email = lower(coalesce(new.email, ''));
  insert into public.profiles (user_id, email, role, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(v_grant.role, 'student'),
    coalesce(
      nullif(trim(coalesce(v_grant.name, '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '')
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Names for accounts that already exist, from what the provider sent at sign-in.
do $$
begin
  if to_regclass('auth.users') is not null then
    update public.profiles p
    set name = coalesce(
      nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
      nullif(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), '')
    )
    from auth.users u
    where u.id = p.user_id and p.name is null;
  end if;
end;
$$;

-- Nobody loses access on deploy: any grant higher than the profile's current role is applied now.
-- This covers an address granted after it had already signed in. user_role compares in declaration
-- order (student < instructor < admin), so this only ever raises a role.
update public.profiles p
set role = g.role
from public.role_grants g
where g.email = lower(p.email) and p.role < g.role;

-- Admins read every profile; everyone else still reads only their own. Writes stay with the
-- service role, behind the admin check in the Server Actions.
create policy "admins see every profile" on public.profiles for select to authenticated using (public.is_admin());
