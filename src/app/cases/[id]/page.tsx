import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  addCaseRequestFile,
  addDeliverable,
  deleteCaseRequest,
  postCaseRequestMessage,
  removeCaseRequestFile,
  reopenCaseRequest,
  saveBuilderNotes,
  submitCaseRequest,
  updateCaseRequestStatus,
} from "@/app/cases/actions";
import { FILE_KIND_LABEL, STATUS_LABEL, STATUS_ORDER, getCaseRequest, isClosed, type CaseRequest, type CaseRequestStatus } from "@/lib/case-requests";
import { getViewer } from "@/lib/role";
import { Badge, ButtonLink, Card, Note } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

const input = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
const primary = "rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";
const secondary = "rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium hover:bg-bg";
const quiet = "text-xs text-muted hover:text-ink hover:underline";

// The Grid Professor Case Builder project on claude.ai; set NEXT_PUBLIC_CASE_BUILDER_PROJECT_URL in Vercel to link straight to it.
const CASE_BUILDER_PROJECT = process.env.NEXT_PUBLIC_CASE_BUILDER_PROJECT_URL || "https://claude.ai/projects";

function tone(status: CaseRequestStatus): "neutral" | "green" | "note" {
  if (status === "delivered" || status === "deployed") return "green";
  if (status === "submitted" || status === "in_progress") return "note";
  return "neutral";
}

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function when(iso: string): string {
  return iso.slice(0, 10);
}

function kickoffText(r: CaseRequest): string {
  return `I want to build a new MECC-format case from a Grid Professor case request (${r.title}, request ${r.id}). The build package is attached: read case-brief.md first, then 02, 03, 04, 07 and the reference code. Restate the level chain in one sentence and confirm it with me, then propose the design table with the "from the brief" and "source" columns and stop for my approval. Where the brief says "derive", say what you decided and why. The Builder's notes section takes precedence over a derived default, never over something the requester stated.`;
}

function FileList({ r, files, removable }: { r: CaseRequest; files: CaseRequest["files"]; removable: boolean }) {
  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
          <div className="min-w-0">
            <a href={`/cases/${r.id}/files/${f.id}`} className="font-medium hover:text-green-strong hover:underline" download>
              {f.file_name}
            </a>
            <p className="text-xs text-muted">
              {f.kind === "deliverable" ? when(f.created_at) : FILE_KIND_LABEL[f.kind]}, {size(f.size_bytes)}
              {f.note && <>. {f.note}</>}
            </p>
          </div>
          {removable && (
            <form action={removeCaseRequestFile}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="file" value={f.id} />
              <button type="submit" className={quiet}>
                Remove
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

function Thread({ r, viewerEmail }: { r: CaseRequest; viewerEmail: string }) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Thread</h2>
        <p className="text-sm text-muted">Questions, answers and every status change, visible to the requester and the builder.</p>
      </div>
      {r.events.length > 0 && (
        <ol className="space-y-3">
          {r.events.map((e) => (
            <li key={e.id} className={e.kind === "status" ? "text-sm text-muted" : "rounded-lg border border-line px-3 py-2 text-sm"}>
              {e.kind === "status" ? (
                <>
                  <span className="font-medium text-ink">{e.body}</span> {e.authorEmail === viewerEmail ? "You" : (e.authorEmail ?? "Someone")}, {when(e.created_at)}.
                </>
              ) : (
                <>
                  <p className="text-xs text-muted">
                    {e.authorEmail === viewerEmail ? "You" : (e.authorEmail ?? "Someone")}, {when(e.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{e.body}</p>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <form action={postCaseRequestMessage} className="space-y-2">
        <input type="hidden" name="id" value={r.id} />
        <label htmlFor="thread-body" className="sr-only">
          Message
        </label>
        <textarea id="thread-body" name="body" required maxLength={4000} placeholder="Write to the other side..." className={`${input} min-h-16 w-full`} />
        <button type="submit" className={secondary}>
          Post
        </button>
      </form>
    </Card>
  );
}

async function CaseContent({ params }: Pick<PageProps<"/cases/[id]">, "params">) {
  const { id } = await params;
  const [request, viewer] = await Promise.all([getCaseRequest(id), getViewer()]);
  if (!request) notFound();
  const admin = viewer.role === "admin";
  const open = !isClosed(request.status) && request.status !== "in_progress";
  const editable = request.status === "draft" || request.status === "submitted";
  const ready = request.deliverables.length > 0 && (request.status === "delivered" || request.status === "deployed");
  const viewerEmail = viewer.user?.email ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            <Link href="/cases" className="hover:underline">
              Case requests
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <Badge tone={tone(request.status)}>{STATUS_LABEL[request.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Requested {when(request.created_at)}
            {admin && request.requesterEmail && <> by {request.requesterEmail}</>}; last changed {when(request.updated_at)}.
            {request.assignment_link && (
              <>
                {" "}
                Add-in assignment:{" "}
                {/^https?:\/\//.test(request.assignment_link) ? (
                  <a href={request.assignment_link} className="text-green-strong hover:underline">
                    {request.assignment_link}
                  </a>
                ) : (
                  <span className="font-mono">{request.assignment_link}</span>
                )}
                .
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <ButtonLink href={`/cases/${request.id}/edit`} variant="secondary">
              Edit answers
            </ButtonLink>
          )}
          <a href={`/cases/${request.id}/brief`} className={secondary} download>
            Download brief (.md)
          </a>
        </div>
      </div>

      {request.status === "draft" && <Note>This is a draft. Read the brief below, attach any files it refers to, then submit it. The builder only sees submitted requests.</Note>}

      {ready && (
        <Card className="space-y-3 border-green bg-green-tint p-5">
          <h2 className="font-semibold text-green-strong">Your case is ready</h2>
          <p className="text-sm">
            {request.status === "deployed" ? "It is registered in the Grid Professor add-in, so students can open the Blank in Excel and be graded live." : "Download the files below. The Blank is what students open; the Solution and Answer Key are for you."}
          </p>
          <FileList r={request} files={request.deliverables} removable={false} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="prose-reading text-[15px]">
              <Markdown remarkPlugins={[remarkGfm]}>{request.brief_md}</Markdown>
            </div>
          </Card>
          <Thread r={request} viewerEmail={viewerEmail} />
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Attachments</h2>
            <p className="text-sm text-muted">Data files, a map image, an example case, anything the brief refers to. Up to 4 MB each.</p>
            {request.files.length > 0 && <FileList r={request} files={request.files} removable={open} />}
            {open && (
              <form action={addCaseRequestFile} className="space-y-2">
                <input type="hidden" name="id" value={request.id} />
                <label htmlFor="file-kind" className="block text-sm font-medium">
                  What is it
                </label>
                <select id="file-kind" name="kind" className={`${input} w-full`}>
                  {(["data", "map", "example_case", "other"] as const).map((k) => (
                    <option key={k} value={k}>
                      {FILE_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
                <label htmlFor="file-input" className="block text-sm font-medium">
                  File
                </label>
                <input id="file-input" name="file" type="file" required accept=".xlsx,.xlsm,.csv,.tsv,.txt,.md,.json,.png,.jpg,.jpeg,.pdf" className="block w-full text-sm" />
                <label htmlFor="file-note" className="block text-sm font-medium">
                  Note (optional)
                </label>
                <input id="file-note" name="note" maxLength={300} placeholder="e.g. prices by month, 2025" className={`${input} w-full`} />
                <button type="submit" className={secondary}>
                  Attach
                </button>
              </form>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Status</h2>
            {request.status === "draft" && (
              <form action={submitCaseRequest} className="space-y-2">
                <input type="hidden" name="id" value={request.id} />
                <button type="submit" className={`${primary} w-full`}>
                  Submit request
                </button>
                <p className="text-xs text-muted">You can still edit it until building starts.</p>
              </form>
            )}
            {request.status === "submitted" && (
              <form action={reopenCaseRequest}>
                <input type="hidden" name="id" value={request.id} />
                <p className="mb-2 text-sm text-muted">Submitted{request.submitted_at && ` ${when(request.submitted_at)}`}. Waiting for the builder.</p>
                <button type="submit" className={`${secondary} w-full`}>
                  Take back to draft
                </button>
              </form>
            )}
            {request.status === "in_progress" && <p className="text-sm text-muted">The case is being built from this brief. Changes go in the thread.</p>}
            {request.status === "delivered" && <p className="text-sm text-muted">Delivered{request.delivered_at && ` ${when(request.delivered_at)}`}. Have someone solve the Blank cold before it runs; wording fixes go in the thread.</p>}
            {request.status === "deployed" && <p className="text-sm text-muted">Deployed{request.deployed_at && ` ${when(request.deployed_at)}`}. Schedule it in your course like any other workbook.</p>}
            {request.status === "declined" && <p className="text-sm text-muted">Declined. See the thread.</p>}
            {request.status === "draft" && (
              <form action={deleteCaseRequest}>
                <input type="hidden" name="id" value={request.id} />
                <button type="submit" className={quiet}>
                  Delete this draft
                </button>
              </form>
            )}
          </Card>

          {admin && (
            <>
              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Builder&apos;s notes</h2>
                <p className="text-sm text-muted">Guidance for the build. Rendered into the brief under its own heading; the requester sees it.</p>
                <form action={saveBuilderNotes} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <label htmlFor="builder-notes" className="sr-only">
                    Builder&apos;s notes
                  </label>
                  <textarea id="builder-notes" name="builder_notes" defaultValue={request.builder_notes ?? ""} maxLength={8000} placeholder="e.g. Use the 2025 season, keep real names, one formula per level for a 10-minute slot." className={`${input} min-h-28 w-full`} />
                  <button type="submit" className={`${secondary} w-full`}>
                    Save notes
                  </button>
                </form>
              </Card>

              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Build</h2>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  <li>
                    <a href={`/cases/${request.id}/package`} className="font-medium text-green-strong hover:underline" download>
                      Download the build package
                    </a>{" "}
                    (brief, attachments{request.deliverables.length > 0 ? ", previous deliverables" : ""}, manifest, kickoff). Extract it into <code>case-builder/cases/</code>.
                  </li>
                  <li>
                    <CopyButton text={kickoffText(request)} label="Copy the kickoff prompt" className="font-medium text-green-strong hover:underline" />, then{" "}
                    <a href={CASE_BUILDER_PROJECT} className="font-medium text-green-strong hover:underline" target="_blank" rel="noreferrer">
                      open the case-builder project
                    </a>
                    , start a chat, attach the package and paste.
                  </li>
                  <li>Approve the design table there; when the files are in the case folder, deliver them below.</li>
                </ol>
              </Card>

              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Deliver</h2>
                {request.deliverables.length > 0 && <FileList r={request} files={request.deliverables} removable />}
                <form action={addDeliverable} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <label htmlFor="deliverable-input" className="block text-sm font-medium">
                    Files (Solution, Blank, Answer Key, notes)
                  </label>
                  <input id="deliverable-input" name="file" type="file" multiple required accept=".xlsx,.xlsm,.md,.pdf,.txt,.csv,.zip" className="block w-full text-sm" />
                  <label htmlFor="deliverable-note" className="block text-sm font-medium">
                    Note (optional)
                  </label>
                  <input id="deliverable-note" name="note" maxLength={300} placeholder="e.g. Grid Professor pair, v1" className={`${input} w-full`} />
                  <button type="submit" className={`${secondary} w-full`}>
                    Upload
                  </button>
                </form>
              </Card>

              <Card className="space-y-3 p-5">
                <h2 className="font-semibold">Move it along</h2>
                <form action={updateCaseRequestStatus} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <label htmlFor="admin-status" className="block text-sm font-medium">
                    Status
                  </label>
                  <select id="admin-status" name="status" defaultValue={request.status} className={`${input} w-full`}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="assignment-link" className="block text-sm font-medium">
                    Add-in assignment link or id (for Deployed)
                  </label>
                  <input id="assignment-link" name="assignment_link" defaultValue={request.assignment_link ?? ""} maxLength={500} placeholder="e.g. https://app.gridprof.com/... or an assignment id" className={`${input} w-full`} />
                  <label htmlFor="status-note" className="block text-sm font-medium">
                    Note for the thread (optional)
                  </label>
                  <input id="status-note" name="note" maxLength={2000} placeholder="e.g. Files above; tester list in NOTES.md" className={`${input} w-full`} />
                  <button type="submit" className={`${primary} w-full`}>
                    Save
                  </button>
                </form>
                <p className="text-xs text-muted">Deliver after the files are uploaded; deploy after the tester pass, once the case is registered in the add-in.</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CasePage({ params }: PageProps<"/cases/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <CaseContent params={params} />
    </Suspense>
  );
}
