import Markdown from "react-markdown";
import type { Item, WorkbookContext } from "@/lib/data";
import { formatDuration } from "@/lib/data";
import { Card } from "@/components/ui";

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

const ADDIN_HOME = "https://app.gridprof.com/student.html";

function WorkbookItem({ item, workbooks }: { item: Item; workbooks?: WorkbookContext }) {
  const builds = item.workbook_builds.filter((b) => b.status === "current");
  const members = workbooks?.members.get(item.id) ?? [];
  const partOf = workbooks?.partOf.get(item.id);
  const isSequence = members.length > 0;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Excel workbook</p>
          <h2 className="text-base font-semibold">{item.title}</h2>
          {item.summary && <p className="mt-1 text-sm text-muted">{item.summary}</p>}
          {item.delivery_note && <p className="mt-2 text-sm">{item.delivery_note}</p>}
        </div>
        <a
          href={ADDIN_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong"
        >
          Open Grid Professor<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      {partOf && (
        <p className="mt-3 text-sm">
          Graded in <span className="font-medium">{partOf.title}</span>, tab {partOf.position} of {partOf.of}.
        </p>
      )}

      {isSequence && (
        <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-sm">
          {members.map((m) => (
            <li key={m.id}>{m.title}</li>
          ))}
        </ol>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-green-strong">How to open it</summary>
        <div className="mt-2 space-y-1.5 text-muted">
          {isSequence || partOf ? (
            <p>
              In Excel, open a blank workbook, sign in to the Grid Professor add-in and choose Game Launcher. Pick this run and the
              add-in serves the tabs one at a time.
            </p>
          ) : (
            <p>Download it from your class page in Grid Professor, open it in Excel and sign in to the add-in. It grades as you work.</p>
          )}
          <p>You need to be enrolled in a Grid Professor class that includes it.</p>
          <p className="text-xs">Add-in reference: {builds.map((b) => `${b.addin_ref}${b.variant === "single" ? "" : ` (${b.variant})`}`).join("; ")}</p>
        </div>
      </details>
    </Card>
  );
}

function GuideItem({ item }: { item: Item }) {
  if (item.body_md) return <ReadItem item={item} heading={item.title} />;
  if (!item.stored_at) return null;
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Function guide</p>
      <h2 className="text-base font-semibold">{item.title}</h2>
      {item.summary && <p className="mt-1 text-sm text-muted">{item.summary}</p>}
      <a
        href={item.stored_at}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:bg-bg"
      >
        Open the guide<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Card>
  );
}

/** One slot: its items are substitutes, shown together (a video and the reading derived from it). */
export function SlotView({ items, workbooks }: { items: Item[]; workbooks?: WorkbookContext }) {
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
            return <WorkbookItem key={item.id} item={item} workbooks={workbooks} />;
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
        No graded workbook is linked to this module yet. When one is, students open it from here and the add-in grades it live.
      </p>
    </Card>
  );
}
