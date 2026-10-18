import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/data";
import type { ModuleStatus, RoadmapRow } from "@/lib/roadmap";
import { Badge } from "@/components/ui";

/** A ring that fills clockwise with the share done. Sized by the parent through `size`. */
export function ProgressRing({ percent, size = 56, label, track = "var(--green-tint)" }: { percent: number; size?: number; label: string; track?: string }) {
  const stroke = Math.max(4, Math.round(size / 12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped / 100)}
        className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

/** The marker on the roadmap's spine. Each state is a different shape so color isn't the only cue. */
export function StatusMarker({ status }: { status: ModuleStatus }) {
  const base = "absolute -left-[9px] top-[18px] size-[17px] rounded-full";
  switch (status.kind) {
    case "done":
      return (
        <span aria-hidden="true" className={`${base} grid place-items-center bg-green text-white`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 5.2 4.2 7.4 8 3" />
          </svg>
        </span>
      );
    case "in_progress":
      return (
        <span
          aria-hidden="true"
          className={`${base} grid place-items-center`}
          style={{ background: `conic-gradient(var(--green) ${status.percent}%, var(--green-tint) 0)` }}
        >
          <span className="size-[9px] rounded-full bg-card" />
        </span>
      );
    case "locked":
      return <span aria-hidden="true" className={`${base} border-2 border-dashed border-line bg-card`} />;
    case "addin":
      return (
        <span aria-hidden="true" className={`${base} grid grid-cols-2 gap-[2px] border border-line bg-card p-[3px]`}>
          <span className="rounded-[1px] bg-green-tint" />
          <span className="rounded-[1px] bg-green-tint" />
          <span className="rounded-[1px] bg-green-tint" />
          <span className="rounded-[1px] bg-green-tint" />
        </span>
      );
    default:
      return <span aria-hidden="true" className={`${base} border-2 border-line bg-card`} />;
  }
}

export function statusText(status: ModuleStatus): string {
  switch (status.kind) {
    case "done":
      return "Done";
    case "in_progress":
      return `${Math.round(status.percent)}% watched`;
    case "locked":
      return `Opens ${formatDate(status.opensOn)}`;
    case "addin":
      return "Graded in the add-in";
    default:
      return status.minutes ? `${status.minutes} min` : "";
  }
}

export function ModuleNumber({ number, className = "" }: { number: string | null; className?: string }) {
  return (
    <span className={`font-mono text-[13px] tabular-nums text-muted ${className}`} aria-label={number ? `Module ${number}` : undefined}>
      {number ?? "–"}
    </span>
  );
}

export function RoadmapRowView({ row, courseSlug, editor }: { row: RoadmapRow; courseSlug: string; editor: boolean }) {
  const { placement, status, number } = row;
  const openable = status.kind !== "locked";
  const body = (
    <div className="flex items-center gap-4 py-3 pr-4">
      <ModuleNumber number={number} className="w-8 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className={`block ${status.kind === "done" ? "text-muted" : "font-medium"}`}>{placement.title}</span>
        {editor && (placement.isHidden || placement.opensOn) && (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {placement.isHidden && <Badge tone="note">Hidden from students</Badge>}
            {placement.opensOn && <Badge>Opens {formatDate(placement.opensOn)}</Badge>}
          </span>
        )}
      </span>
      <span className="shrink-0 text-sm tabular-nums text-muted">{statusText(status)}</span>
    </div>
  );
  return (
    <li className="relative pl-7">
      <StatusMarker status={status} />
      {openable ? (
        <Link href={`/courses/${courseSlug}/modules/${placement.module.slug}`} className="block rounded-r-lg hover:bg-bg">
          {body}
        </Link>
      ) : (
        <div aria-disabled="true" className="opacity-60">
          {body}
        </div>
      )}
    </li>
  );
}

/** A unit that opens and closes. Native disclosure, so it works without JavaScript and with a keyboard. */
export function UnitSection({
  index,
  title,
  summary,
  open,
  done,
  countable,
  children,
}: {
  index: number;
  title: string;
  summary: string | null;
  open: boolean;
  done: number;
  countable: number;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group rounded-xl border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted transition-transform group-open:rotate-90 motion-reduce:transition-none"
        >
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">
            <span className="text-muted">Unit {index}</span> {title}
          </span>
          {summary && <span className="mt-0.5 line-clamp-1 text-sm text-muted">{summary}</span>}
        </span>
        {countable > 0 && (
          <span className="flex shrink-0 items-center gap-2.5 text-sm tabular-nums text-muted">
            <span>
              {done} of {countable}
            </span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-green-tint" aria-hidden="true">
              <span className="block h-full rounded-full bg-green" style={{ width: `${(done / countable) * 100}%` }} />
            </span>
          </span>
        )}
      </summary>
      <div className="border-t border-line px-4 pb-2 pt-1">
        <ol className="ml-2 border-l border-line">{children}</ol>
      </div>
    </details>
  );
}
