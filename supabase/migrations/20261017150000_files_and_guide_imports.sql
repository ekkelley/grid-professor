-- Deeper integration (Eric, 2026-10-17): students download workbooks from this platform and read
-- guides here, instead of being sent to app.gridprof.com.
--
-- 1. A workbook build can carry its student-version file. The file lives in a private storage
--    bucket and is served by the platform's own download route, which is the single seam: today the
--    route reads the bucket; when David's API exists it fetches from there instead.
alter table public.workbook_builds
  add column file_path text,
  add column file_name text,
  add column file_attached_at timestamptz,
  add constraint workbook_builds_file_complete check ((file_path is null) = (file_name is null));

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('workbooks', 'workbooks', false, 20971520)
    on conflict (id) do nothing;
    -- No storage policies: nothing but the service role reads or writes this bucket.
  end if;
end;
$$;

-- 2. Guides live here as Markdown. David's skill guides are imported from his public pages through
--    the platform (admin action), stored as guide items derived from the workbook they explain, with
--    the source URL kept in stored_at. The five link-only stubs from 2026-10-17 are removed.
delete from public.course_library where item_id in (select id from public.items where kind = 'guide' and stored_at like 'https://app.gridprof.com/%');
delete from public.items where kind = 'guide' and stored_at like 'https://app.gridprof.com/%';

-- 3. Skills the course guides cover that had no row yet.
insert into public.skills (slug, name, type) values ('fv', 'FV', 'function'), ('rate', 'RATE', 'function'), ('npv', 'NPV', 'function');
