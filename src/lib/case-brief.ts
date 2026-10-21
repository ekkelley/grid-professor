/**
 * The case brief: what an instructor tells the case builder about the competition case they want.
 *
 * Pure module, no I/O. `CaseBriefParams` is what the request form collects (and what is stored as
 * JSON on a case request); `renderBrief` turns it into the Markdown the case-builder process
 * consumes. The Markdown's sections and vocabulary match `case-builder/kit/09-Case-Brief-Template.md`
 * in the Grid Professor project folder; change both together.
 *
 * Anything the instructor leaves blank is written as "derive", which tells the builder to decide
 * and to say in the design table what it decided.
 */

export type Option<T extends string> = { value: T; label: string; help?: string };

export const DIVISIONS = [
  { value: "varsity", label: "Varsity", help: "Starts where JV's middle sits; scaffolding withdrawn; a full clear is an expert run." },
  { value: "jv", label: "JV", help: "A warm-up start, helper columns and clean data; a strong player can clear it in 30 minutes." },
  { value: "both", label: "Both, as a pair", help: "A JV case and a Varsity sibling built together (see pairing)." },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const PAIRINGS = [
  { value: "overlap", label: "Overlap and extend", help: "JV levels 4 to 7 become Varsity levels 1 to 4, then Varsity adds three new steps." },
  { value: "descaffold", label: "Same data, remove the scaffolding", help: "Delete the helper tab, scramble answer tables, ask geometry instead of aggregation." },
  { value: "harder_class", label: "Same theme, harder problem class", help: "A lookup case becomes a cipher case." },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const RUN_CONTEXTS = [
  { value: "class", label: "My class" },
  { value: "competition", label: "A competition" },
  { value: "club", label: "Club practice" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];

export const EXCEL_FLOORS = [
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
  { value: "provided", label: "Provided", help: "Helper columns laid out, hints naming the function, clean data (JV)." },
  { value: "withdrawn", label: "Withdrawn", help: "Students build their own working (Varsity)." },
  { value: "mixed", label: "Mixed", help: "Provided on early levels, withdrawn later." },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const DATA_SHAPES = [
  { value: "clean", label: "Clean, one value per cell" },
  { value: "packed", label: "Packed, undelimited, format switches (students parse first)" },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const CAPSTONES = [
  { value: "compose", label: "Compose pieces taught in the case" },
  { value: "insight", label: "An inversion or an insight (the key is unknown, recover it)" },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const FULL_CLEAR = [
  { value: "strong_player", label: "A strong player finishes in the time limit" },
  { value: "expert", label: "Only an expert run finishes" },
  { value: "derive", label: "Let the builder decide" },
] as const satisfies readonly Option<string>[];

export const HALVES = [
  { value: "none", label: "No" },
  { value: "derive", label: "Let the builder decide" },
  ...([3, 4, 5, 6, 7] as const).map((n) => ({ value: `L${n}`, label: `Yes, level ${n}` })),
] as const satisfies readonly Option<string>[];

/** Level types the case kit already knows (case-builder/kit/02 and the cases behind it). */
export const LEVEL_TYPES = [
  { value: "derive", label: "Let the builder decide" },
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
  { value: "derive", label: "Let the builder decide" },
  { value: "same_machine", label: "Same machine, one more input", help: "The previous level's working is reused unchanged; one lookup or parameter is added." },
  { value: "compose", label: "Compose", help: "Two taught pieces combined with a new rule." },
  { value: "insight", label: "Inversion or insight", help: "The key is unknown, recover it; a trick that collapses the work." },
] as const satisfies readonly Option<string>[];

export const ANSWER_KINDS = [
  { value: "derive", label: "Let the builder decide" },
  { value: "number", label: "Whole number (unit stated)" },
  { value: "text", label: "Short text (a name, a label)" },
] as const satisfies readonly Option<string>[];

export const SOURCES = [
  { value: "derive", label: "Let the builder decide" },
  { value: "story", label: "The story (inline inputs, no lookup)" },
  { value: "data", label: "The data tables" },
  { value: "map", label: "The map" },
  { value: "data_map", label: "Data and map together" },
] as const satisfies readonly Option<string>[];

export const FORMATS = [
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
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
  levelCount: number;
  bonusCount: number;
  pairing: string;
  runContext: string;
  runWhen: string;
  timeLimit: number;
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
  points: string;
  bonusPoints: string;
  mixing: string;

  levels: LevelParams[];

  bonusRelated: string;
  bonusHard: string;
  bonusNotes: string;

  featureFunctions: string;
  avoidFunctions: string;

  tester: string;
  notes: string;
};

export const DEFAULT_POINTS = "4 / 5 / 6 / 7 / 8 / 9 / 11";
export const DEFAULT_BONUS_POINTS = "30 / 40 / 50 / 60 / 70";

export function defaultLevels(division: string, count = 7): LevelParams[] {
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

/** Default per-game points for a level count: the kit's 4/5/6/7/8/9/11 for 7, otherwise a ramp that sums to 1,000 over 20 games. */
export function defaultPointsFor(count: number): string {
  if (count === 7) return DEFAULT_POINTS;
  const base = Array.from({ length: count }, (_, i) => i + 1);
  const total = base.reduce((a, b) => a + b, 0);
  const pts = base.map((b) => Math.max(1, Math.round((50 * b) / total)));
  return pts.join(" / ");
}

export function defaultBonusPointsFor(count: number): string {
  if (count === 5) return DEFAULT_BONUS_POINTS;
  if (count === 0) return "none";
  return Array.from({ length: count }, (_, i) => 10 * (i + 3)).join(" / ");
}

export function defaultParams(): CaseBriefParams {
  return {
    title: "",
    division: "varsity",
    format: "individual",
    levelCount: 7,
    bonusCount: 5,
    pairing: "derive",
    runContext: "class",
    runWhen: "",
    timeLimit: 30,
    audience: "",
    excelFloor: "365",
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
    halves: "none",
    fullClear: "derive",
    points: DEFAULT_POINTS,
    bonusPoints: DEFAULT_BONUS_POINTS,
    mixing: "",
    levels: defaultLevels("varsity"),
    bonusRelated: "4",
    bonusHard: "1",
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

function clampInt(v: FormDataEntryValue | null, lo: number, hi: number, fallback: number): number {
  const n = Number(str(v, 4));
  return Number.isInteger(n) && n >= lo && n <= hi ? n : fallback;
}

function pick<T extends string>(v: FormDataEntryValue | null, options: readonly Option<T>[], fallback: T): T {
  const s = str(v, 40);
  return (options.find((o) => o.value === s)?.value ?? fallback) as T;
}

/** Read the request form. Unknown values fall back to safe defaults; nothing throws. */
export function paramsFromForm(form: FormData): CaseBriefParams {
  const d = defaultParams();
  const division = pick(form.get("division"), DIVISIONS, "varsity");
  const levelCount = clampInt(form.get("levelCount"), MIN_LEVELS, MAX_LEVELS, 7);
  const bonusCount = clampInt(form.get("bonusCount"), 0, MAX_BONUSES, 5);
  const levels: LevelParams[] = Array.from({ length: levelCount }, (_, i) => i + 1).map((n) => ({
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
  const timeLimit = Number(str(form.get("timeLimit"), 4));
  return {
    title: str(form.get("title"), 120),
    division,
    format: pick(form.get("format"), FORMATS, "individual"),
    levelCount,
    bonusCount,
    pairing: pick(form.get("pairing"), PAIRINGS, "derive"),
    runContext: pick(form.get("runContext"), RUN_CONTEXTS, "class"),
    runWhen: str(form.get("runWhen"), 120),
    timeLimit: Number.isFinite(timeLimit) && timeLimit >= 5 && timeLimit <= 180 ? Math.round(timeLimit) : 30,
    audience: str(form.get("audience"), 600),
    excelFloor: pick(form.get("excelFloor"), EXCEL_FLOORS, "365"),
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
    halves: pick(form.get("halves"), HALVES, "none"),
    fullClear: pick(form.get("fullClear"), FULL_CLEAR, "derive"),
    points: str(form.get("points"), 80) || defaultPointsFor(levelCount),
    bonusPoints: str(form.get("bonusPoints"), 80) || defaultBonusPointsFor(bonusCount),
    mixing: str(form.get("mixing"), 300),
    levels,
    bonusRelated: str(form.get("bonusRelated"), 2) || d.bonusRelated,
    bonusHard: str(form.get("bonusHard"), 2) || d.bonusHard,
    bonusNotes: str(form.get("bonusNotes"), 1500),
    featureFunctions: str(form.get("featureFunctions"), 300),
    avoidFunctions: str(form.get("avoidFunctions"), 300),
    tester: str(form.get("tester"), 200),
    notes: str(form.get("notes")),
  };
}

/** Stored JSON back to params, tolerant of older or partial shapes. */
export function paramsFromJson(raw: unknown): CaseBriefParams {
  const d = defaultParams();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<CaseBriefParams>;
  const levelCount = typeof r.levelCount === "number" && r.levelCount >= MIN_LEVELS && r.levelCount <= MAX_LEVELS ? r.levelCount : 7;
  const bonusCount = typeof r.bonusCount === "number" && r.bonusCount >= 0 && r.bonusCount <= MAX_BONUSES ? r.bonusCount : 5;
  const base = defaultLevels(typeof r.division === "string" ? r.division : d.division, levelCount);
  const levels = base.map((l, i) => {
    const got = Array.isArray(r.levels) ? (r.levels[i] as Partial<LevelParams> | undefined) : undefined;
    const buildsOn = Array.isArray(got?.buildsOn) ? got.buildsOn.filter((m) => Number.isInteger(m) && m >= 1 && m <= i) : l.buildsOn;
    return { ...l, ...(got ?? {}), buildsOn };
  });
  return { ...d, ...r, levelCount, bonusCount, levels, keep: Array.isArray(r.keep) ? r.keep : [], change: Array.isArray(r.change) ? r.change : [] };
}

export type BriefAttachment = { kind: string; fileName: string; note: string | null };
export type BriefMeta = { requesterEmail: string; requestedOn: string; status: string; requestId: string };

function label<T extends string>(options: readonly Option<T>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function block(text: string): string {
  return text.trim() ? text.trim() : "derive";
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

/** One sentence that reads the chain back, so the author can check it at a glance. */
export function chainSummary(levels: LevelParams[]): string {
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
const ANSWER_SHORT: Record<string, string> = { derive: "derive", number: "number", text: "text" };

/** The Markdown case brief. Sections and vocabulary match kit/09-Case-Brief-Template.md. */
export function renderBrief(p: CaseBriefParams, meta: BriefMeta, files: BriefAttachment[]): string {
  const brand = p.brand === "other" ? p.brandOther || "other" : label(BRANDS, p.brand);
  const lines: string[] = [];
  const push = (...xs: string[]) => lines.push(...xs);

  push(`# Case brief: ${p.title || "Untitled case"}`, "");
  push(`Requested by ${meta.requesterEmail} on ${meta.requestedOn} through Grid Professor (request ${meta.requestId}). Status: ${meta.status}.`, "");
  push("Anything marked \"derive\" is the builder's call; the design table must say what was decided and why.", "");

  push("## Identity", "");
  push(`- Working title: ${p.title || "derive"}`);
  push(`- Division: ${label(DIVISIONS, p.division)}${p.division === "both" ? ` (pairing: ${label(PAIRINGS, p.pairing)})` : ""}`);
  push(`- Format: ${label(FORMATS, p.format)}`);
  push(`- Shape: ${p.levelCount} levels x 20 games, ${p.bonusCount} bonus${p.bonusCount === 1 ? "" : "es"}`);
  push(`- Runs: ${label(RUN_CONTEXTS, p.runContext)}${p.runWhen ? `, ${p.runWhen}` : ""}`);
  push(`- Time limit: ${p.timeLimit} minutes`);
  push(`- Audience: ${block(p.audience)}`);
  push(`- Excel floor: ${label(EXCEL_FLOORS, p.excelFloor)}`);
  push(`- Brand: ${brand}`);
  push(`- Author credit: ${p.authorCredit || meta.requesterEmail}`, "");

  push("## Seed", "");
  push("Supply any of these; the rest is derived. Attached files are listed under Attachments.", "");
  push("### Story", "", block(p.story), "");
  push("### Data", "", block(p.data), "");
  push("### Map", "", p.map.trim() ? p.map.trim() : "none", "");
  push("### Rules the case must state", "", block(p.rules), "");
  push("### Example case", "");
  if (p.exampleCase.trim() || p.keep.length || p.change.length) {
    push(p.exampleCase.trim() || "See the attached example case.");
    push(`- Keep: ${p.keep.length ? p.keep.map((k) => label(KEEPABLE, k)).join(", ") : "derive"}`);
    push(`- Change: ${p.change.length ? p.change.map((k) => label(KEEPABLE, k)).join(", ") : "derive"}`);
  } else {
    push("none");
  }
  push("");

  push("## Structure", "");
  push(`- Scaffolding: ${label(SCAFFOLDING, p.scaffolding)}`);
  push(`- Data shape: ${label(DATA_SHAPES, p.dataShape)}`);
  push(`- Capstone: ${label(CAPSTONES, p.capstone)}`);
  push(`- Split a level into two halves with a data change: ${label(HALVES, p.halves)}`);
  push(`- Full clear: ${label(FULL_CLEAR, p.fullClear)}`);
  push(`- Points per game by level: ${p.points}`);
  push(`- Bonus points: ${p.bonusPoints}`);
  push(`- Mix of level types wanted: ${block(p.mixing)}`, "");

  push("## Levels", "");
  push("| L | Type | Builds on | Step | Works from | Answer | One idea |");
  push("|---|---|---|---|---|---|---|");
  p.levels.forEach((l, i) => {
    const on = l.buildsOn.length ? l.buildsOn.map((m) => `L${m}`).join(" + ") : "standalone";
    const step = l.buildsOn.length ? STEP_SHORT[l.step] ?? l.step : "n/a";
    push(`| ${i + 1} | ${LEVEL_TYPE_SHORT[l.type] ?? l.type} | ${on} | ${step} | ${SOURCE_SHORT[l.source] ?? l.source} | ${ANSWER_SHORT[l.answer] ?? l.answer} | ${l.idea.trim() || "derive"} |`);
  });
  push("");
  push(chainSummary(p.levels), "");
  push("Builds on: the earlier levels a level reuses (two or more means it joins those threads). Step: same machine (reuse that working, add one input), compose (two taught pieces plus a new rule), inversion or insight. Works from: which seed the level's inputs come from.", "");

  push("## Bonuses", "");
  push(`- Related to levels: ${p.bonusRelated} of ${p.bonusCount}`);
  push(`- Genuinely hard: ${p.bonusHard}`);
  push(`- Notes: ${block(p.bonusNotes)}`, "");

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
