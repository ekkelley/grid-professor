import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCourse, getLibrary, getSkillNames } from "@/lib/data";
import { LibraryBrowser, type LibraryEntry } from "@/components/library-browser";

async function LibraryContent({ params }: Pick<PageProps<"/courses/[slug]/library">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const rows = await getLibrary(course.id);
  const skills = await getSkillNames(rows.map((r) => r.items!.id));
  const all: LibraryEntry[] = rows.map((r) => ({
    id: r.items!.id,
    slug: r.items!.slug,
    title: r.items!.title,
    section: r.section,
    summary: r.items!.summary,
    minutes: r.items!.duration_seconds ? Math.max(1, Math.round(r.items!.duration_seconds / 60)) : null,
    deliveryNote: r.items!.delivery_note,
    skills: skills.get(r.items!.id) ?? [],
  }));
  // Function guides read best alphabetically; everything else keeps the order the course set.
  const entries = [
    ...all.filter((e) => e.section !== "function_guide"),
    ...all.filter((e) => e.section === "function_guide").sort((a, b) => a.title.localeCompare(b.title)),
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted">Help outside the roadmap. Come here when you&apos;re stuck or want more practice.</p>
      <LibraryBrowser entries={entries} courseSlug={course.slug} />
    </div>
  );
}

export default function Library({ params }: PageProps<"/courses/[slug]/library">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <LibraryContent params={params} />
    </Suspense>
  );
}
