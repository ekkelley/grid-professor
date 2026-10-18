import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCoursePath, getModuleMedia, getModuleSkills, getMyVideoProgress, today, type Skill } from "@/lib/data";
import { buildRoadmap, summarize, type RoadmapRow } from "@/lib/roadmap";
import { canEditCourses, getViewer } from "@/lib/role";
import { Card, Note } from "@/components/ui";
import { ModuleNumber, ProgressRing, StatusMarker, statusText } from "@/components/roadmap";

type SkillRow = { skill: Skill; modules: RoadmapRow[]; done: number; countable: number };

async function ProgressContent({ params }: Pick<PageProps<"/courses/[slug]/progress">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Progress</h2>
        <p className="mt-2 max-w-prose text-muted">
          <Link href={`/sign-in?next=/courses/${course.slug}/progress`} className="font-medium text-green-strong hover:underline">
            Sign in
          </Link>{" "}
          to see which modules you&apos;ve finished and which Excel skills you&apos;ve covered. Workbook grades come from the Grid Professor add-in once
          it&apos;s connected.
        </p>
      </Card>
    );
  }

  const editor = canEditCourses(viewer.role);
  const units = await getCoursePath(course.id);
  const moduleIds = units.flatMap((u) => u.placements.map((p) => p.module.id));
  const [media, moduleSkills] = await Promise.all([getModuleMedia(moduleIds), getModuleSkills(moduleIds)]);
  const videoIds = [...media.values()].flatMap((m) => (m.videoId ? [m.videoId] : []));
  const progress = await getMyVideoProgress(videoIds);
  const rows = buildRoadmap(units, media, progress, today(), editor).filter((r) => !r.placement.isHidden);
  const { done, countable, percent } = summarize(rows);

  const bySkill = new Map<string, SkillRow>();
  for (const row of rows) {
    for (const skill of moduleSkills.get(row.placement.module.id) ?? []) {
      const entry = bySkill.get(skill.id) ?? { skill, modules: [], done: 0, countable: 0 };
      entry.modules.push(row);
      if (row.media?.videoId) {
        entry.countable += 1;
        if (row.status.kind === "done") entry.done += 1;
      }
      bySkill.set(skill.id, entry);
    }
  }
  const skills = [...bySkill.values()].sort((a, b) => (a.skill.type === b.skill.type ? a.skill.name.localeCompare(b.skill.name) : a.skill.type === "function" ? -1 : 1));
  const seen = skills.filter((s) => s.done > 0).length;

  return (
    <div className="space-y-8">
      {viewer.previewing && <Note>You&apos;re viewing as a {viewer.role}, so this shows your own progress, not a class.</Note>}

      <section aria-label="Overall" className="flex flex-wrap items-center gap-5 rounded-2xl bg-green-tint p-5">
        <div className="relative grid place-items-center">
          <ProgressRing percent={percent} size={68} track="var(--card)" label={`${percent}% of the videos watched`} />
          <span className="absolute text-sm font-semibold tabular-nums text-green-strong">{percent}%</span>
        </div>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-xl font-semibold tracking-tight">
            {done} of {countable} modules done
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {skills.length > 0 ? `${seen} of ${skills.length} Excel skills seen so far.` : "This course has no skills tagged yet."}
          </p>
        </div>
      </section>

      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="text-lg font-semibold">
          Skills
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          The Excel skills this course teaches, and where you&apos;ve met each one. Finishing a module&apos;s video shows you&apos;ve seen the skill; the add-in
          will show you can do it in Excel.
        </p>
        {skills.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map(({ skill, modules, done: d, countable: c }) => (
              <li key={skill.id}>
                <Card className="h-full p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{skill.name}</h3>
                    <span className="text-xs text-muted">{skill.type === "function" ? "Function" : "Technique"}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-green-tint" aria-hidden="true">
                    <div className="h-full rounded-full bg-green" style={{ width: `${c ? (d / c) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {c === 0 ? "Graded in the add-in" : d === 0 ? `Not yet. In ${c === 1 ? "1 module" : `${c} modules`}.` : d === c ? `Seen in ${c === 1 ? "its module" : `all ${c} modules`}.` : `Seen in ${d} of ${c} modules.`}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {modules.map((m) => (
                      <li key={m.placement.id}>
                        <Link
                          href={`/courses/${course.slug}/modules/${m.placement.module.slug}`}
                          title={m.placement.title}
                          className={`inline-block rounded-md border px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                            m.status.kind === "done" ? "border-green bg-green text-white" : "border-line bg-card text-muted hover:bg-bg"
                          }`}
                        >
                          {m.number}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="text-lg font-semibold">
          Modules
        </h2>
        <Card className="mt-3 overflow-hidden">
          <ol className="relative ml-6 border-l border-line">
            {rows.map((row) => (
              <li key={row.placement.id} className="relative pl-7">
                <StatusMarker status={row.status} />
                <Link href={`/courses/${course.slug}/modules/${row.placement.module.slug}`} className="flex items-center gap-4 py-3 pr-4 hover:bg-bg">
                  <ModuleNumber number={row.number} className="w-8 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">{row.placement.title}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">{statusText(row.status)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
        <p className="mt-3 text-xs text-muted">Workbook grades come from the Grid Professor add-in once its connection is in place.</p>
      </section>
    </div>
  );
}

export default function Progress({ params }: PageProps<"/courses/[slug]/progress">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <ProgressContent params={params} />
    </Suspense>
  );
}
