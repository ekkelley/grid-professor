import { Suspense } from "react";
import Link from "next/link";
import { createSection, joinCourse } from "@/app/actions";
import { getJoinCode, getMemberCounts } from "@/lib/admin-data";
import { getCourseProgressSummary, getMyCourses, listCourses, type Course, type Membership } from "@/lib/data";
import { canEditCourses, getViewer } from "@/lib/role";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { ModuleNumber, ProgressRing } from "@/components/roadmap";

const input = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
const primary = "rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";

/** A course the viewer is taking: where they are and what's next. */
async function StudentCourseCard({ course, signedIn }: { course: Course; signedIn: boolean }) {
  const { done, countable, percent, next } = await getCourseProgressSummary(course, signedIn);
  return (
    <Card className="flex flex-wrap items-center gap-5 p-5">
      <div className="relative grid place-items-center">
        <ProgressRing percent={percent} size={60} label={`${done} of ${countable} modules done`} />
        <span className="absolute text-xs font-semibold tabular-nums text-green-strong">{percent}%</span>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <Link href={`/courses/${course.slug}`} className="text-lg font-semibold tracking-tight hover:text-green-strong">
          {course.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted">
          {done} of {countable} modules done.
          {next && (
            <>
              {" "}
              Up next: <ModuleNumber number={next.number} /> {next.placement.title}.
            </>
          )}
        </p>
      </div>
      <ButtonLink href={next ? `/courses/${course.slug}/modules/${next.placement.module.slug}` : `/courses/${course.slug}`}>
        {next ? (next.status.kind === "in_progress" ? "Continue" : "Start") : "Open"}
      </ButtonLink>
    </Card>
  );
}

/** A course the viewer teaches: the code to hand out, and how many have joined. */
async function TaughtCourseCard({ course }: { course: Course }) {
  const [code, counts] = await Promise.all([getJoinCode(course.id), getMemberCounts(course.id)]);
  return (
    <Card className="flex flex-wrap items-center gap-5 p-5">
      <div className="min-w-0 flex-1 basis-56">
        <Link href={`/courses/${course.slug}`} className="text-lg font-semibold tracking-tight hover:text-green-strong">
          {course.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted">
          {counts.students === 1 ? "1 student" : `${counts.students} students`} so far.
          {code && (
            <>
              {" "}
              Students join with code <span className="font-mono font-semibold tracking-wider text-ink">{code}</span> at /join.
            </>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <ButtonLink href={`/courses/${course.slug}/edit`} variant="secondary">
          Edit course
        </ButtonLink>
        <ButtonLink href={`/courses/${course.slug}`}>Open</ButtonLink>
      </div>
    </Card>
  );
}

function JoinForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={joinCourse} className="flex flex-wrap items-center gap-2">
      <label htmlFor="home-join-code" className={compact ? "sr-only" : "text-sm text-muted"}>
        Join code
      </label>
      <input
        id="home-join-code"
        name="code"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={7}
        placeholder="K7PM3Q"
        className={`${input} w-36 font-mono uppercase tracking-[0.2em] placeholder:tracking-[0.2em] placeholder:text-muted/60`}
      />
      <button type="submit" className={primary}>
        Join
      </button>
    </form>
  );
}

function Templates({ templates, editor }: { templates: Course[]; editor: boolean }) {
  if (templates.length === 0) return null;
  return (
    <section aria-labelledby="templates-heading">
      <h2 id="templates-heading" className="text-lg font-semibold">
        {editor ? "Start a course from a template" : "Explore"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {editor ? "Make your own copy, then reorder, hide and date its modules, and hand students the join code." : "Ready-made courses you can browse without joining."}
      </p>
      <ul className="mt-4 grid gap-3">
        {templates.map((t) => (
          <li key={t.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/courses/${t.slug}`} className="font-medium hover:text-green-strong">
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
                    <input id={`title-${t.id}`} name="title" placeholder="Name your copy, e.g. FIN 413 Spring" className={`${input} w-64`} />
                    <button type="submit" className={primary}>
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
  );
}

async function HomeContent() {
  const viewer = await getViewer();
  const editor = canEditCourses(viewer.role);
  const [courses, memberships] = await Promise.all([listCourses(), viewer.user ? getMyCourses() : Promise.resolve([] as Membership[])]);
  const templates = courses.filter((c) => c.kind === "template");
  const sections = courses.filter((c) => c.kind === "section");
  const taking = memberships.filter((m) => m.role === "student");
  const teaching = editor ? memberships.filter((m) => m.role === "instructor") : [];
  // Admins see every course on the platform, including ones they don't teach.
  const others = viewer.role === "admin" ? sections.filter((s) => !memberships.some((m) => m.course.id === s.id)) : [];

  if (!viewer.user) {
    return (
      <div className="space-y-10">
        <section className="max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Excel for finance, taught in Excel.</h1>
          <p className="text-lg text-muted">
            Watch each model get built, build it yourself, and get graded as you type. Your course keeps track of what you&apos;ve seen and what you can do.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/sign-in">Sign in</ButtonLink>
            <ButtonLink href="/join" variant="secondary">
              I have a join code
            </ButtonLink>
          </div>
        </section>
        <Templates templates={templates} editor={false} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {(taking.length > 0 || !editor) && (
        <section aria-labelledby="taking-heading">
          <h1 id="taking-heading" className="text-2xl font-semibold tracking-tight">
            Your courses
          </h1>
          {taking.length === 0 ? (
            <Card className="mt-4 space-y-3 p-5">
              <p className="text-muted">You&apos;re not in a course yet. Enter the join code your instructor gave you.</p>
              <JoinForm />
            </Card>
          ) : (
            <ul className="mt-4 grid gap-3">
              {taking.map((m) => (
                <li key={m.course.id}>
                  <StudentCourseCard course={m.course} signedIn />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {editor && (
        <section aria-labelledby="teaching-heading">
          <h1 id="teaching-heading" className="text-2xl font-semibold tracking-tight">
            Courses you teach
          </h1>
          {teaching.length === 0 ? (
            <p className="mt-3 text-muted">None yet. Start one from a template below.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {teaching.map((m) => (
                <li key={m.course.id}>
                  <TaughtCourseCard course={m.course} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="others-heading">
          <h2 id="others-heading" className="text-lg font-semibold">
            Other courses on the platform
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.slug}`} className="block rounded-xl border border-line bg-card p-4 hover:border-green">
                  <span className="font-medium">{c.title}</span>
                  {c.summary && <p className="mt-1 text-sm text-muted">{c.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Templates templates={templates} editor={editor} />

      {taking.length > 0 && (
        <section aria-labelledby="join-heading" className="flex flex-wrap items-center gap-3">
          <h2 id="join-heading" className="text-sm text-muted">
            Have another join code?
          </h2>
          <JoinForm compact />
        </section>
      )}
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
