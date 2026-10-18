import type { Placement, Unit, VideoProgress } from "@/lib/data";

/** A module counts as done on the web once this much of its video has been watched. Workbook grades come from the add-in. */
export const DONE_PERCENT = 90;

export type ModuleMedia = { videoId: string | null; durationSeconds: number | null; hasWorkbook: boolean };

export type ModuleStatus =
  | { kind: "done"; percent: number }
  | { kind: "in_progress"; percent: number }
  | { kind: "not_started"; minutes: number | null }
  | { kind: "locked"; opensOn: string }
  | { kind: "addin" };

/** One row of the roadmap: a placement with its number ("2.3"), unit and status. */
export type RoadmapRow = {
  placement: Placement;
  unit: Unit;
  number: string | null;
  media: ModuleMedia | undefined;
  status: ModuleStatus;
};

export function statusFor(
  placement: Placement,
  media: ModuleMedia | undefined,
  progress: VideoProgress | undefined,
  now: string,
  editor: boolean,
): ModuleStatus {
  if (!editor && placement.opensOn && placement.opensOn > now) return { kind: "locked", opensOn: placement.opensOn };
  if (!media?.videoId) return { kind: "addin" };
  const percent = progress?.percent ?? 0;
  if (percent >= DONE_PERCENT) return { kind: "done", percent };
  if (percent > 0) return { kind: "in_progress", percent };
  return { kind: "not_started", minutes: media.durationSeconds ? Math.max(1, Math.round(media.durationSeconds / 60)) : null };
}

/**
 * Flattens the course into numbered rows as this viewer sees it. Numbers restart in each unit
 * ("2.3" is the third module of unit 2); hidden modules, which only editors see, get no number.
 */
export function buildRoadmap(
  units: Unit[],
  media: Map<string, ModuleMedia>,
  progress: Map<string, VideoProgress>,
  now: string,
  editor: boolean,
): RoadmapRow[] {
  const rows: RoadmapRow[] = [];
  units.forEach((unit, u) => {
    let n = 0;
    for (const placement of unit.placements) {
      if (placement.isHidden && !editor) continue;
      const number = placement.isHidden ? null : `${u + 1}.${++n}`;
      const m = media.get(placement.module.id);
      rows.push({ placement, unit, number, media: m, status: statusFor(placement, m, m?.videoId ? progress.get(m.videoId) : undefined, now, editor) });
    }
  });
  return rows;
}

/** The first module the viewer can open and hasn't finished, in course order. */
export function upNext(rows: RoadmapRow[]): RoadmapRow | undefined {
  return rows.find((r) => r.status.kind === "in_progress" || r.status.kind === "not_started");
}

/** Modules with a video count toward web progress, locked ones included: the denominator is the semester. */
export function summarize(rows: RoadmapRow[]): { done: number; countable: number } {
  const countable = rows.filter((r) => r.media?.videoId && !r.placement.isHidden);
  return { done: countable.filter((r) => r.status.kind === "done").length, countable: countable.length };
}
