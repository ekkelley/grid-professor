# Grid Professor

The content system for Grid Professor: courses, modules, videos, readings and the help library,
with David Brown's Excel add-in as the grader. Design lives in the project folder
(`OpenLane\Grid Professor`: SPEC.md, DECISIONS.md); this repo is the code.

**Status: prototype.** Two excel-for-finance chapters (Discounting, Annuities) as a template course,
instructor copies, and a help library. Sign-in is a role switcher; workbooks open by link until the
add-in's API exists.

## Stack

Next.js 16 (App Router, Cache Components), TypeScript, Tailwind v4, Supabase (Postgres, RLS) via
`@supabase/ssr`, hosted on Vercel.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase keys.
3. `npm run dev`

## Database

- Schema and content are migrations in `supabase/migrations/`. Supabase's GitHub integration applies
  them when they land on `main`.
- Every table has row-level security. Content is readable by anyone; all writes go through Server
  Actions with the secret key after a role check (`src/app/actions.ts`).
- `src/lib/database.types.ts` is generated: `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`.
- The content migration is generated, not hand-written: `python3 scripts/generate-content-migration.py <prototype-inputs dir>`.
  Its inputs (the MyRumbo export and descriptors) stay in the project folder, not here.

## Routes

| Route | What it is |
|---|---|
| `/` | Courses, and template courses with "Use this template" |
| `/courses/[slug]` | The path: units and their modules |
| `/courses/[slug]/modules/[module]` | A module: video, reading, workbook |
| `/courses/[slug]/library` | Help outside the path: concept videos, function guides, practice files, games |
| `/courses/[slug]/grades` | Placeholder until the add-in API exists |
| `/courses/[slug]/edit` | Instructor: reorder, hide and date modules in their own copy |
