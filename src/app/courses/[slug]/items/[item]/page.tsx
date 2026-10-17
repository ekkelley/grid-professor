import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getDerivedGuides, getDerivedItems, getItemById, getLibrary, getMyVideoProgress, getTags, getWorkbookContext } from "@/lib/data";
import { getViewer } from "@/lib/role";
import { TagList } from "@/components/ui";
import { SlotView } from "@/components/item-view";

async function LibraryItemContent({ params }: Pick<PageProps<"/courses/[slug]/items/[item]">, "params">) {
  const { slug, item: itemSlug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  // Only items this course offers in its library, or items derived from one (a sprint's solution
  // guide), can be opened here.
  const [library, viewer] = await Promise.all([getLibrary(course.id), getViewer()]);
  const role = viewer.role;
  const libraryIds = library.map((r) => r.items?.id).filter((id): id is string => !!id);
  const entry = library.find((r) => r.items?.slug === itemSlug);
  let item = entry?.items ? await getItemById(entry.items.id) : null;
  if (!item) {
    const candidates = await getDerivedGuides(libraryIds);
    const match = [...candidates.values()].flat().find((g) => g.slug === itemSlug);
    item = match ? await getItemById(match.id) : null;
  }
  if (!item || (item.derived_from && !libraryIds.includes(item.derived_from) && !libraryIds.includes(item.id))) notFound();
  const [derived, tags, workbooks, guides, progress] = await Promise.all([
    getDerivedItems(item.id),
    getTags([item.id]),
    getWorkbookContext([item.id]),
    getDerivedGuides([item.id]),
    viewer.user && item.kind === "video" ? getMyVideoProgress([item.id]) : Promise.resolve(new Map()),
  ]);

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted">
          <Link href={`/courses/${course.slug}/library`} className="underline-offset-2 hover:underline">
            Library
          </Link>
        </p>
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <TagList tags={tags} />
      </header>
      <SlotView
        items={[item, ...derived.filter((d) => d.kind === "read")]}
        workbooks={workbooks}
        guides={guides}
        courseSlug={course.slug}
        admin={role === "admin"}
        tracked={!!viewer.user}
        progress={progress}
      />
    </article>
  );
}

export default function LibraryItem({ params }: PageProps<"/courses/[slug]/items/[item]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <LibraryItemContent params={params} />
    </Suspense>
  );
}
