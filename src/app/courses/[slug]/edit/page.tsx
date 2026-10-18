import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { addUnit, deleteUnit, moveModule, moveModuleAcrossUnits, moveUnit, renameUnit, setHidden, setOpensOn } from "@/app/actions";
import { getCourse, getCoursePath, getModuleMedia, today } from "@/lib/data";
import { buildRoadmap } from "@/lib/roadmap";
import { canEditCourses, getRole } from "@/lib/role";
import { getJoinCode, getMemberCounts } from "@/lib/admin-data";
import { Badge, Card } from "@/components/ui";
import { ModuleNumber } from "@/components/roadmap";

const iconButton =
  "grid size-8 place-items-center rounded-md border border-line bg-card text-sm text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40";
const textButton = "rounded-md border border-line bg-card px-2.5 py-1 text-sm hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40";
const input = "rounded-md border border-line bg-card px-2 py-1 text-sm";

function IconForm({ action, fields, label, disabled, children }: { action: (f: FormData) => Promise<void>; fields: Record<string, string>; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={iconButton} disabled={disabled} aria-label={label} title={label}>
        {children}
      </button>
    </form>
  );
}

async function EditCourseContent({ params }: Pick<PageProps<"/courses/[slug]/edit">, "params">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  if (course.kind !== "section" || !canEditCourses(await getRole())) redirect(`/courses/${slug}`);
  const [units, code, counts, host] = await Promise.all([getCoursePath(course.id), getJoinCode(course.id), getMemberCounts(course.id), headers().then((h) => h.get("host"))]);
  const media = await getModuleMedia(units.flatMap((u) => u.placements.map((p) => p.module.id)));
  const rows = buildRoadmap(units, media, new Map(), today(), true);
  const numberOf = new Map(rows.map((r) => [r.placement.id, r.number]));

  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-center gap-5 p-5">
        <div className="min-w-0 flex-1 basis-56">
          <h2 className="font-semibold">Students join with a code</h2>
          <p className="mt-0.5 text-sm text-muted">
            Give them the code and send them to {host ?? "the site"}/join. {counts.students === 1 ? "1 student has" : `${counts.students} students have`} joined so far.
          </p>
        </div>
        {code && <p className="rounded-lg bg-green-tint px-4 py-2 font-mono text-2xl font-semibold tracking-[0.25em] text-green-strong">{code}</p>}
      </Card>
      <p className="max-w-prose text-muted">
        Changes here affect only this course; the template stays as it was. Students don&apos;t see hidden modules, and a dated module
        stays locked until its open date. Numbers restart in each unit.
      </p>

      {units.map((unit, ui) => (
        <section key={unit.id} aria-labelledby={`edit-unit-${unit.id}`} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              <IconForm action={moveUnit} fields={{ unit: unit.id, direction: "-1" }} label={`Move unit ${unit.title} up`} disabled={ui === 0}>
                ↑
              </IconForm>
              <IconForm action={moveUnit} fields={{ unit: unit.id, direction: "1" }} label={`Move unit ${unit.title} down`} disabled={ui === units.length - 1}>
                ↓
              </IconForm>
            </div>
            <h2 id={`edit-unit-${unit.id}`} className="text-lg font-semibold">
              <span className="text-muted">Unit {ui + 1}</span> {unit.title}
            </h2>
            <form action={renameUnit} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="unit" value={unit.id} />
              <label htmlFor={`title-${unit.id}`} className="sr-only">
                Unit title
              </label>
              <input id={`title-${unit.id}`} name="title" defaultValue={unit.title} required className={`${input} w-44`} />
              <label htmlFor={`summary-${unit.id}`} className="sr-only">
                Unit summary
              </label>
              <input id={`summary-${unit.id}`} name="summary" defaultValue={unit.summary ?? ""} placeholder="One-line summary" className={`${input} w-64`} />
              <button type="submit" className={textButton}>
                Save
              </button>
            </form>
            {unit.placements.length === 0 && (
              <form action={deleteUnit}>
                <input type="hidden" name="unit" value={unit.id} />
                <button type="submit" className={textButton}>
                  Delete empty unit
                </button>
              </form>
            )}
          </div>

          <Card className="overflow-hidden">
            {unit.placements.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No modules yet. Move one here with the ⇈ and ⇊ buttons on a module in the unit above or below.</p>
            ) : (
              <ol>
                {unit.placements.map((p, i) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 border-line px-4 py-3 [&:not(:first-child)]:border-t">
                    <div className="flex gap-1">
                      <IconForm action={moveModule} fields={{ placement: p.id, direction: "-1" }} label={`Move ${p.title} up`} disabled={i === 0}>
                        ↑
                      </IconForm>
                      <IconForm action={moveModule} fields={{ placement: p.id, direction: "1" }} label={`Move ${p.title} down`} disabled={i === unit.placements.length - 1}>
                        ↓
                      </IconForm>
                      <IconForm action={moveModuleAcrossUnits} fields={{ placement: p.id, direction: "-1" }} label={`Move ${p.title} to the unit above`} disabled={ui === 0}>
                        ⇈
                      </IconForm>
                      <IconForm action={moveModuleAcrossUnits} fields={{ placement: p.id, direction: "1" }} label={`Move ${p.title} to the unit below`} disabled={ui === units.length - 1}>
                        ⇊
                      </IconForm>
                    </div>

                    <ModuleNumber number={numberOf.get(p.id) ?? null} className="w-8" />
                    <span className={`min-w-0 flex-1 font-medium ${p.isHidden ? "text-muted line-through" : ""}`}>{p.title}</span>
                    {p.isHidden && <Badge tone="note">Hidden</Badge>}

                    <form action={setOpensOn} className="flex items-center gap-2">
                      <input type="hidden" name="placement" value={p.id} />
                      <label htmlFor={`opens-${p.id}`} className="text-sm text-muted">
                        Opens
                      </label>
                      <input id={`opens-${p.id}`} type="date" name="opens_on" defaultValue={p.opensOn ?? ""} className={input} />
                      <button type="submit" className={textButton}>
                        Save
                      </button>
                    </form>

                    <form action={setHidden}>
                      <input type="hidden" name="placement" value={p.id} />
                      <input type="hidden" name="hidden" value={String(!p.isHidden)} />
                      <button type="submit" className={textButton}>
                        {p.isHidden ? "Show" : "Hide"}
                      </button>
                    </form>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </section>
      ))}

      <section aria-labelledby="add-unit" className="space-y-3">
        <h2 id="add-unit" className="text-lg font-semibold">
          Add a unit
        </h2>
        <form action={addUnit} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="course" value={course.slug} />
          <label htmlFor="new-unit-title" className="sr-only">
            Unit title
          </label>
          <input id="new-unit-title" name="title" required placeholder="Unit title, e.g. Loan amortization" className={`${input} w-72 py-2`} />
          <button type="submit" className="rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong">
            Add unit
          </button>
        </form>
        <p className="text-sm text-muted">A new unit goes at the end. Move modules into it, or move the unit up, with the arrows.</p>
      </section>
    </div>
  );
}

export default function EditCourse({ params }: PageProps<"/courses/[slug]/edit">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <EditCourseContent params={params} />
    </Suspense>
  );
}
