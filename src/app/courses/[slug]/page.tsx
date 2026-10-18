import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCoursePath, getModuleMedia, getMyVideoProgress, today } from "@/lib/data";
import { buildRoadmap, summarize, upNext } from "@/lib/roadmap";
import { canEditCourses, getViewer } from "@/lib/role";
import { ButtonLink } from "@/components/ui";
import { ModuleNumber, ProgressRing, RoadmapRowView, UnitSection } from "@/components/roadmap";

async function RoadmapContent({ params }: Pick<PageProps<"/courses/[slug]">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [units, viewer] = await Promise.all([getCoursePath(course.id), getViewer()]);
  const editor = canEditCourses(viewer.role);
  const media = await getModuleMedia(units.flatMap((u) => u.placements.map((p) => p.module.id)));
  const videoIds = [...media.values()].flatMap((m) => (m.videoId ? [m.videoId] : []));
  const progress = viewer.user ? await getMyVideoProgress(videoIds) : new Map();
  const rows = buildRoadmap(units, media, progress, today(), editor);
  const next = upNext(rows);
  const { done, countable, percent } = summarize(rows);
  const openUnitId = next?.unit.id ?? units[0]?.id;

  const minutes = next?.status.kind === "not_started" ? next.status.minutes : next?.media?.durationSeconds ? Math.round(next.media.durationSeconds / 60) : null;
  const nextMeta = next
    ? [minutes ? `${minutes} min video` : null, next.media?.hasWorkbook ? "a workbook" : null].filter(Boolean).join(" and ")
    : "";

  return (
    <div className="space-y-6">
      <section aria-label="Where you are" className="flex flex-wrap items-center gap-5 rounded-2xl bg-green-tint p-5">
        <div className="relative grid place-items-center">
          <ProgressRing percent={percent} size={68} track="var(--card)" label={`${done} of ${countable} modules done, ${percent}% of the videos watched`} />
          <span className="absolute text-sm font-semibold tabular-nums text-green-strong">{percent}%</span>
        </div>
        <div className="min-w-0 flex-1 basis-56">
          {viewer.user ? (
            <p className="text-sm text-green-strong">
              {next ? (next.status.kind === "in_progress" ? "Pick up where you left off" : "Up next") : "Everything that's open is done"}
            </p>
          ) : (
            <p className="text-sm text-green-strong">
              Start here.{" "}
              <Link href={`/sign-in?next=/courses/${course.slug}`} className="font-medium underline underline-offset-2">
                Sign in
              </Link>{" "}
              to keep your place.
            </p>
          )}
          {next ? (
            <>
              <h2 className="mt-0.5 flex items-baseline gap-2.5 text-xl font-semibold tracking-tight">
                <ModuleNumber number={next.number} />
                <span>{next.placement.title}</span>
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Unit {units.indexOf(next.unit) + 1}, {next.unit.title}.{nextMeta && ` ${nextMeta[0].toUpperCase()}${nextMeta.slice(1)}.`}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted">
              {done} of {countable} modules done. Keep practicing in the{" "}
              <Link href={`/courses/${course.slug}/library`} className="font-medium text-green-strong underline underline-offset-2">
                library
              </Link>
              .
            </p>
          )}
        </div>
        {next && (
          <ButtonLink href={`/courses/${course.slug}/modules/${next.placement.module.slug}`}>
            {next.status.kind === "in_progress" ? "Continue" : "Start"}
          </ButtonLink>
        )}
      </section>

      <ol className="space-y-3">
        {units.map((unit, i) => {
          const unitRows = rows.filter((r) => r.unit.id === unit.id);
          const { done: unitDone, countable: unitCountable } = summarize(unitRows);
          return (
            <li key={unit.id}>
              <UnitSection index={i + 1} title={unit.title} summary={unit.summary} open={unit.id === openUnitId} done={unitDone} countable={unitCountable}>
                {unitRows.map((row) => (
                  <RoadmapRowView key={row.placement.id} row={row} courseSlug={course.slug} editor={editor} />
                ))}
              </UnitSection>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">A module counts as done once you&apos;ve watched most of its video. Workbook grades come from the Grid Professor add-in.</p>
    </div>
  );
}

export default function Roadmap({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <RoadmapContent params={params} />
    </Suspense>
  );
}
