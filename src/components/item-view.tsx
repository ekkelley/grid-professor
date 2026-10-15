import Markdown from "react-markdown";
import type { Item } from "@/lib/data";
import { formatDuration } from "@/lib/data";
import { Badge, Card } from "@/components/ui";

function VideoItem({ item }: { item: Item }) {
  if (!item.stored_at) return null;
  return (
    <figure>
      <div className="aspect-video overflow-hidden rounded-xl border border-line bg-ink">
        <iframe
          src={item.stored_at}
          title={`Video: ${item.title}`}
          className="size-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {item.duration_seconds && (
        <figcaption className="mt-2 text-sm text-muted">Video, {formatDuration(item.duration_seconds)}</figcaption>
      )}
    </figure>
  );
}

function ReadItem({ item, heading }: { item: Item; heading: string }) {
  if (!item.body_md) return null;
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-base font-semibold">{heading}</h2>
      <div className="prose-reading text-[15px]">
        <Markdown>{item.body_md}</Markdown>
      </div>
    </Card>
  );
}

function WorkbookItem({ item }: { item: Item }) {
  const builds = item.workbook_builds.filter((b) => b.status === "current");
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{item.title}</h2>
          <p className="text-sm text-muted">Excel workbook, graded live by the Grid Professor add-in</p>
        </div>
        <div className="flex gap-2">
          {builds.map((b) =>
            b.open_url ? (
              <a key={b.id} href={b.open_url} className="rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong">
                Open {b.variant === "competition" ? "timed" : "practice"} version
              </a>
            ) : (
              <Badge key={b.id}>{b.variant} build, link pending</Badge>
            ),
          )}
        </div>
      </div>
    </Card>
  );
}

/** One slot: its items are substitutes, shown together (a video and the reading derived from it). */
export function SlotView({ items }: { items: Item[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        switch (item.kind) {
          case "video":
            return <VideoItem key={item.id} item={item} />;
          case "read":
            return <ReadItem key={item.id} item={item} heading={items.length > 1 ? "Prefer to read? Same material, in text" : "Reading"} />;
          case "guide":
            return <ReadItem key={item.id} item={item} heading={item.title} />;
          case "workbook":
            return <WorkbookItem key={item.id} item={item} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function WorkbookPending() {
  return (
    <Card className="border-dashed p-5">
      <h2 className="text-base font-semibold">Excel workbook</h2>
      <p className="mt-1 text-sm text-muted">
        The add-in version of this exercise is being built. Once it&apos;s linked, students open it from here and the add-in grades it live.
      </p>
    </Card>
  );
}
