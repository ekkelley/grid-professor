import Link from "next/link";
import type { LibraryHelp, Skill } from "@/lib/data";

const SECTION_LABEL: Record<LibraryHelp["section"], string> = {
  function_guide: "Function guide",
  practice: "Practice file",
  explainer: "Concept video",
  game: "Game",
};
const SECTION_ORDER: LibraryHelp["section"][] = ["function_guide", "practice", "explainer", "game"];

/** Library items that share a skill with this module, best matches first. */
export function matchHelp(library: LibraryHelp[], skills: Skill[], excludeItemIds: string[], limit = 6): { item: LibraryHelp; matched: Skill[] }[] {
  const wanted = new Map(skills.map((s) => [s.id, s]));
  const exclude = new Set(excludeItemIds);
  return library
    .filter((item) => !exclude.has(item.id))
    .map((item) => ({ item, matched: item.skills.filter((s) => wanted.has(s.id)) }))
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || SECTION_ORDER.indexOf(a.item.section) - SECTION_ORDER.indexOf(b.item.section))
    .slice(0, limit);
}

export function ModuleHelp({ matches, courseSlug }: { matches: { item: LibraryHelp; matched: Skill[] }[]; courseSlug: string }) {
  return (
    <aside aria-labelledby="module-help" className="rounded-xl border border-line bg-card">
      <div className="border-b border-line px-4 py-3">
        <h2 id="module-help" className="font-semibold">
          Help with this module
        </h2>
        <p className="mt-0.5 text-sm text-muted">Picked for the skills this module uses.</p>
      </div>
      {matches.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">Nothing in the library matches this module&apos;s skills yet.</p>
      ) : (
        <ul>
          {matches.map(({ item, matched }) => (
            <li key={item.id} className="border-line [&:not(:first-child)]:border-t">
              <Link href={`/courses/${courseSlug}/items/${item.slug}`} className="block px-4 py-3 hover:bg-bg">
                <span className="block text-xs text-muted">
                  {SECTION_LABEL[item.section]}
                  {item.minutes ? `, ${item.minutes} min` : ""}
                </span>
                <span className="block font-medium">{item.title}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {matched.map((s) => (
                    <span key={s.id} className="rounded-full bg-green-tint px-2 py-0.5 text-xs font-medium text-green-strong">
                      {s.name}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line px-4 py-2.5">
        <Link href={`/courses/${courseSlug}/library`} className="text-sm font-medium text-green-strong hover:underline">
          Everything in the library
        </Link>
      </div>
    </aside>
  );
}
