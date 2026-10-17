import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration, getCourse, getLibrary, type LibrarySection } from "@/lib/data";
import { Card } from "@/components/ui";

const SECTIONS: { key: LibrarySection; title: string; blurb: string; empty: string }[] = [
  { key: "explainer", title: "Concept videos", blurb: "Short explainers you can return to any time.", empty: "None yet." },
  { key: "function_guide", title: "Function guides", blurb: "Brief descriptions of the Excel functions this course uses.", empty: "None yet." },
  { key: "practice", title: "Practice files", blurb: "Short graded workbooks that drill one idea at a time.", empty: "None yet." },
  { key: "game", title: "Games", blurb: "Timed runs and esports cases of different lengths. Games run in the add-in.", empty: "None yet." },
];

async function LibraryContent({ params }: Pick<PageProps<"/courses/[slug]/library">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const rows = await getLibrary(course.id);

  return (
    <div className="space-y-8">
      <p className="text-muted">Help outside the main path. Use it whenever you get stuck or want more practice.</p>
      {SECTIONS.map((section) => {
        const entries = rows.filter((r) => r.section === section.key);
        return (
          <section key={section.key} aria-labelledby={`lib-${section.key}`}>
            <h2 id={`lib-${section.key}`} className="text-lg font-semibold">
              {section.title}
            </h2>
            <p className="text-sm text-muted">{section.blurb}</p>
            {entries.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">{section.empty}</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {entries.map(({ items: item }) => (
                  <li key={item!.id}>
                    <Link href={`/courses/${course.slug}/items/${item!.slug}`} className="block h-full">
                      <Card className="h-full p-4 hover:border-green">
                        <span className="font-medium">{item!.title}</span>
                        {item!.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{item!.summary}</p>}
                        {item!.duration_seconds && <p className="mt-2 text-xs text-muted">Video, {formatDuration(item!.duration_seconds)}</p>}
                        {item!.delivery_note && <p className="mt-2 text-xs text-muted">{item!.delivery_note}</p>}
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
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
