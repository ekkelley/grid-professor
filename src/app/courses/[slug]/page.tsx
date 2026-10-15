import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getCourse, getCoursePath, today } from "@/lib/data";
import { canEditCourses, getRole } from "@/lib/role";
import { Badge, Card } from "@/components/ui";

async function CoursePathContent({ params }: Pick<PageProps<"/courses/[slug]">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [units, role] = await Promise.all([getCoursePath(course.id), getRole()]);
  const editor = canEditCourses(role);
  const now = today();
  // Number visible modules through the whole course; hidden ones get no number.
  const numbers = new Map<string, number>();
  units.flatMap((u) => u.placements).filter((p) => !p.isHidden).forEach((p, i) => numbers.set(p.id, i + 1));

  return (
    <ol className="space-y-8">
      {units.map((unit) => {
        const placements = unit.placements.filter((p) => editor || !p.isHidden);
        return (
          <li key={unit.id}>
            <section aria-labelledby={`unit-${unit.id}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Unit {unit.position}</p>
              <h2 id={`unit-${unit.id}`} className="text-lg font-semibold">
                {unit.title}
              </h2>
              {unit.summary && <p className="text-sm text-muted">{unit.summary}</p>}
              <Card className="mt-3 overflow-hidden">
                <ol>
                  {placements.map((p) => {
                    const locked = !editor && p.opensOn !== null && p.opensOn > now;
                    const label = (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-green-tint text-xs font-semibold text-green-strong"
                        >
                          {numbers.get(p.id) ?? "–"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{p.title}</span>
                          {p.module.summary && <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{p.module.summary}</span>}
                        </span>
                        <span className="flex shrink-0 gap-1.5">
                          {p.isHidden && <Badge tone="note">Hidden from students</Badge>}
                          {p.opensOn && <Badge>{p.opensOn > now ? `Opens ${formatDate(p.opensOn)}` : `Opened ${formatDate(p.opensOn)}`}</Badge>}
                        </span>
                      </div>
                    );
                    return (
                      <li key={p.id} className="border-line [&:not(:first-child)]:border-t">
                        {locked ? (
                          <div aria-disabled="true" className="opacity-60">
                            {label}
                          </div>
                        ) : (
                          <Link href={`/courses/${course.slug}/modules/${p.module.slug}`} className="block hover:bg-bg">
                            {label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </section>
          </li>
        );
      })}
    </ol>
  );
}

export default function CoursePath({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <CoursePathContent params={params} />
    </Suspense>
  );
}
