"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/role";
import { coveragePercent, coveredSeconds, mergeIntervals, parseIntervals, type Interval } from "@/lib/intervals";

export type WatchReport = { itemId: string; sessionId: string; duration: number; intervals: Interval[] };
export type WatchResult = { percent: number; bestSessionPercent: number };

/**
 * Record a stretch of video watching for the signed-in viewer.
 *
 * Writes one append-only event, then updates the viewer's rollup for the video: the union of
 * everything they have ever played (percent), and the best single viewing (best_session_percent).
 */
export async function recordVideoWatch(report: WatchReport): Promise<WatchResult> {
  const { user } = await requireUser();
  const intervals = parseIntervals(report.intervals);
  const duration = Number(report.duration);
  const sessionId = String(report.sessionId).slice(0, 64);
  if (!/^[0-9a-f-]{36}$/.test(report.itemId) || !Number.isFinite(duration) || duration <= 0 || intervals.length === 0) {
    throw new Error("Nothing to record.");
  }

  const admin = createAdminClient();
  const { data: item, error: itemError } = await admin.from("items").select("id, kind").eq("id", report.itemId).single();
  if (itemError || item.kind !== "video") throw new Error("Not a video.");

  const { error: eventError } = await admin.from("video_watch_events").insert({
    user_id: user.id,
    item_id: item.id,
    session_id: sessionId,
    duration_seconds: duration,
    intervals,
  });
  if (eventError) throw new Error(eventError.message);

  // This viewing so far: every event with this session id.
  const { data: sessionEvents } = await admin
    .from("video_watch_events")
    .select("intervals")
    .eq("user_id", user.id)
    .eq("item_id", item.id)
    .eq("session_id", sessionId);
  const sessionPercent = coveragePercent(
    (sessionEvents ?? []).flatMap((e) => parseIntervals(e.intervals)),
    duration,
  );

  const { data: existing } = await admin
    .from("video_progress")
    .select("intervals, best_session_percent, first_watched_at")
    .eq("user_id", user.id)
    .eq("item_id", item.id)
    .maybeSingle();

  const merged = mergeIntervals([...(existing ? parseIntervals(existing.intervals) : []), ...intervals]);
  const percent = coveragePercent(merged, duration);
  const bestSessionPercent = Math.max(Number(existing?.best_session_percent ?? 0), sessionPercent);

  const { error: upsertError } = await admin.from("video_progress").upsert(
    {
      user_id: user.id,
      item_id: item.id,
      duration_seconds: duration,
      intervals: merged,
      watched_seconds: Math.round(coveredSeconds(merged, duration) * 100) / 100,
      percent,
      best_session_percent: bestSessionPercent,
      first_watched_at: existing?.first_watched_at ?? new Date().toISOString(),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
  if (upsertError) throw new Error(upsertError.message);

  return { percent, bestSessionPercent };
}
