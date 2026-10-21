"use client";

import { useState, type ReactNode } from "react";
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
  type CaseBriefParams,
  type LevelParams,
  type Option,
} from "@/lib/case-brief";

const input = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const select = "w-full rounded-lg border border-line bg-card px-2.5 py-2 text-sm";
const textarea = `${input} min-h-24 leading-relaxed`;
const primary = "rounded-lg bg-green px-4 py-2 text-sm font-medium text-white hover:bg-green-strong";

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

function Select<T extends string>({ id, name, options, value, onChange }: { id: string; name: string; options: readonly Option<T>[]; value: string; onChange?: (v: string) => void }) {
  const [current, setCurrent] = useState(value);
  const help = options.find((o) => o.value === current)?.help;
  return (
    <>
      <select
        id={id}
        name={name}
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value);
          onChange?.(e.target.value);
        }}
        className={select}
      >
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

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {intro && <p className="mt-1 max-w-prose text-sm text-muted">{intro}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function LevelCard({ n, level, levelCount, onChange }: { n: number; level: LevelParams; levelCount: number; onChange: (l: LevelParams) => void }) {
  const standalone = level.buildsOn.length === 0;
  return (
    <li className="rounded-lg border border-line bg-bg p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Level {n}</h3>
        <span className="text-xs text-muted">
          {n === 1 ? "Level 1 stands alone." : standalone ? "Stands alone: a fresh start." : `Builds on L${level.buildsOn.join(" + L")}.`}
        </span>
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
          <Select id={`l${n}_type`} name={`l${n}_type`} options={LEVEL_TYPES} value={level.type} />
        </Field>
        <Field id={`l${n}_source`} label="Works from">
          <Select id={`l${n}_source`} name={`l${n}_source`} options={SOURCES} value={level.source} />
        </Field>
        <Field id={`l${n}_step`} label="Step from what it builds on">
          {standalone ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted">Not applicable: stands alone</p>
          ) : (
            <Select id={`l${n}_step`} name={`l${n}_step`} options={STEPS} value={level.step} />
          )}
        </Field>
        <Field id={`l${n}_answer`} label="Answer">
          <Select id={`l${n}_answer`} name={`l${n}_answer`} options={ANSWER_KINDS} value={level.answer} />
        </Field>
      </div>
      <Field id={`l${n}_idea`} label="The one idea this level adds (optional)" className="mt-3">
        <input id={`l${n}_idea`} name={`l${n}_idea`} defaultValue={level.idea} maxLength={300} placeholder={n === levelCount ? "e.g. choose the route that minimizes cost, not distance" : "e.g. look up two coordinates and take the distance"} className={input} />
      </Field>
    </li>
  );
}

export function CaseRequestForm({ initial, id, action }: { initial: CaseBriefParams; id?: string; action: (formData: FormData) => Promise<void> }) {
  const [levelCount, setLevelCount] = useState(initial.levelCount);
  const [bonusCount, setBonusCount] = useState(initial.bonusCount);
  const [division, setDivision] = useState(initial.division);
  const [brand, setBrand] = useState(initial.brand);
  const [levels, setLevels] = useState<LevelParams[]>(initial.levels);

  function resize(count: number) {
    setLevelCount(count);
    setLevels((prev) => {
      const fresh = defaultLevels(division, count);
      return fresh.map((l, i) => (prev[i] ? { ...prev[i], buildsOn: prev[i].buildsOn.filter((m) => m <= i) } : l));
    });
  }
  const summary = chainSummary(levels.slice(0, levelCount));

  return (
    <form action={action} className="space-y-6">
      {id && <input type="hidden" name="id" value={id} />}

      <Section title="The case" intro="What it is called, who plays it and where. The builder reads this first.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Working title" className="sm:col-span-2">
            <input id="title" name="title" required defaultValue={initial.title} maxLength={120} placeholder="e.g. Rush Hour Delivery" className={input} />
          </Field>
          <Field id="division" label="Division">
            <Select id="division" name="division" options={DIVISIONS} value={initial.division} onChange={setDivision} />
          </Field>
          {division === "both" ? (
            <Field id="pairing" label="How the JV and Varsity cases relate">
              <Select id="pairing" name="pairing" options={PAIRINGS} value={initial.pairing} />
            </Field>
          ) : (
            <input type="hidden" name="pairing" value={initial.pairing} />
          )}
          <Field id="format" label="Format">
            <Select id="format" name="format" options={FORMATS} value={initial.format} />
          </Field>
          <Field id="runContext" label="Where it runs">
            <Select id="runContext" name="runContext" options={RUN_CONTEXTS} value={initial.runContext} />
          </Field>
          <Field id="runWhen" label="When (optional)">
            <input id="runWhen" name="runWhen" defaultValue={initial.runWhen} maxLength={120} placeholder="e.g. week of Nov 10, or date to be set" className={input} />
          </Field>
          <Field id="timeLimit" label="Time limit, minutes">
            <input id="timeLimit" name="timeLimit" type="number" min={5} max={180} defaultValue={initial.timeLimit} className={input} />
          </Field>
          <Field id="levelCount" label="Levels" help="Twenty games each, plus one Example per level.">
            <input id="levelCount" name="levelCount" type="number" min={MIN_LEVELS} max={MAX_LEVELS} value={levelCount} onChange={(e) => resize(Math.min(MAX_LEVELS, Math.max(MIN_LEVELS, Number(e.target.value) || MIN_LEVELS)))} className={input} />
          </Field>
          <Field id="bonusCount" label="Bonus questions">
            <input id="bonusCount" name="bonusCount" type="number" min={0} max={MAX_BONUSES} value={bonusCount} onChange={(e) => setBonusCount(Math.min(MAX_BONUSES, Math.max(0, Number(e.target.value) || 0)))} className={input} />
          </Field>
          <Field id="audience" label="Who plays it" help="Majors, year, how much Excel they have seen, anything the builder should calibrate to." className="sm:col-span-2">
            <textarea id="audience" name="audience" defaultValue={initial.audience} maxLength={600} className={`${input} min-h-16`} />
          </Field>
          <Field id="excelFloor" label="Excel versions">
            <Select id="excelFloor" name="excelFloor" options={EXCEL_FLOORS} value={initial.excelFloor} />
          </Field>
          <Field id="brand" label="Branding">
            <Select id="brand" name="brand" options={BRANDS} value={initial.brand} onChange={setBrand} />
          </Field>
          {brand === "other" && (
            <Field id="brandOther" label="Describe the branding" className="sm:col-span-2">
              <input id="brandOther" name="brandOther" defaultValue={initial.brandOther} maxLength={200} className={input} />
            </Field>
          )}
          <Field id="authorCredit" label="Author credit on the case (optional)">
            <input id="authorCredit" name="authorCredit" defaultValue={initial.authorCredit} maxLength={120} placeholder="Defaults to your email" className={input} />
          </Field>
        </div>
      </Section>

      <Section
        title="Start from"
        intro="Give the builder whatever you already have: a story, a data set, a map, the rules, an example case, or any combination. Leave the rest blank and it is derived. Files are attached on the next page."
      >
        <Field id="story" label="Story or synopsis" help="A paragraph on the world and what the player does in it.">
          <textarea id="story" name="story" defaultValue={initial.story} maxLength={4000} placeholder="e.g. Drivers pick up orders from restaurants and deliver them to customers across a city grid..." className={textarea} />
        </Field>
        <Field id="data" label="Data" help="Describe the tables you have or want, or say that you will attach a file. Real data needs a source; synthetic data is generated with a fixed seed.">
          <textarea id="data" name="data" defaultValue={initial.data} maxLength={4000} className={textarea} />
        </Field>
        <Field id="map" label="Map" help="A grid, a floor plan, a route network, a board: how big, what sits on it, and how distance is measured (blocks along streets, straight line, hops). Attach an image if you have one.">
          <textarea id="map" name="map" defaultValue={initial.map} maxLength={4000} className={textarea} />
        </Field>
        <Field id="rules" label="Rules the case must state" help="The one or two domain rules players need (a formula, a scoring convention, a penalty). The case tests Excel, not outside knowledge, so every rule is printed in the case.">
          <textarea id="rules" name="rules" defaultValue={initial.rules} maxLength={4000} className={textarea} />
        </Field>
        <Field id="exampleCase" label="An example case to take inspiration from" help="Name it or attach it on the next page, then say what to keep and what to change.">
          <textarea id="exampleCase" name="exampleCase" defaultValue={initial.exampleCase} maxLength={4000} className={`${input} min-h-16`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-medium">Keep from the example</legend>
            <div className="mt-1.5 grid gap-1">
              {KEEPABLE.map((k) => (
                <label key={k.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="keep" value={k.value} defaultChecked={initial.keep.includes(k.value)} className="size-4 accent-green" />
                  {k.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Change from the example</legend>
            <div className="mt-1.5 grid gap-1">
              {KEEPABLE.map((k) => (
                <label key={k.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="change" value={k.value} defaultChecked={initial.change.includes(k.value)} className="size-4 accent-green" />
                  {k.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      <Section title="Shape" intro="The dials that decide how the case feels. Every one can be left to the builder.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="scaffolding" label="Scaffolding">
            <Select id="scaffolding" name="scaffolding" options={SCAFFOLDING} value={initial.scaffolding} />
          </Field>
          <Field id="dataShape" label="Data shape">
            <Select id="dataShape" name="dataShape" options={DATA_SHAPES} value={initial.dataShape} />
          </Field>
          <Field id="capstone" label="Capstone">
            <Select id="capstone" name="capstone" options={CAPSTONES} value={initial.capstone} />
          </Field>
          <Field id="fullClear" label="Who finishes in the time limit">
            <Select id="fullClear" name="fullClear" options={FULL_CLEAR} value={initial.fullClear} />
          </Field>
          <Field id="halves" label="Split a level into two halves with a data change between them">
            <Select id="halves" name="halves" options={HALVES} value={initial.halves} />
          </Field>
          <Field id="mixing" label="Mix of level types" help="e.g. mostly lookup with one geometry level; or at least three different types.">
            <input id="mixing" name="mixing" defaultValue={initial.mixing} maxLength={300} className={input} />
          </Field>
          <Field id="points" label="Points per game, by level" help={`Default for ${levelCount} levels: ${defaultPointsFor(levelCount)}`}>
            <input id="points" name="points" defaultValue={initial.levelCount === levelCount ? initial.points : defaultPointsFor(levelCount)} maxLength={80} className={input} />
          </Field>
          <Field id="bonusPoints" label="Bonus points" help={`Default for ${bonusCount}: ${defaultBonusPointsFor(bonusCount)}`}>
            <input id="bonusPoints" name="bonusPoints" defaultValue={initial.bonusCount === bonusCount ? initial.bonusPoints : defaultBonusPointsFor(bonusCount)} maxLength={80} className={input} />
          </Field>
        </div>
      </Section>

      <Section
        title="Levels"
        intro="Lay out the chain: which levels build on which, how big each step is, and what each level works from. Levels that build on nothing start a fresh thread; a level that builds on two threads joins them."
      >
        <p className="rounded-lg bg-green-tint px-4 py-2 text-sm text-green-strong">{summary}</p>
        <ul className="space-y-3">
          {levels.slice(0, levelCount).map((l, i) => (
            <LevelCard key={i} n={i + 1} level={l} levelCount={levelCount} onChange={(next) => setLevels((prev) => prev.map((x, j) => (j === i ? next : x)))} />
          ))}
        </ul>
      </Section>

      <Section title="Bonuses">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bonusRelated" label={`How many of the ${bonusCount} relate to a level`}>
            <input id="bonusRelated" name="bonusRelated" type="number" min={0} max={bonusCount} defaultValue={Math.min(Number(initial.bonusRelated) || 0, bonusCount)} className={input} />
          </Field>
          <Field id="bonusHard" label="How many are genuinely hard">
            <input id="bonusHard" name="bonusHard" type="number" min={0} max={bonusCount} defaultValue={Math.min(Number(initial.bonusHard) || 0, bonusCount)} className={input} />
          </Field>
          <Field id="bonusNotes" label="Bonus ideas or constraints (optional)" className="sm:col-span-2">
            <textarea id="bonusNotes" name="bonusNotes" defaultValue={initial.bonusNotes} maxLength={1500} className={`${input} min-h-16`} />
          </Field>
        </div>
      </Section>

      <Section title="Functions and delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="featureFunctions" label="Functions or techniques to feature">
            <input id="featureFunctions" name="featureFunctions" defaultValue={initial.featureFunctions} maxLength={300} placeholder="e.g. SUMIFS, permutations by enumeration" className={input} />
          </Field>
          <Field id="avoidFunctions" label="Functions or techniques to avoid">
            <input id="avoidFunctions" name="avoidFunctions" defaultValue={initial.avoidFunctions} maxLength={300} placeholder="e.g. Solver, macros, LAMBDA" className={input} />
          </Field>
          <Field id="tester" label="Who will test it (optional)">
            <input id="tester" name="tester" defaultValue={initial.tester} maxLength={200} className={input} />
          </Field>
          <Field id="notes" label="Anything else" className="sm:col-span-2">
            <textarea id="notes" name="notes" defaultValue={initial.notes} maxLength={4000} className={textarea} />
          </Field>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primary}>
          {id ? "Save and view the brief" : "Create the brief"}
        </button>
        <span className="text-sm text-muted">Nothing is sent to the builder until you submit the request on the next page.</span>
      </div>
    </form>
  );
}
