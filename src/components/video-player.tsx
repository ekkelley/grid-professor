"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { recordVideoWatch } from "@/app/progress/actions";
import type { Interval } from "@/lib/intervals";
import { coveragePercent, mergeIntervals } from "@/lib/intervals";

const FLUSH_EVERY_MS = 10_000;

/**
 * The Vimeo embed, plus watch tracking for signed-in viewers.
 *
 * Tracking counts the stretches of the video that actually play (consecutive time updates less
 * than two seconds apart), so skipping to the end doesn't count as watching. Stretches are sent to
 * the server every ten seconds while playing, and on pause, end, or leaving the page.
 */
export function VideoPlayer({
  itemId,
  src,
  title,
  tracked,
  initialPercent,
}: {
  itemId: string;
  src: string;
  title: string;
  tracked: boolean;
  initialPercent: number | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [percent, setPercent] = useState<number | null>(initialPercent);
  const [sessionPercent, setSessionPercent] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "failed">("idle");

  useEffect(() => {
    if (!tracked || !iframeRef.current) return;
    const player = new Player(iframeRef.current);
    const sessionId = crypto.randomUUID();
    let duration = 0;
    let lastTime: number | null = null;
    let pending: Interval[] = [];
    let session: Interval[] = [];
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    const flush = async () => {
      if (pending.length === 0 || duration <= 0 || inFlight) return;
      const batch = mergeIntervals(pending);
      pending = [];
      inFlight = true;
      setSaving("saving");
      try {
        const result = await recordVideoWatch({ itemId, sessionId, duration, intervals: batch });
        setPercent(result.percent);
        setSaving("idle");
      } catch {
        pending = mergeIntervals([...batch, ...pending]);
        setSaving("failed");
      } finally {
        inFlight = false;
      }
    };

    player.getDuration().then((d) => (duration = d)).catch(() => {});
    player.on("timeupdate", ({ seconds, duration: d }: { seconds: number; duration: number }) => {
      if (d > 0) duration = d;
      if (lastTime !== null && seconds > lastTime && seconds - lastTime < 2) {
        pending.push([lastTime, seconds]);
        session = mergeIntervals([...session, [lastTime, seconds]]);
        setSessionPercent(coveragePercent(session, duration));
      }
      lastTime = seconds;
    });
    player.on("seeked", ({ seconds }: { seconds: number }) => (lastTime = seconds));
    player.on("play", () => {
      if (!timer) timer = setInterval(flush, FLUSH_EVERY_MS);
    });
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      void flush();
    };
    player.on("pause", stop);
    player.on("ended", stop);
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stop);

    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", stop);
      if (timer) clearInterval(timer);
      void flush();
      player.unload().catch(() => {});
    };
  }, [itemId, tracked]);

  const shown = Math.max(percent ?? 0, sessionPercent);

  return (
    <figure>
      <div className="aspect-video overflow-hidden rounded-xl border border-line bg-ink">
        <iframe
          ref={iframeRef}
          src={src}
          title={`Video: ${title}`}
          className="size-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>Video</span>
        {tracked ? (
          <span aria-live="polite">
            Watched {Math.round(shown)}%{saving === "saving" ? ", saving…" : saving === "failed" ? ", not saved yet" : ""}
          </span>
        ) : (
          <span>Sign in to have your viewing count.</span>
        )}
      </figcaption>
    </figure>
  );
}
