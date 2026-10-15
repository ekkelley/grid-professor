import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/data";
import { canEditCourses, getRole } from "@/lib/role";
import { Badge, Note } from "@/components/ui";
import { CourseTabs } from "@/components/course-tabs";

async function CourseShell({ children, params }: LayoutProps<"/courses/[slug]">) {
  const { slug } = await params;
  const [course, role] = await Promise.all([getCourse(slug), getRole()]);
  if (!course) notFound();
  const editor = canEditCourses(role);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          {course.kind === "template" && <Badge>Template</Badge>}
        </div>
        {course.summary && <p className="mt-1 text-muted">{course.summary}</p>}
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
