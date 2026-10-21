"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ANSWER_KINDS,
  BRANDS,
  CAPSTONES,
  DATA_SHAPES,
  DIVISIONS,
  EXCEL_FLOORS,
  FORMATS,
  FULL_CLEAR,
  HALVES,
  KEEPABLE,
  LEVEL_TYPES,
  MAX_BONUSES,
  MAX_LEVELS,
  MIN_LEVELS,
  PAIRINGS,
  RUN_CONTEXTS,
  SCAFFOLDING,
  SOURCES,
  STEPS,
  chainSummary,
  defaultBonusPointsFor,
  defaultLevels,
  defaultPointsFor,
  optionLabel,
  statedFields,
  type CaseBriefParams,
  type LevelParams,
  type Option,
} from "@/lib/case-brief";

const input = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const select = "w-full rounded-lg border border-line bg-card px-2.5 py-2 text-sm";
const textarea = `${input} min-h-20 leading-relaxed`;
const primary = "rounded-lg bg-green px-4 py-2 text-sm font-medium text-white hover:bg-green-strong disabled:cursor-not-allowed disabled:opacity-50";

type Patch = Partial<CaseBriefParams>;

function Field({ id, label, help, children, className = "" }: { id: string; label: string; help?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {help && <p className="mt-0.5 text-xs text-muted">{help}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Select<T extends string>({ id, name, options, value, onChange }: { id: string; name: string; options: readonly Option<T>[]; value: string; onChange: (v: string) => void }) {
  const help = options.find((o) => o.value === value)?.help;
  return (
    <>
      <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </>
  );
}

/** A number box that may be empty, meaning "let the builder decide". */
function OptionalNumber({ id, name, value, min, max, onChange, placeholder }: { id: string; name: string; value: number | null; min: number; max: number; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={value ?? ""}
      placeholder={placeholder ?? "builder decides"}
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (raw === "") return onChange(null);
        const n = Number(raw);
        onChange(Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : null);
      }}
      className={input}
    />
  );
}

/** A collapsed panel with a one-line summary of its current state. */
function Panel({ title, summary, children, defaultOpen = false }: { title: string; summary: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border border-line bg-card" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-md border border-line text-xs text-muted transition-transform group-open:rotate-90">
          ▸
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted">{summary}</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

function LevelCard({ n, level, onChange }: { n: number; level: LevelParams; onChange: (l: LevelParams) => void }) {
  const standalone = level.buildsOn.length === 0;
  return (
    <li className="rounded-lg border border-line bg-bg p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Level {n}</h3>
        <span className="text-xs text-muted">{n === 1 ? "Level 1 stands alone." : standalone ? "Stands alone: a fresh start." : `Builds on L${level.buildsOn.join(" + L")}.`}</span>
      </div>
      {n > 1 && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium">Builds on</legend>
          <p className="text-xs text-muted">Tick every earlier level this one reuses. Two or more means this level joins those threads. None means a fresh start.</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Array.from({ length: n - 1 }, (_, i) => i + 1).map((m) => {
              const on = level.buildsOn.includes(m);
              return (
                <label key={m} className={`cursor-pointer rounded-md border px-2.5 py-1 text-sm ${on ? "border-green bg-green-tint text-green-strong" : "border-line bg-card"}`}>
                  <input
                    type="checkbox"
                    name={`l${n}_on`}
                    value={m}
                    checked={on}
                    onChange={(e) => {
                      const next = e.target.checked ? [...level.buildsOn, m] : level.buildsOn.filter((x) => x !== m);
                      onChange({ ...level, buildsOn: next.sort((a, b) => a - b) });
                    }}
                    className="sr-only"
                  />
                  L{m}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={`l${n}_type`} label="Type">
          <Select id={`l${n}_type`} name={`l${n}_type`} options={LEVEL_TYPES} value={level.type} onChange={(v) => onChange({ ...level, type: v })} />
        </Field>
        <Field id={`l${n}_source`} label="Works from">
          <Select id={`l${n}_source`} name={`l${n}_source`} options={SOURCES} value={level.source} onChange={(v) => onChange({ ...level, source: v })} />
        </Field>
        <Field id={`l${n}_step`} label="Step from what it builds on">
          {standalone ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted">Not applicable: stands alone</p>
          ) : (
            <Select id={`l${n}_step`} name={`l${n}_step`} options={STEPS} value={level.step} onChange={(v) => onChange({ ...level, step: v })} />
          )}
        </Field>
        <Field id={`l${n}_answer`} label="Answer">
          <Select id={`l${n}_answer`} name={`l${n}_answer`} options={ANSWER_KINDS} value={level.answer} onChange={(v) => onChange({ ...level, answer: v })} />
        </Field>
      </div>
      <Field id={`l${n}_idea`} label="The one idea this level adds (optional)" className="mt-3">
        <input id={`l${n}_idea`} name={`l${n}_idea`} value={level.idea} onChange={(e) => onChange({ ...level, idea: e.target.value })} maxLength={300} placeholder="e.g. look up two coordinates and take the distance" className={input} />
      </Field>
    </li>
  );
}

const DERIVED = "builder decides";

function short(options: readonly Option<string>[], v: string): string {
  return v === "derive" ? DERIVED : optionLabel(options, v);
}

export function CaseRequestForm({ initial, id, action }: { initial: CaseBriefParams; id?: string; action: (formData: FormData) => Promise<void> }) {
  const [p, setP] = useState<CaseBriefParams>(initial);
  const set = (patch: Patch) => setP((prev) => ({ ...prev, ...patch }));

  function setLevelCount(count: number | null) {
    setP((prev) => {
      if (count === null) return { ...prev, levelCount: null, levels: [] };
      const fresh = defaultLevels(prev.division, count);
      const levels = fresh.map((l, i) => (prev.levels[i] ? { ...prev.levels[i], buildsOn: prev.levels[i].buildsOn.filter((m) => m <= i) } : l));
      return { ...prev, levelCount: count, levels };
    });
  }

  function setBonusCount(count: number | null) {
    setP((prev) => {
      const clamp = (v: string) => (count === null || v === "" ? v : String(Math.min(Number(v) || 0, count)));
      return { ...prev, bonusCount: count, bonusRelated: count === 0 ? "" : clamp(prev.bonusRelated), bonusHard: count === 0 ? "" : clamp(prev.bonusHard), bonusPoints: count === 0 ? "" : prev.bonusPoints };
    });
  }

  const stated = useMemo(() => statedFields(p), [p]);
  const canSubmit = stated.length > 0;

  const shapeSummary = [
    `Format ${short(FORMATS, p.format)}`,
    `time limit ${p.timeLimit === null ? DERIVED : `${p.timeLimit} min`}`,
    `scaffolding ${short(SCAFFOLDING, p.scaffolding).toLowerCase()}`,
    `capstone ${short(CAPSTONES, p.capstone).toLowerCase()}`,
    `points ${p.points.trim() || DERIVED}`,
  ].join(", ");
  const levelsSummary = chainSummary(p.levels);
  const bonusSummary = p.bonusCount === null ? "Number of bonuses: builder decides." : p.bonusCount === 0 ? "No bonus questions." : `${p.bonusCount} bonus${p.bonusCount === 1 ? "" : "es"}; related to levels: ${p.bonusRelated || DERIVED}; genuinely hard: ${p.bonusHard || DERIVED}.`;
  const seedSummary = [p.map.trim() ? "map given" : "no map", p.rules.trim() ? "rules given" : "rules: builder decides", p.exampleCase.trim() || p.keep.length || p.change.length ? "example case given" : "no example case"].join(", ") + ". Files attach on the next page.";
  const brandSummary = `${p.brand === "other" ? p.brandOther || "other" : optionLabel(BRANDS, p.brand)}; Excel ${short(EXCEL_FLOORS, p.excelFloor) === DERIVED ? DERIVED : p.excelFloor}; functions ${p.featureFunctions.trim() || p.avoidFunctions.trim() ? "noted" : DERIVED}; tester ${p.tester.trim() || DERIVED}.`;

  return (
    <form action={action} className="space-y-5">
      {id && <input type="hidden" name="id" value={id} />}

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Essentials</h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          Fill in whatever you know; one field is enough. Anything you leave blank, the builder chooses for you, and the brief says which was which.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Working title" className="sm:col-span-2">
            <input id="title" name="title" value={p.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} placeholder="e.g. Rush Hour Delivery" className={input} />
          </Field>
          <Field id="story" label="What the case is about" help="A sentence or a paragraph: the world and what the player does in it." className="sm:col-span-2">
            <textarea id="story" name="story" value={p.story} onChange={(e) => set({ story: e.target.value })} maxLength={4000} placeholder="e.g. Drivers pick up orders from restaurants and deliver them to customers across a city grid." className={textarea} />
          </Field>
          <Field id="data" label="Data" help="What the numbers are, or where they come from. A file can be attached on the next page." className="sm:col-span-2">
            <textarea id="data" name="data" value={p.data} onChange={(e) => set({ data: e.target.value })} maxLength={4000} placeholder="e.g. quarterback stats from the 2025 NFL season; or make it up" className={`${input} min-h-14`} />
          </Field>
          <Field id="division" label="Division">
            <Select id="division" name="division" options={DIVISIONS} value={p.division} onChange={(v) => set({ division: v })} />
          </Field>
          {p.division === "both" ? (
            <Field id="pairing" label="How the JV and Varsity cases relate">
              <Select id="pairing" name="pairing" options={PAIRINGS} value={p.pairing} onChange={(v) => set({ pairing: v })} />
            </Field>
          ) : (
            <Field id="levelCount" label="Levels" help="Twenty games each. One level makes a short exercise; seven is the standard case.">
              <OptionalNumber id="levelCount" name="levelCount" value={p.levelCount} min={MIN_LEVELS} max={MAX_LEVELS} onChange={setLevelCount} />
            </Field>
          )}
          <Field id="runContext" label="Where it runs">
            <Select id="runContext" name="runContext" options={RUN_CONTEXTS} value={p.runContext} onChange={(v) => set({ runContext: v })} />
          </Field>
          <Field id="runWhen" label="When">
            <input id="runWhen" name="runWhen" value={p.runWhen} onChange={(e) => set({ runWhen: e.target.value })} maxLength={120} placeholder="e.g. week of Nov 10, or not set yet" className={input} />
          </Field>
          {p.division === "both" && (
            <Field id="levelCount" label="Levels" help="Twenty games each. One level makes a short exercise; seven is the standard case.">
              <OptionalNumber id="levelCount" name="levelCount" value={p.levelCount} min={MIN_LEVELS} max={MAX_LEVELS} onChange={setLevelCount} />
            </Field>
          )}
        </div>
      </section>

      <Panel title="Shape and difficulty" summary={shapeSummary}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="format" label="Format">
            <Select id="format" name="format" options={FORMATS} value={p.format} onChange={(v) => set({ format: v })} />
          </Field>
          <Field id="timeLimit" label="Time limit, minutes" help="The kit's standard is 30.">
            <OptionalNumber id="timeLimit" name="timeLimit" value={p.timeLimit} min={5} max={180} onChange={(v) => set({ timeLimit: v })} />
          </Field>
          <Field id="audience" label="Who plays it" help="Majors, year, how much Excel they have seen." className="sm:col-span-2">
            <textarea id="audience" name="audience" value={p.audience} onChange={(e) => set({ audience: e.target.value })} maxLength={600} className={`${input} min-h-14`} />
          </Field>
          <Field id="scaffolding" label="Scaffolding">
            <Select id="scaffolding" name="scaffolding" options={SCAFFOLDING} value={p.scaffolding} onChange={(v) => set({ scaffolding: v })} />
          </Field>
          <Field id="dataShape" label="Data shape">
            <Select id="dataShape" name="dataShape" options={DATA_SHAPES} value={p.dataShape} onChange={(v) => set({ dataShape: v })} />
          </Field>
          <Field id="capstone" label="Capstone">
            <Select id="capstone" name="capstone" options={CAPSTONES} value={p.capstone} onChange={(v) => set({ capstone: v })} />
          </Field>
          <Field id="fullClear" label="Who finishes in the time limit">
            <Select id="fullClear" name="fullClear" options={FULL_CLEAR} value={p.fullClear} onChange={(v) => set({ fullClear: v })} />
          </Field>
          <Field id="halves" label="Split a level into two halves with a data change between them">
            <Select id="halves" name="halves" options={HALVES} value={p.halves} onChange={(v) => set({ halves: v })} />
          </Field>
          <Field id="mixing" label="Mix of level types" help="e.g. mostly lookup with one geometry level.">
            <input id="mixing" name="mixing" value={p.mixing} onChange={(e) => set({ mixing: e.target.value })} maxLength={300} className={input} />
          </Field>
          <Field id="points" label="Points per game, by level" help={p.levelCount === null ? "One number per level. Blank: the builder uses the kit's pattern." : `One number per level, ${p.levelCount} in all. Blank: ${defaultPointsFor(p.levelCount)}.`}>
            <input id="points" name="points" value={p.points} onChange={(e) => set({ points: e.target.value })} maxLength={80} placeholder={p.levelCount === null ? DERIVED : defaultPointsFor(p.levelCount)} className={input} />
          </Field>
        </div>
      </Panel>

      <Panel title="Levels, one by one" summary={levelsSummary}>
        {p.levelCount === null ? (
          <div className="flex flex-wrap items-end gap-3">
            <Field id="levelCount2" label="Set a level count to lay out the chain" help="Or leave it blank and the builder chooses the count and the chain.">
              <OptionalNumber id="levelCount2" name="levelCount_unused" value={null} min={MIN_LEVELS} max={MAX_LEVELS} onChange={setLevelCount} placeholder="e.g. 7" />
            </Field>
          </div>
        ) : (
          <>
            <p className="max-w-prose text-sm text-muted">
              Which levels build on which, how big each step is, and what each level works from. Levels that build on nothing start a fresh thread; a level that builds on two threads joins them.
            </p>
            <p className="rounded-lg bg-green-tint px-4 py-2 text-sm text-green-strong">{levelsSummary}</p>
            <ul className="space-y-3">
              {p.levels.map((l, i) => (
                <LevelCard key={i} n={i + 1} level={l} onChange={(next) => setP((prev) => ({ ...prev, levels: prev.levels.map((x, j) => (j === i ? next : x)) }))} />
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel title="Bonuses" summary={bonusSummary}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bonusCount" label="How many bonus questions" help="The standard case has five. Zero means none.">
            <OptionalNumber id="bonusCount" name="bonusCount" value={p.bonusCount} min={0} max={MAX_BONUSES} onChange={setBonusCount} />
          </Field>
          {p.bonusCount !== 0 && (
            <>
              <Field id="bonusPoints" label="Bonus points" help={p.bonusCount === null ? "One number per bonus." : `One number per bonus, ${p.bonusCount} in all. Blank: ${defaultBonusPointsFor(p.bonusCount)}.`}>
                <input id="bonusPoints" name="bonusPoints" value={p.bonusPoints} onChange={(e) => set({ bonusPoints: e.target.value })} maxLength={80} placeholder={p.bonusCount === null ? DERIVED : defaultBonusPointsFor(p.bonusCount)} className={input} />
              </Field>
              <Field id="bonusRelated" label="How many relate to a level">
                <input id="bonusRelated" name="bonusRelated" type="number" min={0} max={p.bonusCount ?? MAX_BONUSES} value={p.bonusRelated} placeholder={DERIVED} onChange={(e) => set({ bonusRelated: e.target.value })} className={input} />
              </Field>
              <Field id="bonusHard" label="How many are genuinely hard">
                <input id="bonusHard" name="bonusHard" type="number" min={0} max={p.bonusCount ?? MAX_BONUSES} value={p.bonusHard} placeholder={DERIVED} onChange={(e) => set({ bonusHard: e.target.value })} className={input} />
              </Field>
              <Field id="bonusNotes" label="Bonus ideas or constraints" className="sm:col-span-2">
                <textarea id="bonusNotes" name="bonusNotes" value={p.bonusNotes} onChange={(e) => set({ bonusNotes: e.target.value })} maxLength={1500} className={`${input} min-h-14`} />
              </Field>
            </>
          )}
        </div>
      </Panel>

      <Panel title="Map, rules and an example case" summary={seedSummary}>
        <Field id="map" label="Map" help="A grid, a floor plan, a route network, a board: how big, what sits on it, and how distance is measured. Attach an image on the next page if you have one.">
          <textarea id="map" name="map" value={p.map} onChange={(e) => set({ map: e.target.value })} maxLength={4000} className={textarea} />
        </Field>
        <Field id="rules" label="Rules the case must state" help="The one or two domain rules players need (a formula, a scoring convention, a penalty). The case tests Excel, not outside knowledge, so every rule is printed in the case.">
          <textarea id="rules" name="rules" value={p.rules} onChange={(e) => set({ rules: e.target.value })} maxLength={4000} className={textarea} />
        </Field>
        <Field id="exampleCase" label="An example case to take inspiration from" help="Name it here or attach it on the next page, then say what to keep and what to change.">
          <textarea id="exampleCase" name="exampleCase" value={p.exampleCase} onChange={(e) => set({ exampleCase: e.target.value })} maxLength={4000} className={`${input} min-h-14`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["keep", "change"] as const).map((which) => (
            <fieldset key={which}>
              <legend className="text-sm font-medium">{which === "keep" ? "Keep from the example" : "Change from the example"}</legend>
              <div className="mt-1.5 grid gap-1">
                {KEEPABLE.map((k) => (
                  <label key={k.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={which}
                      value={k.value}
                      checked={p[which].includes(k.value)}
                      onChange={(e) => set({ [which]: e.target.checked ? [...p[which], k.value] : p[which].filter((x) => x !== k.value) } as Patch)}
                      className="size-4 accent-green"
                    />
                    {k.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Panel>

      <Panel title="Brand, functions and delivery" summary={brandSummary}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="brand" label="Branding">
            <Select id="brand" name="brand" options={BRANDS} value={p.brand} onChange={(v) => set({ brand: v })} />
          </Field>
          {p.brand === "other" ? (
            <Field id="brandOther" label="Describe the branding">
              <input id="brandOther" name="brandOther" value={p.brandOther} onChange={(e) => set({ brandOther: e.target.value })} maxLength={200} className={input} />
            </Field>
          ) : (
            <Field id="authorCredit" label="Author credit on the case" help="Defaults to your email.">
              <input id="authorCredit" name="authorCredit" value={p.authorCredit} onChange={(e) => set({ authorCredit: e.target.value })} maxLength={120} className={input} />
            </Field>
          )}
          <Field id="excelFloor" label="Excel versions">
            <Select id="excelFloor" name="excelFloor" options={EXCEL_FLOORS} value={p.excelFloor} onChange={(v) => set({ excelFloor: v })} />
          </Field>
          <Field id="tester" label="Who will test it">
            <input id="tester" name="tester" value={p.tester} onChange={(e) => set({ tester: e.target.value })} maxLength={200} className={input} />
          </Field>
          <Field id="featureFunctions" label="Functions or techniques to feature">
            <input id="featureFunctions" name="featureFunctions" value={p.featureFunctions} onChange={(e) => set({ featureFunctions: e.target.value })} maxLength={300} placeholder="e.g. SUMIFS, permutations by enumeration" className={input} />
          </Field>
          <Field id="avoidFunctions" label="Functions or techniques to avoid">
            <input id="avoidFunctions" name="avoidFunctions" value={p.avoidFunctions} onChange={(e) => set({ avoidFunctions: e.target.value })} maxLength={300} placeholder="e.g. Solver, macros, LAMBDA" className={input} />
          </Field>
          <Field id="notes" label="Anything else" className="sm:col-span-2">
            <textarea id="notes" name="notes" value={p.notes} onChange={(e) => set({ notes: e.target.value })} maxLength={4000} className={textarea} />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={primary} disabled={!canSubmit}>
            {id ? "Save and view the brief" : "Create the brief"}
          </button>
          <p className="text-sm text-muted">
            {canSubmit ? (
              <>
                You have set: {stated.join(", ")}. The builder chooses the rest. Nothing is sent until you submit on the next page.
              </>
            ) : (
              "Fill in any one field to continue."
            )}
          </p>
        </div>
      </div>
    </form>
  );
}
