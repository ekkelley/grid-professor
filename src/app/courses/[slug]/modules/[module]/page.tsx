import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getCourse, getCoursePath, getModuleSlots, getTags, getWorkbookContext, today } from "@/lib/data";
import { canEditCourses, getRole } from "@/lib/role";
import { Note, TagList } from "@/components/ui";
import { SlotView, WorkbookPending } from "@/components/item-view";

async function ModulePageContent({ params }: Pick<PageProps<"/courses/[slug]/modules/[module]">, "params">) {
  const { slug, module: moduleSlug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [units, role] = await Promise.all([getCoursePath(course.id), getRole()]);
  const editor = canEditCourses(role);

  // The path as this viewer sees it, flattened, so previous and next follow the course order.
  const visible = units.flatMap((u) => u.placements.filter((p) => editor || !p.isHidden).map((p) => ({ ...p, unit: u })));
  const index = visible.findIndex((p) => p.module.slug === moduleSlug);
  if (index === -1) notFound();
  const placement = visible[index];

  if (!editor && placement.opensOn && placement.opensOn > today()) {
    return <Note>This module opens {formatDate(placement.opensOn)}.</Note>;
  }

  const slots = await getModuleSlots(placement.module.id);
  const tags = await getTags(slots.flat().filter((i) => i.kind !== "read").map((i) => i.id));
  const workbookIds = slots.flat().filter((i) => i.kind === "workbook").map((i) => i.id);
  const hasWorkbook = workbookIds.length > 0;
  const workbooks = await getWorkbookContext(workbookIds);
  const prev = visible[index - 1];
  const next = visible[index + 1];

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted">
          <Link href={`/courses/${course.slug}`} className="underline-offset-2 hover:underline">
            {placement.unit.title}
          </Link>
        </p>
        <h2 className="text-xl font-semibold">{placement.title}</h2>
        {placement.isHidden && <Note>Hidden from students in this course.</Note>}
        <TagList tags={tags} />
      </header>

      {slots.map((items, i) => (
        <SlotView key={i} items={items} workbooks={workbooks} />
      ))}
      {!hasWorkbook && <WorkbookPending />}

      <nav aria-label="Module navigation" className="flex justify-between gap-4 border-t border-line pt-4 text-sm">
        {prev ? (
          <Link href={`/courses/${course.slug}/modules/${prev.module.slug}`} className="text-green-strong hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/courses/${course.slug}/modules/${next.module.slug}`} className="text-right text-green-strong hover:underline">
            {next.title} →
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
