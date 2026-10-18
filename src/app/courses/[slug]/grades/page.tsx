import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCoursePath, getModuleSlots, getMyVideoProgress } from "@/lib/data";
import { getViewer } from "@/lib/role";
import { Card, Note } from "@/components/ui";

async function GradesContent({ params }: Pick<PageProps<"/courses/[slug]/grades">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Grades</h2>
        <p className="mt-2 max-w-prose text-muted">
          <Link href={`/sign-in?next=/courses/${course.slug}/grades`} className="font-medium text-green-strong hover:underline">
            Sign in
          </Link>{" "}
          to see how much of each video you&apos;ve watched. Workbook grades come from the Grid Professor add-in once it&apos;s connected.
        </p>
      </Card>
    );
  }

  const units = await getCoursePath(course.id);
  const visible = units.flatMap((u) => u.placements.filter((p) => !p.isHidden).map((p) => ({ ...p, unit: u })));
  const slotsByModule = await Promise.all(visible.map((p) => getModuleSlots(p.module.id)));
  const rows = visible.flatMap((p, i) => {
    const video = slotsByModule[i].flat().find((item) => item.kind === "video");
    return video ? [{ placement: p, video }] : [];
  });
  const progress = await getMyVideoProgress(rows.map((r) => r.video.id));
  const scores = rows.map((r) => progress.get(r.video.id)?.percent ?? 0);
  const average = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {viewer.previewing && <Note>You&apos;re viewing as a {viewer.role}, so this shows your own viewing, not a class.</Note>}
      <Card className="flex flex-wrap items-baseline justify-between gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold">Videos</h2>
          <p className="text-sm text-muted">Your grade for a video is the share of it you&apos;ve watched. Repeat viewings keep your best.</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {average}% <span className="text-sm font-normal text-muted">average across {rows.length} videos</span>
        </p>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Module</th>
              <th className="px-4 py-2 font-semibold">Unit</th>
              <th className="px-4 py-2 text-right font-semibold">Watched</th>
              <th className="px-4 py-2 text-right font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ placement, video }) => {
              const p = progress.get(video.id);
              return (
                <tr key={placement.id} className="border-t border-line">
                  <td className="px-4 py-2">
                    <Link href={`/courses/${course.slug}/modules/${placement.module.slug}`} className="hover:text-green-strong">
                      {placement.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{placement.unit.title}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p ? `${Math.round(p.percent)}%` : <span className="text-muted">not started</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{p ? Math.round(p.percent) : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted">Workbook grades come from the Grid Professor add-in once its connection is in place.</p>
    </div>
  );
}

export default function Grades({ params }: PageProps<"/courses/[slug]/grades">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <GradesContent params={params} />
    </Suspense>
  );
}
