import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { buildRoadmap, summarize, upNext, type ModuleMedia } from "@/lib/roadmap";

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

/** Names are unique per kind, so an item is fetched by id, or by kind and slug. */
export async function getItemById(id: string): Promise<Item | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("*, workbook_builds(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type SequenceLink = { id: string; slug: string; title: string; position: number };
export type WorkbookContext = {
  /** For a sequence: its members in order. */
  members: Map<string, SequenceLink[]>;
  /** For a member: the sequence it is served in, and its position there. */
  partOf: Map<string, SequenceLink & { of: number }>;
};

export async function getWorkbookContext(itemIds: string[]): Promise<WorkbookContext> {
  const ctx: WorkbookContext = { members: new Map(), partOf: new Map() };
  if (itemIds.length === 0) return ctx;
  const supabase = await createClient();
  const [asSequence, asMember] = await Promise.all([
    supabase
      .from("workbook_members")
      .select("sequence_id, position, member:items!workbook_members_member_id_fkey(id, slug, title)")
      .in("sequence_id", itemIds),
    supabase
      .from("workbook_members")
      .select("member_id, position, sequence:items!workbook_members_sequence_id_fkey(id, slug, title)")
      .in("member_id", itemIds),
  ]);
  for (const row of check(asSequence)) {
    if (!row.member) continue;
    const list = ctx.members.get(row.sequence_id) ?? [];
    list.push({ ...row.member, position: row.position });
    ctx.members.set(row.sequence_id, list.sort((a, b) => a.position - b.position));
  }
  const memberRows = check(asMember);
  if (memberRows.length > 0) {
    const counts = check(
      await supabase.from("workbook_members").select("sequence_id").in("sequence_id", [...new Set(memberRows.map((r) => r.sequence?.id).filter(Boolean))] as string[]),
    );
    for (const row of memberRows) {
      if (!row.sequence) continue;
      const of = counts.filter((c) => c.sequence_id === row.sequence!.id).length;
      ctx.partOf.set(row.member_id, { ...row.sequence, position: row.position, of });
    }
  }
  return ctx;
}

/** Guides derived from these workbooks (a sprint's solution guide), keyed by workbook id. */
export async function getDerivedGuides(workbookIds: string[]): Promise<Map<string, { id: string; slug: string; title: string }[]>> {
  const map = new Map<string, { id: string; slug: string; title: string }[]>();
  if (workbookIds.length === 0) return map;
  const supabase = await createClient();
  const rows = check(
    await supabase.from("items").select("id, slug, title, derived_from").eq("kind", "guide").eq("status", "active").in("derived_from", workbookIds),
  );
  for (const r of rows) {
    if (!r.derived_from) continue;
    map.set(r.derived_from, [...(map.get(r.derived_from) ?? []), { id: r.id, slug: r.slug, title: r.title }]);
  }
  return map;
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
      .select("section, position, items(id, slug, title, kind, summary, duration_seconds, delivery_note)")
      .eq("course_id", courseId),
  );
  return rows.filter((r) => r.items).sort((a, b) => a.position - b.position);
}

export type VideoProgress = { itemId: string; percent: number; bestSessionPercent: number; lastWatchedAt: string };

/** The signed-in viewer's own video progress (row-level security limits reads to their rows). */
export async function getMyVideoProgress(itemIds?: string[]): Promise<Map<string, VideoProgress>> {
  const supabase = await createClient();
  let query = supabase.from("video_progress").select("item_id, percent, best_session_percent, last_watched_at");
  if (itemIds) {
    if (itemIds.length === 0) return new Map();
    query = query.in("item_id", itemIds);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return new Map(
    (data ?? []).map((r) => [
      r.item_id,
      { itemId: r.item_id, percent: Number(r.percent), bestSessionPercent: Number(r.best_session_percent), lastWatchedAt: r.last_watched_at },
    ]),
  );
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

/** What each module holds that the web can track: its video (if any) and whether it has a workbook. */
export async function getModuleMedia(moduleIds: string[]): Promise<Map<string, ModuleMedia>> {
  const map = new Map<string, ModuleMedia>();
  if (moduleIds.length === 0) return map;
  const supabase = await createClient();
  const slots = check(
    await supabase.from("module_slots").select("module_id, position, slot_items(position, items(id, kind, duration_seconds))").in("module_id", moduleIds),
  );
  for (const slot of slots.sort((a, b) => a.position - b.position)) {
    const entry = map.get(slot.module_id) ?? { videoId: null, durationSeconds: null, hasWorkbook: false };
    for (const si of slot.slot_items.sort((a, b) => a.position - b.position)) {
      const item = si.items;
      if (!item) continue;
      if (item.kind === "video" && !entry.videoId) {
        entry.videoId = item.id;
        entry.durationSeconds = item.duration_seconds;
      }
      if (item.kind === "workbook") entry.hasWorkbook = true;
    }
    map.set(slot.module_id, entry);
  }
  return map;
}

/** Skill names per item, for filtering lists. */
export async function getSkillNames(itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (itemIds.length === 0) return map;
  const supabase = await createClient();
  const rows = check(await supabase.from("item_skills").select("item_id, skills(name)").in("item_id", itemIds));
  for (const r of rows) {
    if (!r.skills) continue;
    map.set(r.item_id, [...(map.get(r.item_id) ?? []), r.skills.name].sort((a, b) => a.localeCompare(b)));
  }
  return map;
}

export type Skill = { id: string; slug: string; name: string; type: Database["public"]["Enums"]["skill_type"] };

/** The Excel skills each module's items carry (videos and workbooks; readings are derived and skipped). */
export async function getModuleSkills(moduleIds: string[]): Promise<Map<string, Skill[]>> {
  const map = new Map<string, Skill[]>();
  if (moduleIds.length === 0) return map;
  const supabase = await createClient();
  const slots = check(
    await supabase.from("module_slots").select("module_id, slot_items(items(id, kind, item_skills(skills(id, slug, name, type))))").in("module_id", moduleIds),
  );
  for (const slot of slots) {
    const seen = new Map<string, Skill>(map.get(slot.module_id)?.map((s) => [s.id, s]) ?? []);
    for (const si of slot.slot_items) {
      if (!si.items || si.items.kind === "read") continue;
      for (const link of si.items.item_skills) if (link.skills) seen.set(link.skills.id, link.skills);
    }
    map.set(slot.module_id, [...seen.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }
  return map;
}

export type LibraryHelp = {
  id: string;
  slug: string;
  title: string;
  section: LibrarySection;
  summary: string | null;
  minutes: number | null;
  skills: Skill[];
};

/** Everything in a course's library with the skills it carries, for matching help to a module. */
export async function getLibraryWithSkills(courseId: string): Promise<LibraryHelp[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("course_library")
      .select("section, position, items(id, slug, title, summary, duration_seconds, item_skills(skills(id, slug, name, type)))")
      .eq("course_id", courseId),
  );
  return rows
    .filter((r) => r.items)
    .sort((a, b) => a.position - b.position)
    .map((r) => {
      const seen = new Map<string, Skill>();
      for (const link of r.items!.item_skills) if (link.skills) seen.set(link.skills.id, link.skills);
      return {
        id: r.items!.id,
        slug: r.items!.slug,
        title: r.items!.title,
        section: r.section,
        summary: r.items!.summary,
        minutes: r.items!.duration_seconds ? Math.max(1, Math.round(r.items!.duration_seconds / 60)) : null,
        skills: [...seen.values()],
      };
    });
}

export type Membership = { role: Database["public"]["Enums"]["course_role"]; joinedAt: string; course: Course };

/** The signed-in viewer's courses (row-level security limits this to their own memberships). */
export async function getMyCourses(): Promise<Membership[]> {
  const supabase = await createClient();
  const rows = check(await supabase.from("course_members").select("role, joined_at, courses(*)").order("joined_at", { ascending: false }));
  return rows.filter((r) => r.courses).map((r) => ({ role: r.role, joinedAt: r.joined_at, course: r.courses! }));
}

/** Everything the roadmap needs for one course, for the home page's course cards. */
export async function getCourseProgressSummary(course: Course, signedIn: boolean) {
  const units = await getCoursePath(course.id);
  const media = await getModuleMedia(units.flatMap((u) => u.placements.map((p) => p.module.id)));
  const videoIds = [...media.values()].flatMap((m) => (m.videoId ? [m.videoId] : []));
  const progress = signedIn ? await getMyVideoProgress(videoIds) : new Map<string, VideoProgress>();
  const rows = buildRoadmap(units, media, progress, today(), false);
  return { ...summarize(rows), next: upNext(rows), units: units.length };
}
