import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getMyCourses, type Membership } from "@/lib/data";
import { canEditCourses, getViewer } from "@/lib/role";
import { Badge, Note } from "@/components/ui";
import { CourseTabs } from "@/components/course-tabs";

/** Jump to another of the viewer's courses. A native disclosure, so no script is needed. */
function CourseSwitcher({ others }: { others: Membership[] }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-sm font-medium hover:bg-bg [&::-webkit-details-marker]:hidden">
        Switch course
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180 motion-reduce:transition-none">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </summary>
      <ul className="absolute left-0 z-10 mt-1 w-72 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-sm">
        {others.map((m) => (
          <li key={m.course.id}>
            <Link href={`/courses/${m.course.slug}`} className="block px-3 py-2 text-sm hover:bg-bg">
              <span className="block font-medium">{m.course.title}</span>
              <span className="block text-xs text-muted">{m.role === "instructor" ? "You teach this" : "You're taking this"}</span>
            </Link>
          </li>
        ))}
        <li className="border-t border-line">
          <Link href="/" className="block px-3 py-2 text-sm text-muted hover:bg-bg">
            All your courses
          </Link>
        </li>
      </ul>
    </details>
  );
}

async function CourseShell({ children, params }: LayoutProps<"/courses/[slug]">) {
  const { slug } = await params;
  const [course, viewer] = await Promise.all([getCourse(slug), getViewer()]);
  if (!course) notFound();
  const editor = canEditCourses(viewer.role);
  const memberships = viewer.user ? await getMyCourses() : [];
  const others = memberships.filter((m) => m.course.id !== course.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            {course.kind === "template" && <Badge>Template</Badge>}
          </div>
          {course.summary && <p className="mt-1 text-muted">{course.summary}</p>}
        </div>
        {others.length > 0 && <CourseSwitcher others={others} />}
      </div>
      {course.kind === "template" && editor && (
        <Note>This is the template. Go back to Courses and choose “Use this template” to make a copy you can edit.</Note>
      )}
      <CourseTabs slug={course.slug} showEdit={editor && course.kind === "section"} />
      {children}
    </div>
  );
}

export default function CourseLayout(props: LayoutProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <CourseShell {...props} />
    </Suspense>
  );
}
