import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { attachWorkbookFile, importWorkbookGuide } from "@/app/actions";
import type { Item, WorkbookContext } from "@/lib/data";
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
        <Markdown remarkPlugins={[remarkGfm]}>{item.body_md}</Markdown>
      </div>
    </Card>
  );
}

type DerivedGuide = { id: string; slug: string; title: string };

function WorkbookItem({
  item,
  workbooks,
  guides = [],
  courseSlug,
  admin = false,
}: {
  item: Item;
  workbooks?: WorkbookContext;
  guides?: DerivedGuide[];
  courseSlug?: string;
  admin?: boolean;
}) {
  const builds = item.workbook_builds.filter((b) => b.status === "current");
  const withFile = builds.filter((b) => b.file_path);
  const members = workbooks?.members.get(item.id) ?? [];
  const partOf = workbooks?.partOf.get(item.id);
  const isSequence = members.length > 0;
  const variantLabel = (v: string) => (v === "competition" ? "timed version" : v === "training" ? "practice version" : "workbook");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Excel workbook</p>
          <h2 className="text-base font-semibold">{item.title}</h2>
          {item.summary && <p className="mt-1 text-sm text-muted">{item.summary}</p>}
          {item.delivery_note && <p className="mt-2 text-sm">{item.delivery_note}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {withFile.map((b) => (
            <a
              key={b.id}
              href={`/files/${b.id}`}
              download={b.file_name ?? undefined}
              className="inline-flex items-center rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong"
            >
              Download {withFile.length > 1 ? variantLabel(b.variant) : "workbook"}
            </a>
          ))}
          {withFile.length === 0 && !admin && <Badge tone="note">File coming</Badge>}
        </div>
      </div>

      {partOf && (
        <p className="mt-3 text-sm">
          Graded as part of <span className="font-medium">{partOf.title}</span>, tab {partOf.position} of {partOf.of}.
        </p>
      )}

      {isSequence && (
        <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-sm">
          {members.map((m) => (
            <li key={m.id}>{m.title}</li>
          ))}
        </ol>
      )}

      {guides.length > 0 && courseSlug && (
        <p className="mt-3 text-sm">
          {guides.map((g) => (
            <Link key={g.id} href={`/courses/${courseSlug}/items/${g.slug}`} className="font-medium text-green-strong hover:underline">
              Solution guide
            </Link>
          ))}
        </p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-green-strong">How it works</summary>
        <div className="mt-2 space-y-1.5 text-muted">
          <p>Open the workbook in Excel and sign in to the Grid Professor add-in in the task pane. It grades as you work and records your result.</p>
          {(isSequence || partOf) && (
            <p>This is a timed run: the add-in serves the tabs one at a time on one clock. You can also start it from the add-in&apos;s Game Launcher in any blank workbook.</p>
          )}
          {withFile.length === 0 && <p>The file is not attached here yet. Until it is, download it from your class page in the add-in.</p>}
        </div>
      </details>

      {admin && (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-line p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Admin</p>
          {builds.map((b) => (
            <form key={b.id} action={attachWorkbookFile} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="build" value={b.id} />
              <label htmlFor={`file-${b.id}`} className="min-w-40">
                {variantLabel(b.variant)} <span className="text-xs text-muted">({b.addin_ref})</span>
                {b.file_name && <span className="block text-xs text-muted">now: {b.file_name}</span>}
              </label>
              <input id={`file-${b.id}`} type="file" name="file" accept=".xlsx,.xlsm" required className="text-sm" />
              <button type="submit" className="rounded-md border border-line px-2.5 py-1 hover:bg-bg">
                {b.file_name ? "Replace file" : "Attach file"}
              </button>
            </form>
          ))}
          <form action={importWorkbookGuide} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="workbook" value={item.id} />
            <label htmlFor={`guide-${item.id}`} className="min-w-40">
              Solution guide URL
            </label>
            <input
              id={`guide-${item.id}`}
              type="url"
              name="url"
              required
              placeholder="https://app.gridprof.com/assets/guide-….html"
              className="w-80 rounded-md border border-line bg-card px-2 py-1"
            />
            <button type="submit" className="rounded-md border border-line px-2.5 py-1 hover:bg-bg">
              {guides.length > 0 ? "Re-import guide" : "Import guide"}
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}

function GuideItem({ item }: { item: Item }) {
  if (!item.body_md) return null;
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Guide</p>
      <h2 className="mb-3 text-base font-semibold">{item.title}</h2>
      <div className="prose-reading text-[15px]">
        <Markdown remarkPlugins={[remarkGfm]}>{item.body_md}</Markdown>
      </div>
      {item.stored_at && (
        <p className="mt-4 text-xs text-muted">
          Imported from the Grid Professor add-in.{" "}
          <a href={item.stored_at} className="underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
            Source page
          </a>
        </p>
      )}
    </Card>
  );
}

/** One slot: its items are substitutes, shown together (a video and the reading derived from it). */
export function SlotView({
  items,
  workbooks,
  guides,
  courseSlug,
  admin,
}: {
  items: Item[];
  workbooks?: WorkbookContext;
  /** Guides derived from a workbook in this slot, keyed by workbook id. */
  guides?: Map<string, DerivedGuide[]>;
  courseSlug?: string;
  admin?: boolean;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        switch (item.kind) {
          case "video":
            return <VideoItem key={item.id} item={item} />;
          case "read":
            return <ReadItem key={item.id} item={item} heading={items.length > 1 ? "Prefer to read? Same material, in text" : "Reading"} />;
          case "guide":
            return <GuideItem key={item.id} item={item} />;
          case "workbook":
            return (
              <WorkbookItem
                key={item.id}
                item={item}
                workbooks={workbooks}
                guides={guides?.get(item.id)}
                courseSlug={courseSlug}
                admin={admin}
              />
            );
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
        No graded workbook is linked to this module yet. When one is, students download it from here and the add-in grades it live.
      </p>
    </Card>
  );
}
