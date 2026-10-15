import { Suspense } from "react";
import Link from "next/link";
import { createSection } from "@/app/actions";
import { listCourses } from "@/lib/data";
import { canEditCourses, getRole } from "@/lib/role";
import { Badge, Card } from "@/components/ui";

async function HomeContent() {
  const [courses, role] = await Promise.all([listCourses(), getRole()]);
  const templates = courses.filter((c) => c.kind === "template");
  const sections = courses.filter((c) => c.kind === "section");
  const editor = canEditCourses(role);

  return (
    <div className="space-y-10">
      <section aria-labelledby="sections-heading">
        <h1 id="sections-heading" className="text-2xl font-semibold tracking-tight">
          Courses
        </h1>
        {sections.length === 0 ? (
          <p className="mt-3 text-muted">
            No courses yet. {editor ? "Start one from a template below." : "Switch to instructor to start one from a template."}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {sections.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.slug}`} className="block rounded-xl border border-line bg-card p-4 hover:border-green">
                  <span className="font-medium">{c.title}</span>
                  {c.summary && <p className="mt-1 text-sm text-muted">{c.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="text-lg font-semibold">
          Template courses
        </h2>
        <p className="mt-1 text-sm text-muted">Ready-made courses. Make your own copy, then reorder, hide and date its modules.</p>
        <ul className="mt-4 grid gap-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/courses/${t.slug}`} className="font-medium hover:text-green">
                        {t.title}
                      </Link>
                      <Badge>Template</Badge>
                    </div>
                    {t.summary && <p className="mt-1 text-sm text-muted">{t.summary}</p>}
                  </div>
                  {editor && (
                    <form action={createSection} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="template" value={t.slug} />
                      <label className="sr-only" htmlFor={`title-${t.id}`}>
                        Name for your copy
                      </label>
                      <input
                        id={`title-${t.id}`}
                        name="title"
                        placeholder="Name your copy, e.g. FIN 413 Spring"
                        className="w-64 rounded-lg border border-line bg-card px-3 py-2 text-sm"
                      />
                      <button type="submit" className="rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong">
                        Use this template
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <HomeContent />
    </Suspense>
  );
}
