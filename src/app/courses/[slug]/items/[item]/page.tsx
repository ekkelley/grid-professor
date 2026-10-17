import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getDerivedItems, getItemById, getLibrary, getTags, getWorkbookContext } from "@/lib/data";
import { TagList } from "@/components/ui";
import { SlotView } from "@/components/item-view";

async function LibraryItemContent({ params }: Pick<PageProps<"/courses/[slug]/items/[item]">, "params">) {
  const { slug, item: itemSlug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  // Only items this course offers in its library can be opened here.
  const entry = (await getLibrary(course.id)).find((r) => r.items?.slug === itemSlug);
  const item = entry?.items ? await getItemById(entry.items.id) : null;
  if (!item) notFound();
  const [derived, tags, workbooks] = await Promise.all([getDerivedItems(item.id), getTags([item.id]), getWorkbookContext([item.id])]);

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
      <SlotView items={[item, ...derived.filter((d) => d.kind === "read")]} workbooks={workbooks} />
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
