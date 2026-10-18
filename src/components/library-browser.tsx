"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { LibrarySection } from "@/lib/data";

export type LibraryEntry = {
  id: string;
  slug: string;
  title: string;
  section: LibrarySection;
  summary: string | null;
  minutes: number | null;
  deliveryNote: string | null;
  skills: string[];
};

const SECTIONS: { key: LibrarySection; title: string; blurb: string }[] = [
  { key: "explainer", title: "Concept videos", blurb: "Short explainers you can come back to any time." },
  { key: "function_guide", title: "Function guides", blurb: "What each Excel function this course uses does, and how to write it." },
  { key: "practice", title: "Practice files", blurb: "Short graded workbooks that drill one idea at a time." },
  { key: "game", title: "Games", blurb: "Timed runs and esports cases of different lengths. Games run in the add-in." },
];

const PREVIEW = 6;

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function LibraryBrowser({ entries, courseSlug }: { entries: LibraryEntry[]; courseSlug: string }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<LibrarySection | "all">("all");
  const [skill, setSkill] = useState("");
  const [expanded, setExpanded] = useState<Set<LibrarySection>>(new Set());
  const searchId = useId();
  const skillId = useId();

  const skills = useMemo(() => [...new Set(entries.flatMap((e) => e.skills))].sort((a, b) => a.localeCompare(b)), [entries]);
  const q = normalize(query.trim());
  const filtering = q.length > 0 || section !== "all" || skill !== "";

  const matches = entries.filter((e) => {
    if (section !== "all" && e.section !== section) return false;
    if (skill && !e.skills.includes(skill)) return false;
    if (!q) return true;
    return [e.title, e.summary ?? "", ...e.skills].some((t) => normalize(t).includes(q));
  });
  const counts = Object.fromEntries(SECTIONS.map((s) => [s.key, entries.filter((e) => e.section === s.key).length])) as Record<LibrarySection, number>;
  const visibleSections = SECTIONS.filter((s) => counts[s.key] > 0 && (section === "all" || section === s.key));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search the library
          </label>
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m13.5 13.5 3.5 3.5" />
          </svg>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, idea or Excel function"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-11 pr-4 text-base placeholder:text-muted"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Kind" className="flex flex-wrap gap-1.5">
            <Chip active={section === "all"} count={entries.length} onClick={() => setSection("all")}>
              All
            </Chip>
            {SECTIONS.filter((s) => counts[s.key] > 0).map((s) => (
              <Chip key={s.key} active={section === s.key} count={counts[s.key]} onClick={() => setSection(section === s.key ? "all" : s.key)}>
                {s.title}
              </Chip>
            ))}
          </div>
          {skills.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <label htmlFor={skillId} className="text-muted">
                Skill
              </label>
              <select
                id={skillId}
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm"
              >
                <option value="">Any</option>
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-muted">
          Nothing matches{q ? ` “${query.trim()}”` : ""}.{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSection("all");
              setSkill("");
            }}
            className="font-medium text-green-strong underline underline-offset-2"
          >
            Clear the search
          </button>
        </p>
      ) : (
        visibleSections.map((s) => {
          const all = matches.filter((e) => e.section === s.key);
          if (all.length === 0) return null;
          const showAll = filtering || expanded.has(s.key) || all.length <= PREVIEW;
          const shown = showAll ? all : all.slice(0, PREVIEW);
          return (
            <section key={s.key} aria-labelledby={`lib-${s.key}`}>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 id={`lib-${s.key}`} className="text-lg font-semibold">
                    {s.title}
                  </h2>
                  <p className="text-sm text-muted">{s.blurb}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">{all.length}</span>
              </div>
              {s.key === "function_guide" ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                  {shown.map((e) => (
                    <li key={e.id}>
                      <Link href={`/courses/${courseSlug}/items/${e.slug}`} className="block h-full rounded-xl border border-line bg-card px-4 py-3 hover:border-green">
                        <span className="block font-semibold">{e.title}</span>
                        {e.summary && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{e.summary}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className="mt-3 overflow-hidden rounded-xl border border-line bg-card">
                  {shown.map((e) => (
                    <li key={e.id} className="border-line [&:not(:first-child)]:border-t">
                      <Link href={`/courses/${courseSlug}/items/${e.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-bg">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{e.title}</span>
                          {e.summary && <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{e.summary}</span>}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-muted">{e.minutes ? `${e.minutes} min` : e.deliveryNote ?? ""}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
              {!showAll && (
                <button
                  type="button"
                  onClick={() => setExpanded(new Set([...expanded, s.key]))}
                  className="mt-2 text-sm font-medium text-green-strong hover:underline"
                >
                  Show all {all.length}
                </button>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function Chip({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-medium ${active ? "border-green bg-green text-white" : "border-line bg-card text-ink hover:bg-bg"}`}
    >
      {children} <span className={`tabular-nums ${active ? "text-white/80" : "text-muted"}`}>{count}</span>
    </button>
  );
}
