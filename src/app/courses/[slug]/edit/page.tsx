import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { moveModule, setHidden, setOpensOn } from "@/app/actions";
import { getCourse, getCoursePath } from "@/lib/data";
import { canEditCourses, getRole } from "@/lib/role";
import { Badge, Card } from "@/components/ui";

const iconButton =
  "grid size-8 place-items-center rounded-md border border-line bg-card text-sm text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40";

async function EditCourseContent({ params }: Pick<PageProps<"/courses/[slug]/edit">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  if (course.kind !== "section" || !canEditCourses(await getRole())) redirect(`/courses/${slug}`);
  const units = await getCoursePath(course.id);

  return (
    <div className="space-y-8">
      <p className="text-muted">
        Changes here affect only this course. The template stays as it was. Students don&apos;t see hidden modules, and a dated
        module stays locked until its open date.
      </p>
      {units.map((unit) => (
        <section key={unit.id} aria-labelledby={`edit-unit-${unit.id}`}>
          <h2 id={`edit-unit-${unit.id}`} className="text-lg font-semibold">
            Unit {unit.position}: {unit.title}
          </h2>
          <Card className="mt-3 overflow-hidden">
            <ol>
              {unit.placements.map((p, i) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 border-line px-4 py-3 [&:not(:first-child)]:border-t">
                  <div className="flex gap-1">
                    <form action={moveModule}>
                      <input type="hidden" name="placement" value={p.id} />
                      <input type="hidden" name="direction" value="-1" />
                      <button type="submit" className={iconButton} disabled={i === 0} aria-label={`Move ${p.title} up`}>
                        ↑
                      </button>
                    </form>
                    <form action={moveModule}>
                      <input type="hidden" name="placement" value={p.id} />
                      <input type="hidden" name="direction" value="1" />
                      <button type="submit" className={iconButton} disabled={i === unit.placements.length - 1} aria-label={`Move ${p.title} down`}>
                        ↓
                      </button>
                    </form>
                  </div>

                  <span className={`min-w-0 flex-1 font-medium ${p.isHidden ? "text-muted line-through" : ""}`}>{p.title}</span>
                  {p.isHidden && <Badge tone="note">Hidden</Badge>}

                  <form action={setOpensOn} className="flex items-center gap-2">
                    <input type="hidden" name="placement" value={p.id} />
                    <label htmlFor={`opens-${p.id}`} className="text-sm text-muted">
                      Opens
                    </label>
                    <input
                      id={`opens-${p.id}`}
                      type="date"
                      name="opens_on"
                      defaultValue={p.opensOn ?? ""}
                      className="rounded-md border border-line bg-card px-2 py-1 text-sm"
                    />
                    <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-sm hover:bg-bg">
                      Save
                    </button>
                  </form>

                  <form action={setHidden}>
                    <input type="hidden" name="placement" value={p.id} />
                    <input type="hidden" name="hidden" value={String(!p.isHidden)} />
                    <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-sm hover:bg-bg">
                      {p.isHidden ? "Show" : "Hide"}
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      ))}
    </div>
  );
}

export default function EditCourse({ params }: PageProps<"/courses/[slug]/edit">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <EditCourseContent params={params} />
    </Suspense>
  );
}
