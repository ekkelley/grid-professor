import type { LibraryHelp, Skill } from "@/lib/data";

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
