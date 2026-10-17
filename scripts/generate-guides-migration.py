"""Emit SQL that loads the course's own function guides from content/guides/*.md.

Each file has a small front matter block (slug, title, summary, skills, topics) and a Markdown body.
Re-run after editing a guide and put the output in a new migration; existing rows are updated by slug.

Usage: python3 scripts/generate-guides-migration.py > supabase/migrations/<ts>_course_guides.sql
"""

import re
import sys
from pathlib import Path

GUIDES = Path(__file__).resolve().parent.parent / "content" / "guides"
OWNER = "(select id from public.owners where slug = 'eric-kelley')"
SOURCE = "hand-authored draft, 2026-10-17; review before release"


def q(v):
    return "'" + str(v).replace("'", "''") + "'"


def parse(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        sys.exit("front matter missing")
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(":")
        value = value.strip()
        if value.startswith("["):
            meta[key.strip()] = [v.strip() for v in value.strip("[]").split(",") if v.strip()]
        else:
            meta[key.strip()] = value
    return meta, m.group(2).strip()


def main():
    out = []
    w = out.append
    w("-- Course function guides, generated from content/guides/*.md by scripts/generate-guides-migration.py.")
    w("")
    for path in sorted(GUIDES.glob("*.md")):
        meta, body = parse(path.read_text(encoding="utf-8"))
        slug = meta["slug"]
        w(f"-- {slug}")
        w(
            "insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values "
            f"({q(slug)}, 'guide', {q(meta['title'])}, {q(meta['summary'])}, {OWNER}, {q(body)}, 'primitive', {q(SOURCE)}) "
            "on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;"
        )
        item = f"(select id from public.items where kind = 'guide' and slug = {q(slug)})"
        w(f"delete from public.item_skills where item_id = {item}; delete from public.item_topics where item_id = {item};")
        for s in meta.get("skills", []):
            w(f"insert into public.item_skills (item_id, skill_id, basis) values ({item}, (select id from public.skills where slug = {q(s)}), 'declared');")
        for t in meta.get("topics", []):
            w(f"insert into public.item_topics (item_id, topic_id, basis) values ({item}, (select id from public.topics where slug = {q(t)}), 'declared');")
        w("")
    print("\n".join(out))


if __name__ == "__main__":
    main()
