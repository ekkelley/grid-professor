import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Course = Tables["courses"]["Row"];
export type Item = Tables["items"]["Row"] & { workbook_builds: Tables["workbook_builds"]["Row"][] };
export type LibrarySection = Database["public"]["Enums"]["library_section"];

export type Placement = {
  id: string;
  position: number;
  isHidden: boolean;
  opensOn: string | null;
  title: string;
  module: { id: string; slug: string; title: string; summary: string | null };
};
export type Unit = { id: string; slug: string; title: string; summary: string | null; position: number; placements: Placement[] };
export type Tag = { slug: string; name: string; kind: "skill" | "topic"; basis: string };

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function listCourses(): Promise<Course[]> {
  const supabase = await createClient();
  return check(await supabase.from("courses").select("*").order("kind", { ascending: false }).order("created_at"));
}

export async function getCourse(slug: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getCoursePath(courseId: string): Promise<Unit[]> {
  const supabase = await createClient();
  const units = check(
    await supabase
      .from("course_units")
      .select("id, slug, title, summary, position, course_modules(id, position, is_hidden, opens_on, title_override, modules(id, slug, title, summary))")
      .eq("course_id", courseId),
  );
  return units
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      title: u.title,
      summary: u.summary,
      position: u.position,
      placements: u.course_modules
        .filter((cm) => cm.modules)
        .map((cm) => ({
          id: cm.id,
          position: cm.position,
          isHidden: cm.is_hidden,
          opensOn: cm.opens_on,
          title: cm.title_override ?? cm.modules!.title,
          module: cm.modules!,
        }))
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);
}

/** The slots of a module, each with its items in order (items in one slot are substitutes). */
export async function getModuleSlots(moduleId: string): Promise<Item[][]> {
  const supabase = await createClient();
  const slots = check(
    await supabase
      .from("module_slots")
      .select("position, slot_items(position, items(*, workbook_builds(*)))")
      .eq("module_id", moduleId),
  );
  return slots
    .sort((a, b) => a.position - b.position)
    .map((s) =>
      s.slot_items
        .sort((a, b) => a.position - b.position)
        .map((si) => si.items)
        .filter((i): i is Item => i !== null),
    );
}

export async function getItem(slug: string): Promise<Item | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("*, workbook_builds(*)").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Items derived from this one, such as a video's reading. */
export async function getDerivedItems(itemId: string): Promise<Item[]> {
  const supabase = await createClient();
  return check(await supabase.from("items").select("*, workbook_builds(*)").eq("derived_from", itemId).order("slug"));
}

export async function getTags(itemIds: string[]): Promise<Tag[]> {
  if (itemIds.length === 0) return [];
  const supabase = await createClient();
  const [skills, topics] = await Promise.all([
    supabase.from("item_skills").select("basis, skills(slug, name)").in("item_id", itemIds),
    supabase.from("item_topics").select("basis, topics(slug, name)").in("item_id", itemIds),
  ]);
  const tags = new Map<string, Tag>();
  for (const row of check(skills)) if (row.skills) tags.set(`s:${row.skills.slug}`, { ...row.skills, kind: "skill", basis: row.basis });
  for (const row of check(topics)) if (row.topics) tags.set(`t:${row.topics.slug}`, { ...row.topics, kind: "topic", basis: row.basis });
  return [...tags.values()].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "skill" ? -1 : 1));
}

export async function getLibrary(courseId: string) {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("course_library")
      .select("section, position, items(id, slug, title, kind, summary, duration_seconds)")
      .eq("course_id", courseId),
  );
  return rows.filter((r) => r.items).sort((a, b) => a.position - b.position);
}

/** Today's date in US Eastern time, as YYYY-MM-DD, for comparing against open dates. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
