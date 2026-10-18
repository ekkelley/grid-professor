import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  formatDate,
  getCourse,
  getCoursePath,
  getDerivedGuides,
  getItemsByIds,
  getLibraryWithSkills,
  getModuleMedia,
  getModuleSkills,
  getModuleSlots,
  getMyVideoProgress,
  getWorkbookContext,
  today,
  type Item,
} from "@/lib/data";
import { buildRoadmap } from "@/lib/roadmap";
import { canEditCourses, getViewer } from "@/lib/role";
import { Note } from "@/components/ui";
import { ReadBody, VideoItem, WorkbookItem, WorkbookPending } from "@/components/item-view";
import { ModuleNumber } from "@/components/roadmap";
import { matchHelp } from "@/components/module-help";
import { ModulePanelProvider, PanelButton, type HelpEntry } from "@/components/module-panel";

const HELP_LABEL = { function_guide: "Function guide", practice: "Practice file", explainer: "Concept video", game: "Game" } as const;

/** A library item as it appears inside the panel: no card frame, the panel is the frame. */
function HelpBody({ item, tracked, progress }: { item: Item; tracked: boolean; progress: number | null }) {
  switch (item.kind) {
    case "guide":
      return (
        <div>
          {item.body_md && (
            <div className="prose-reading text-[15px]">
              <Markdown remarkPlugins={[remarkGfm]}>{item.body_md}</Markdown>
            </div>
          )}
          {item.stored_at && (
            <p className="mt-4 text-xs text-muted">
              Imported from the Grid Professor add-in.{" "}
              <a href={item.stored_at} className="underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
                Source page
              </a>
            </p>
          )}
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          {item.summary && <p className="text-sm text-muted">{item.summary}</p>}
          <VideoItem item={item} tracked={tracked} progress={progress} />
        </div>
      );
    case "workbook":
      return <WorkbookItem item={item} bare />;
    default:
      return item.summary ? <p className="text-sm text-muted">{item.summary}</p> : null;
  }
}

async function ModulePageContent({ params }: Pick<PageProps<"/courses/[slug]/modules/[module]">, "params">) {
  const { slug, module: moduleSlug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const [units, viewer] = await Promise.all([getCoursePath(course.id), getViewer()]);
  const role = viewer.role;
  const editor = canEditCourses(role);

  // The roadmap as this viewer sees it, flattened, so numbers and previous/next follow the course order.
  const media = await getModuleMedia(units.flatMap((u) => u.placements.map((p) => p.module.id)));
  const rows = buildRoadmap(units, media, new Map(), today(), editor);
  const index = rows.findIndex((r) => r.placement.module.slug === moduleSlug);
  if (index === -1) notFound();
  const { placement, unit, number } = rows[index];

  if (!editor && placement.opensOn && placement.opensOn > today()) {
    return <Note>This module opens {formatDate(placement.opensOn)}.</Note>;
  }

  const slots = await getModuleSlots(placement.module.id);
  const items = slots.flat();
  const video = items.find((i) => i.kind === "video");
  const reading = items.find((i) => i.kind === "read");
  const workbooks = items.filter((i) => i.kind === "workbook");
  const workbookIds = workbooks.map((i) => i.id);
  const [workbookContext, derivedGuides, moduleSkills, library] = await Promise.all([
    getWorkbookContext(workbookIds),
    getDerivedGuides(workbookIds),
    getModuleSkills([placement.module.id]),
    getLibraryWithSkills(course.id),
  ]);
  const skills = moduleSkills.get(placement.module.id) ?? [];
  const matches = matchHelp(library, skills, items.map((i) => i.id));
  const helpItems = await getItemsByIds(matches.map((m) => m.item.id));
  const videoIds = [video?.id, ...helpItems.filter((i) => i.kind === "video").map((i) => i.id)].filter((id): id is string => !!id);
  const progress = viewer.user ? await getMyVideoProgress(videoIds) : new Map<string, { percent: number }>();

  const help: HelpEntry[] = matches.flatMap(({ item: match, matched }) => {
    const full = helpItems.find((i) => i.id === match.id);
    if (!full) return [];
    return [
      {
        id: full.id,
        title: full.title,
        label: `${HELP_LABEL[match.section]}${match.minutes ? `, ${match.minutes} min` : ""}`,
        skills: matched.map((s) => s.name),
        node: <HelpBody item={full} tracked={!!viewer.user} progress={progress.get(full.id)?.percent ?? null} />,
      },
    ];
  });

  const prev = rows[index - 1];
  const next = rows[index + 1];

  return (
    <ModulePanelProvider reading={reading ? <ReadBody item={reading} /> : null} help={help} skills={skills.map((s) => s.name)}>
      <article className="space-y-5">
        <header className="space-y-1">
          <p className="text-sm text-muted">
            <Link href={`/courses/${course.slug}`} className="underline-offset-2 hover:underline">
              Unit {units.indexOf(unit) + 1}, {unit.title}
            </Link>
          </p>
          <h2 className="flex items-baseline gap-2.5 text-xl font-semibold tracking-tight">
            <ModuleNumber number={number} />
            <span>{placement.title}</span>
          </h2>
          {placement.isHidden && <Note>Hidden from students in this course.</Note>}
        </header>

        {video ? (
          <VideoItem
            item={video}
            tracked={!!viewer.user}
            progress={progress.get(video.id)?.percent}
            actions={
              <>
                {reading && <PanelButton target="read">Read instead</PanelButton>}
                <PanelButton target="help">Help with this module{help.length > 0 ? ` (${help.length})` : ""}</PanelButton>
              </>
            }
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {reading && <PanelButton target="read">Read</PanelButton>}
            <PanelButton target="help">Help with this module{help.length > 0 ? ` (${help.length})` : ""}</PanelButton>
          </div>
        )}

        {workbooks.map((item) => (
          <WorkbookItem
            key={item.id}
            item={item}
            workbooks={workbookContext}
            guides={derivedGuides.get(item.id)}
            courseSlug={course.slug}
            admin={role === "admin"}
          />
        ))}
        {workbooks.length === 0 && <WorkbookPending />}

        <nav aria-label="Module navigation" className="flex justify-between gap-4 border-t border-line pt-4 text-sm">
          {prev ? (
            <Link href={`/courses/${course.slug}/modules/${prev.placement.module.slug}`} className="text-green-strong hover:underline">
              ← {prev.placement.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/courses/${course.slug}/modules/${next.placement.module.slug}`} className="text-right text-green-strong hover:underline">
              {next.placement.title} →
            </Link>
          )}
        </nav>
      </article>
    </ModulePanelProvider>
  );
}

export default function ModulePage({ params }: PageProps<"/courses/[slug]/modules/[module]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <ModulePageContent params={params} />
    </Suspense>
  );
}
