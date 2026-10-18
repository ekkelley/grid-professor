import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getCourse, getCoursePath, getDerivedGuides, getModuleMedia, getModuleSlots, getMyVideoProgress, getTags, getWorkbookContext, today } from "@/lib/data";
import { buildRoadmap } from "@/lib/roadmap";
import { canEditCourses, getViewer } from "@/lib/role";
import { Note, TagList } from "@/components/ui";
import { SlotView, WorkbookPending } from "@/components/item-view";
import { ModuleNumber } from "@/components/roadmap";

async function ModulePageContent({ params }: Pick<PageProps<"/courses/[slug]/modules/[module]">, "params">) {
  const { slug, module: moduleSlug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [units, viewer] = await Promise.all([getCoursePath(course.id), getViewer()]);
  const role = viewer.role;
  const editor = canEditCourses(role);

  // The roadmap as this viewer sees it, flattened, so numbers and previous/next follow the course order.
  const media = await getModuleMedia(units.flatMap((u) => u.placements.map((p) => p.module.id)));
  const rows = buildRoadmap(units, media, new Map(), today(), editor);
  const index = rows.findIndex((r) => r.placement.module.slug === moduleSlug);
  if (index === -1) notFound();
  const { placement, unit, number } = rows[index];

  if (!editor && placement.opensOn && placement.opensOn > today()) {
    return <Note>This module opens {formatDate(placement.opensOn)}.</Note>;
  }

  const slots = await getModuleSlots(placement.module.id);
  const tags = await getTags(slots.flat().filter((i) => i.kind !== "read").map((i) => i.id));
  const workbookIds = slots.flat().filter((i) => i.kind === "workbook").map((i) => i.id);
  const hasWorkbook = workbookIds.length > 0;
  const videoIds = slots.flat().filter((i) => i.kind === "video").map((i) => i.id);
  const [workbooks, guides, progress] = await Promise.all([
    getWorkbookContext(workbookIds),
    getDerivedGuides(workbookIds),
    viewer.user ? getMyVideoProgress(videoIds) : Promise.resolve(new Map()),
  ]);
  const prev = rows[index - 1];
  const next = rows[index + 1];

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted">
          <Link href={`/courses/${course.slug}`} className="underline-offset-2 hover:underline">
            Unit {units.indexOf(unit) + 1}, {unit.title}
          </Link>
        </p>
        <h2 className="flex items-baseline gap-2.5 text-xl font-semibold tracking-tight">
          <ModuleNumber number={number} />
          <span>{placement.title}</span>
        </h2>
        {placement.isHidden && <Note>Hidden from students in this course.</Note>}
        <TagList tags={tags} />
      </header>

      {slots.map((items, i) => (
        <SlotView
          key={i}
          items={items}
          workbooks={workbooks}
          guides={guides}
          courseSlug={course.slug}
          admin={role === "admin"}
          tracked={!!viewer.user}
          progress={progress}
        />
      ))}
      {!hasWorkbook && <WorkbookPending />}

      <nav aria-label="Module navigation" className="flex justify-between gap-4 border-t border-line pt-4 text-sm">
        {prev ? (
          <Link href={`/courses/${course.slug}/modules/${prev.placement.module.slug}`} className="text-green-strong hover:underline">
            ← {prev.placement.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/courses/${course.slug}/modules/${next.placement.module.slug}`} className="text-right text-green-strong hover:underline">
            {next.placement.title} →
          </Link>
        )}
      </nav>
    </article>
  );
}

export default function ModulePage({ params }: PageProps<"/courses/[slug]/modules/[module]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <ModulePageContent params={params} />
    </Suspense>
  );
}
