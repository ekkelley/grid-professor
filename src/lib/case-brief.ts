/**
 * The case brief: what an instructor tells the case builder about the competition case they want.
 *
 * Pure module, no I/O. `CaseBriefParams` is what the request form collects (and what is stored as
 * JSON on a case request); `renderBrief` turns it into the Markdown the case-builder process
 * consumes. The Markdown's sections and vocabulary match `case-builder/kit/09-Case-Brief-Template.md`
 * in the Grid Professor project folder; change both together.
 *
 * Everything is optional. A request needs at least one stated field; anything left blank is
 * written as "derive", which tells the builder to decide and to say in the design table what it
 * decided. The brief lists what the requester stated so the builder knows what they care about.
 */

export type Option<T extends string> = { value: T; label: string; help?: string };

const DERIVE = { value: "derive", label: "Let the builder decide" } as const;

export const DIVISIONS = [
  DERIVE,
  { value: "varsity", label: "Varsity", help: "Starts where JV's middle sits; scaffolding withdrawn; a full clear is an expert run." },
  { value: "jv", label: "JV", help: "A warm-up start, helper columns and clean data; a strong player can clear it in the time limit." },
  { value: "both", label: "Both, as a pair", help: "A JV case and a Varsity sibling built together." },
] as const satisfies readonly Option<string>[];

export const PAIRINGS = [
  DERIVE,
  { value: "overlap", label: "Overlap and extend", help: "JV levels 4 to 7 become Varsity levels 1 to 4, then Varsity adds three new steps." },
  { value: "descaffold", label: "Same data, remove the scaffolding", help: "Delete the helper tab, scramble answer tables, ask geometry instead of aggregation." },
  { value: "harder_class", label: "Same theme, harder problem class", help: "A lookup case becomes a cipher case." },
] as const satisfies readonly Option<string>[];

export const RUN_CONTEXTS = [
  DERIVE,
  { value: "class", label: "My class" },
  { value: "competition", label: "A competition" },
  { value: "club", label: "Club practice" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];

export const FORMATS = [DERIVE, { value: "individual", label: "Individual" }, { value: "team", label: "Team" }] as const satisfies readonly Option<string>[];

export const EXCEL_FLOORS = [
  DERIVE,
  { value: "365", label: "Microsoft 365 (XLOOKUP, dynamic arrays available)" },
  { value: "2019", label: "Some students may be on Excel 2019 or older (INDEX/MATCH only)" },
] as const satisfies readonly Option<string>[];

export const BRANDS = [
  { value: "grid-professor", label: "Grid Professor" },
  { value: "mecc", label: "MECC" },
  { value: "utk", label: "UTK (draft palette)" },
  { value: "other", label: "Other (describe below)" },
] as const satisfies readonly Option<string>[];

/** What the builder may keep from an example case the instructor points at. */
export const KEEPABLE = [
  { value: "story", label: "Story and theme" },
  { value: "data", label: "Data tables" },
  { value: "level_types", label: "Level types" },
  { value: "chain", label: "Chain and step sizes" },
  { value: "answers", label: "Answer kinds and units" },
  { value: "points", label: "Points pattern" },
  { value: "bonuses", label: "Bonus questions" },
  { value: "division", label: "Division" },
  { value: "scaffolding", label: "Scaffolding" },
] as const satisfies readonly Option<string>[];

export const SCAFFOLDING = [
  DERIVE,
  { value: "provided", label: "Provided", help: "Helper columns laid out, hints naming the function, clean data (JV)." },
  { value: "withdrawn", label: "Withdrawn", help: "Students build their own working (Varsity)." },
  { value: "mixed", label: "Mixed", help: "Provided on early levels, withdrawn later." },
] as const satisfies readonly Option<string>[];

export const DATA_SHAPES = [
  DERIVE,
  { value: "clean", label: "Clean, one value per cell" },
  { value: "packed", label: "Packed, undelimited, format switches (students parse first)" },
] as const satisfies readonly Option<string>[];

export const CAPSTONES = [
  DERIVE,
  { value: "compose", label: "Compose pieces taught in the case" },
  { value: "insight", label: "An inversion or an insight (the key is unknown, recover it)" },
] as const satisfies readonly Option<string>[];

export const FULL_CLEAR = [
  DERIVE,
  { value: "strong_player", label: "A strong player finishes in the time limit" },
  { value: "expert", label: "Only an expert run finishes" },
] as const satisfies readonly Option<string>[];

export const HALVES = [
  DERIVE,
  { value: "none", label: "No" },
  ...([3, 4, 5, 6, 7] as const).map((n) => ({ value: `L${n}`, label: `Yes, level ${n}` })),
] as const satisfies readonly Option<string>[];

/** Level types the case kit already knows (case-builder/kit/02 and the cases behind it). */
export const LEVEL_TYPES = [
  DERIVE,
  { value: "lookup", label: "Lookup and aggregate", help: "Key into a table, combine columns, SUMIFS over a group." },
  { value: "rules", label: "Rules and classification", help: "Apply a stated rule set; answers may be text (a class, a name)." },
  { value: "formula", label: "Stated formula", help: "Plug inputs into an equation the case gives." },
  { value: "simulation", label: "Simulation or iteration", help: "A multi-step process per game (period by period)." },
  { value: "geometry", label: "Geometry", help: "Coordinates, distance, nearest, enumerate-and-minimize." },
  { value: "parsing", label: "Parsing packed data", help: "Pull keys and values out of strings before any lookup." },
  { value: "cipher", label: "Cipher or transform", help: "Encode or decode with a key; the Varsity version recovers the key." },
  { value: "conversion", label: "Conversion with direction", help: "Rates that depend on which way you go; cross rates; chains." },
  { value: "inversion", label: "Inversion", help: "The forward machine is taught; ask for the unknown input." },
] as const satisfies readonly Option<string>[];

export const STEPS = [
  DERIVE,
  { value: "same_machine", label: "Same machine, one more input", help: "The previous level's working is reused unchanged; one lookup or parameter is added." },
  { value: "compose", label: "Compose", help: "Two taught pieces combined with a new rule." },
  { value: "insight", label: "Inversion or insight", help: "The key is unknown, recover it; a trick that collapses the work." },
] as const satisfies readonly Option<string>[];

export const ANSWER_KINDS = [
  DERIVE,
  { value: "number", label: "Whole number (unit stated)" },
  { value: "text", label: "Short text (a name, a label)" },
] as const satisfies readonly Option<string>[];

export const SOURCES = [
  DERIVE,
  { value: "story", label: "The story (inline inputs, no lookup)" },
  { value: "data", label: "The data tables" },
  { value: "map", label: "The map" },
  { value: "data_map", label: "Data and map together" },
] as const satisfies readonly Option<string>[];

export const MIN_LEVELS = 1;
export const MAX_LEVELS = 10;
export const MAX_BONUSES = 8;

export type LevelParams = {
  type: string;
  /** Earlier level numbers this level builds on (empty = standalone). Several are allowed: a capstone can join two threads. */
  buildsOn: number[];
  step: string;
  /** Which seed the level works from: story, data, map. */
  source: string;
  answer: string;
  idea: string;
};

export type CaseBriefParams = {
  title: string;
  division: string;
  format: string;
  /** null = let the builder decide. */
  levelCount: number | null;
  bonusCount: number | null;
  pairing: string;
  runContext: string;
  runWhen: string;
  timeLimit: number | null;
  audience: string;
  excelFloor: string;
  brand: string;
  brandOther: string;
  authorCredit: string;

  story: string;
  data: string;
  map: string;
  rules: string;
  exampleCase: string;
  keep: string[];
  change: string[];

  scaffolding: string;
  dataShape: string;
  capstone: string;
  halves: string;
  fullClear: string;
  /** "" = derive. */
  points: string;
  bonusPoints: string;
  mixing: string;

  /** One per level when levelCount is set; empty otherwise. */
  levels: LevelParams[];

  bonusRelated: string;
  bonusHard: string;
  bonusNotes: string;

  featureFunctions: string;
  avoidFunctions: string;

  tester: string;
  notes: string;
};

export function defaultLevels(division: string, count: number): LevelParams[] {
  // A straight chain with small steps early and composition at the end is the kit's default arc.
  const composeFrom = Math.max(2, Math.round(count * (division === "jv" ? 0.8 : 0.65)));
  return Array.from({ length: count }, (_, i) => i + 1).map((n) => ({
    type: "derive",
    buildsOn: n === 1 ? [] : [n - 1],
    step: n === 1 ? "derive" : n < composeFrom ? "same_machine" : "compose",
    source: "derive",
    answer: "derive",
    idea: "",
  }));
}

/** The kit's per-game points for a level count: 4/5/6/7/8/9/11 for 7, otherwise a ramp that sums to 1,000 over 20 games. */
export function defaultPointsFor(count: number): string {
  if (count === 7) return "4 / 5 / 6 / 7 / 8 / 9 / 11";
  const base = Array.from({ length: count }, (_, i) => i + 1);
  const total = base.reduce((a, b) => a + b, 0);
  return base.map((b) => Math.max(1, Math.round((50 * b) / total))).join(" / ");
}

export function defaultBonusPointsFor(count: number): string {
  if (count === 5) return "30 / 40 / 50 / 60 / 70";
  if (count === 0) return "none";
  return Array.from({ length: count }, (_, i) => 10 * (i + 3)).join(" / ");
}

export function defaultParams(): CaseBriefParams {
  return {
    title: "",
    division: "derive",
    format: "derive",
    levelCount: null,
    bonusCount: null,
    pairing: "derive",
    runContext: "derive",
    runWhen: "",
    timeLimit: null,
    audience: "",
    excelFloor: "derive",
    brand: "grid-professor",
    brandOther: "",
    authorCredit: "",
    story: "",
    data: "",
    map: "",
    rules: "",
    exampleCase: "",
    keep: [],
    change: [],
    scaffolding: "derive",
    dataShape: "derive",
    capstone: "derive",
    halves: "derive",
    fullClear: "derive",
    points: "",
    bonusPoints: "",
    mixing: "",
    levels: [],
    bonusRelated: "",
    bonusHard: "",
    bonusNotes: "",
    featureFunctions: "",
    avoidFunctions: "",
    tester: "",
    notes: "",
  };
}

function str(v: FormDataEntryValue | null, max = 4000): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function optInt(v: FormDataEntryValue | null, lo: number, hi: number): number | null {
  const s = str(v, 4);
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

function pick<T extends string>(v: FormDataEntryValue | null, options: readonly Option<T>[], fallback: T): T {
  const s = str(v, 40);
  return (options.find((o) => o.value === s)?.value ?? fallback) as T;
}

/** Read the request form. Unknown values fall back to "derive"; nothing throws. */
export function paramsFromForm(form: FormData): CaseBriefParams {
  const d = defaultParams();
  const division = pick(form.get("division"), DIVISIONS, "derive");
  const levelCount = optInt(form.get("levelCount"), MIN_LEVELS, MAX_LEVELS);
  const bonusCount = optInt(form.get("bonusCount"), 0, MAX_BONUSES);
  const levels: LevelParams[] =
    levelCount === null
      ? []
      : Array.from({ length: levelCount }, (_, i) => i + 1).map((n) => ({
          type: pick(form.get(`l${n}_type`), LEVEL_TYPES, "derive"),
          buildsOn:
            n === 1
              ? []
              : form
                  .getAll(`l${n}_on`)
                  .map((v) => Number(str(v, 3)))
                  .filter((m) => Number.isInteger(m) && m >= 1 && m < n)
                  .sort((a, b) => a - b),
          step: pick(form.get(`l${n}_step`), STEPS, "derive"),
          source: pick(form.get(`l${n}_source`), SOURCES, "derive"),
          answer: pick(form.get(`l${n}_answer`), ANSWER_KINDS, "derive"),
          idea: str(form.get(`l${n}_idea`), 300),
        }));
  const clampBonus = (v: FormDataEntryValue | null) => {
    const n = optInt(v, 0, MAX_BONUSES);
    if (n === null) return "";
    return String(bonusCount === null ? n : Math.min(n, bonusCount));
  };
  return {
    ...d,
    title: str(form.get("title"), 120),
    division,
    format: pick(form.get("format"), FORMATS, "derive"),
    levelCount,
    bonusCount,
    pairing: pick(form.get("pairing"), PAIRINGS, "derive"),
    runContext: pick(form.get("runContext"), RUN_CONTEXTS, "derive"),
    runWhen: str(form.get("runWhen"), 120),
    timeLimit: optInt(form.get("timeLimit"), 5, 180),
    audience: str(form.get("audience"), 600),
    excelFloor: pick(form.get("excelFloor"), EXCEL_FLOORS, "derive"),
    brand: pick(form.get("brand"), BRANDS, "grid-professor"),
    brandOther: str(form.get("brandOther"), 200),
    authorCredit: str(form.get("authorCredit"), 120),
    story: str(form.get("story")),
    data: str(form.get("data")),
    map: str(form.get("map")),
    rules: str(form.get("rules")),
    exampleCase: str(form.get("exampleCase")),
    keep: form.getAll("keep").map((v) => str(v, 40)).filter((v) => KEEPABLE.some((k) => k.value === v)),
    change: form.getAll("change").map((v) => str(v, 40)).filter((v) => KEEPABLE.some((k) => k.value === v)),
    scaffolding: pick(form.get("scaffolding"), SCAFFOLDING, "derive"),
    dataShape: pick(form.get("dataShape"), DATA_SHAPES, "derive"),
    capstone: pick(form.get("capstone"), CAPSTONES, "derive"),
    halves: pick(form.get("halves"), HALVES, "derive"),
    fullClear: pick(form.get("fullClear"), FULL_CLEAR, "derive"),
    points: str(form.get("points"), 80),
    bonusPoints: bonusCount === 0 ? "" : str(form.get("bonusPoints"), 80),
    mixing: str(form.get("mixing"), 300),
    levels,
    bonusRelated: bonusCount === 0 ? "" : clampBonus(form.get("bonusRelated")),
    bonusHard: bonusCount === 0 ? "" : clampBonus(form.get("bonusHard")),
    bonusNotes: str(form.get("bonusNotes"), 1500),
    featureFunctions: str(form.get("featureFunctions"), 300),
    avoidFunctions: str(form.get("avoidFunctions"), 300),
    tester: str(form.get("tester"), 200),
    notes: str(form.get("notes")),
  };
}

/** Stored JSON back to params, tolerant of older shapes (counts that were plain numbers, missing keys). */
export function paramsFromJson(raw: unknown): CaseBriefParams {
  const d = defaultParams();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : null);
  const levelCount = int(r.levelCount, MIN_LEVELS, MAX_LEVELS);
  const bonusCount = int(r.bonusCount, 0, MAX_BONUSES);
  const division = typeof r.division === "string" ? r.division : d.division;
  const base = levelCount === null ? [] : defaultLevels(division, levelCount);
  const levels = base.map((l, i) => {
    const got = Array.isArray(r.levels) ? (r.levels[i] as Partial<LevelParams> | undefined) : undefined;
    const buildsOn = Array.isArray(got?.buildsOn) ? got.buildsOn.filter((m) => Number.isInteger(m) && m >= 1 && m <= i) : l.buildsOn;
    return { ...l, ...(got ?? {}), buildsOn };
  });
  const out: CaseBriefParams = { ...d };
  for (const k of Object.keys(d) as (keyof CaseBriefParams)[]) {
    const v = r[k];
    if (typeof d[k] === "string" && typeof v === "string") (out as unknown as Record<string, unknown>)[k] = v;
  }
  out.levelCount = levelCount;
  out.bonusCount = bonusCount;
  out.timeLimit = int(r.timeLimit, 5, 180);
  out.levels = levels;
  out.keep = Array.isArray(r.keep) ? r.keep.filter((x): x is string => typeof x === "string") : [];
  out.change = Array.isArray(r.change) ? r.change.filter((x): x is string => typeof x === "string") : [];
  return out;
}

/** The fields the requester actually set, as short labels. Empty means the request says nothing yet. */
export function statedFields(p: CaseBriefParams): string[] {
  const out: string[] = [];
  const has = (v: string) => v.trim() !== "";
  if (has(p.title)) out.push("title");
  if (has(p.story)) out.push("what it is about");
  if (has(p.data)) out.push("data");
  if (has(p.map)) out.push("map");
  if (has(p.rules)) out.push("rules");
  if (has(p.exampleCase) || p.keep.length || p.change.length) out.push("example case");
  if (p.division !== "derive") out.push("division");
  if (p.format !== "derive") out.push("format");
  if (p.levelCount !== null) out.push("level count");
  if (p.bonusCount !== null) out.push("bonus count");
  if (p.runContext !== "derive" || has(p.runWhen)) out.push("where it runs");
  if (p.timeLimit !== null) out.push("time limit");
  if (has(p.audience)) out.push("audience");
  if (p.excelFloor !== "derive") out.push("Excel floor");
  if (p.brand !== "grid-professor" || has(p.brandOther)) out.push("brand");
  if (has(p.authorCredit)) out.push("author credit");
  if (p.scaffolding !== "derive") out.push("scaffolding");
  if (p.dataShape !== "derive") out.push("data shape");
  if (p.capstone !== "derive") out.push("capstone");
  if (p.halves !== "derive") out.push("halves");
  if (p.fullClear !== "derive") out.push("full clear");
  if (has(p.points)) out.push("points");
  if (has(p.bonusPoints)) out.push("bonus points");
  if (has(p.mixing)) out.push("mix of level types");
  if (p.levelCount !== null) {
    const base = defaultLevels(p.division, p.levelCount);
    const changed = p.levels.some((l, i) => {
      const b = base[i];
      return l.type !== b.type || l.step !== b.step || l.source !== b.source || l.answer !== b.answer || has(l.idea) || l.buildsOn.join(",") !== b.buildsOn.join(",");
    });
    if (changed) out.push("level chain");
  }
  if (has(p.bonusRelated) || has(p.bonusHard) || has(p.bonusNotes)) out.push("bonuses");
  if (has(p.featureFunctions) || has(p.avoidFunctions)) out.push("functions");
  if (has(p.tester)) out.push("tester");
  if (has(p.notes)) out.push("notes");
  return out;
}

export type BriefAttachment = { kind: string; fileName: string; note: string | null };
export type BriefMeta = { requesterEmail: string; requestedOn: string; status: string; requestId: string };

export function optionLabel<T extends string>(options: readonly Option<T>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function block(text: string): string {
  return text.trim() ? text.trim() : "derive";
}

function derive(v: string): string {
  return v === "Let the builder decide" ? "derive" : v;
}

const LEVEL_TYPE_SHORT: Record<string, string> = {
  derive: "derive",
  lookup: "lookup and aggregate",
  rules: "rules and classification",
  formula: "stated formula",
  simulation: "simulation",
  geometry: "geometry",
  parsing: "parsing",
  cipher: "cipher",
  conversion: "conversion",
  inversion: "inversion",
};
const STEP_SHORT: Record<string, string> = { derive: "derive", same_machine: "same machine", compose: "compose", insight: "inversion or insight" };
const SOURCE_SHORT: Record<string, string> = { derive: "derive", story: "story", data: "data", map: "map", data_map: "data and map" };
const ANSWER_SHORT: Record<string, string> = { derive: "derive", number: "number", text: "text" };

/** One sentence that reads the chain back, so the author can check it at a glance. */
export function chainSummary(levels: LevelParams[]): string {
  if (levels.length === 0) return "Level count and chain: let the builder decide.";
  const threads: number[][] = [];
  const parts: string[] = [];
  levels.forEach((l, i) => {
    const n = i + 1;
    if (l.buildsOn.length === 0) {
      threads.push([n]);
    } else if (l.buildsOn.length === 1 && l.buildsOn[0] === n - 1 && threads.some((t) => t[t.length - 1] === n - 1)) {
      threads.find((t) => t[t.length - 1] === n - 1)!.push(n);
    } else {
      parts.push(`L${n} joins ${l.buildsOn.map((m) => `L${m}`).join(" and ")}`);
      threads.push([n]);
    }
  });
  const runs = threads.filter((t) => t.length > 1).map((t) => `L${t[0]} to L${t[t.length - 1]} chain together`);
  const singles = threads.filter((t) => t.length === 1 && !parts.some((p) => p.startsWith(`L${t[0]} `))).map((t) => `L${t[0]} stands alone`);
  return [...runs, ...parts, ...singles].join("; ") + ".";
}

/** A title for the request row when the requester gave none: the first words of what they did say. */
export function titleFor(p: CaseBriefParams): string {
  if (p.title.trim()) return p.title.trim();
  const seed = [p.story, p.data, p.map, p.rules, p.exampleCase, p.notes].find((s) => s.trim());
  if (seed) {
    const words = seed.trim().split(/\s+/).slice(0, 8).join(" ");
    return (words.length > 60 ? words.slice(0, 57) + "..." : words) + " (untitled)";
  }
  return "Untitled case";
}

/** The Markdown case brief. Sections and vocabulary match kit/09-Case-Brief-Template.md. */
export function renderBrief(p: CaseBriefParams, meta: BriefMeta, files: BriefAttachment[]): string {
  const brand = p.brand === "other" ? p.brandOther || "other" : optionLabel(BRANDS, p.brand);
  const stated = statedFields(p);
  const lines: string[] = [];
  const push = (...xs: string[]) => lines.push(...xs);

  push(`# Case brief: ${titleFor(p)}`, "");
  push(`Requested by ${meta.requesterEmail} on ${meta.requestedOn} through Grid Professor (request ${meta.requestId}). Status: ${meta.status}.`, "");
  push(`Stated by the requester: ${stated.length ? stated.join(", ") : "nothing yet"}. Everything else is marked "derive": the builder's call, and the design table must say what was decided and why.`, "");

  push("## Identity", "");
  push(`- Working title: ${p.title.trim() || "derive"}`);
  push(`- Division: ${derive(optionLabel(DIVISIONS, p.division))}${p.division === "both" ? ` (pairing: ${derive(optionLabel(PAIRINGS, p.pairing))})` : ""}`);
  push(`- Format: ${derive(optionLabel(FORMATS, p.format))}`);
  push(`- Shape: ${p.levelCount === null ? "levels derive" : `${p.levelCount} level${p.levelCount === 1 ? "" : "s"} x 20 games`}, ${p.bonusCount === null ? "bonuses derive" : `${p.bonusCount} bonus${p.bonusCount === 1 ? "" : "es"}`}`);
  push(`- Runs: ${derive(optionLabel(RUN_CONTEXTS, p.runContext))}${p.runWhen ? `, ${p.runWhen}` : ""}`);
  push(`- Time limit: ${p.timeLimit === null ? "derive (the kit's standard is 30 minutes)" : `${p.timeLimit} minutes`}`);
  push(`- Audience: ${block(p.audience)}`);
  push(`- Excel floor: ${derive(optionLabel(EXCEL_FLOORS, p.excelFloor))}`);
  push(`- Brand: ${brand}`);
  push(`- Author credit: ${p.authorCredit || meta.requesterEmail}`, "");

  push("## Seed", "");
  push("Supply any of these; the rest is derived. Attached files are listed under Attachments.", "");
  push("### Story", "", block(p.story), "");
  push("### Data", "", block(p.data), "");
  push("### Map", "", p.map.trim() ? p.map.trim() : "none stated (derive one if the story wants it)", "");
  push("### Rules the case must state", "", block(p.rules), "");
  push("### Example case", "");
  if (p.exampleCase.trim() || p.keep.length || p.change.length) {
    push(p.exampleCase.trim() || "See the attached example case.");
    push(`- Keep: ${p.keep.length ? p.keep.map((k) => optionLabel(KEEPABLE, k)).join(", ") : "derive"}`);
    push(`- Change: ${p.change.length ? p.change.map((k) => optionLabel(KEEPABLE, k)).join(", ") : "derive"}`);
  } else {
    push("none");
  }
  push("");

  push("## Structure", "");
  push(`- Scaffolding: ${derive(optionLabel(SCAFFOLDING, p.scaffolding))}`);
  push(`- Data shape: ${derive(optionLabel(DATA_SHAPES, p.dataShape))}`);
  push(`- Capstone: ${derive(optionLabel(CAPSTONES, p.capstone))}`);
  push(`- Split a level into two halves with a data change: ${derive(optionLabel(HALVES, p.halves))}`);
  push(`- Full clear: ${derive(optionLabel(FULL_CLEAR, p.fullClear))}`);
  push(`- Points per game by level: ${p.points.trim() || (p.levelCount === null ? "derive" : `derive (kit default for ${p.levelCount}: ${defaultPointsFor(p.levelCount)})`)}`);
  push(`- Bonus points: ${p.bonusCount === 0 ? "none" : p.bonusPoints.trim() || (p.bonusCount === null ? "derive" : `derive (kit default for ${p.bonusCount}: ${defaultBonusPointsFor(p.bonusCount)})`)}`);
  push(`- Mix of level types wanted: ${block(p.mixing)}`, "");

  push("## Levels", "");
  if (p.levels.length === 0) {
    push("Level count and chain: derive. The kit's default is seven levels in a straight chain, small steps early and composition at the end.", "");
  } else {
    push("| L | Type | Builds on | Step | Works from | Answer | One idea |");
    push("|---|---|---|---|---|---|---|");
    p.levels.forEach((l, i) => {
      const on = l.buildsOn.length ? l.buildsOn.map((m) => `L${m}`).join(" + ") : "standalone";
      const step = l.buildsOn.length ? (STEP_SHORT[l.step] ?? l.step) : "n/a";
      push(`| ${i + 1} | ${LEVEL_TYPE_SHORT[l.type] ?? l.type} | ${on} | ${step} | ${SOURCE_SHORT[l.source] ?? l.source} | ${ANSWER_SHORT[l.answer] ?? l.answer} | ${l.idea.trim() || "derive"} |`);
    });
    push("");
    push(chainSummary(p.levels), "");
  }
  push("Builds on: the earlier levels a level reuses (two or more means it joins those threads). Step: same machine (reuse that working, add one input), compose (two taught pieces plus a new rule), inversion or insight. Works from: which seed the level's inputs come from.", "");

  push("## Bonuses", "");
  if (p.bonusCount === 0) {
    push("None.", "");
  } else {
    push(`- Related to levels: ${p.bonusRelated.trim() || "derive"}${p.bonusCount === null ? "" : ` of ${p.bonusCount}`}`);
    push(`- Genuinely hard: ${p.bonusHard.trim() || "derive"}`);
    push(`- Notes: ${block(p.bonusNotes)}`, "");
  }

  push("## Functions", "");
  push(`- Feature: ${block(p.featureFunctions)}`);
  push(`- Avoid: ${block(p.avoidFunctions)}`, "");

  push("## Delivery", "");
  push("- Files: Solution, Blank, Answer Key, under case-builder/cases/<case>/");
  push(`- Brand: ${brand}`);
  push(`- Tester: ${block(p.tester)}`, "");

  push("## Attachments", "");
  if (files.length === 0) push("none");
  files.forEach((f) => push(`- ${f.kind.replace("_", " ")}: ${f.fileName}${f.note ? ` (${f.note})` : ""}`));
  push("");

  push("## Anything else", "", block(p.notes), "");
  return lines.join("\n");
}
