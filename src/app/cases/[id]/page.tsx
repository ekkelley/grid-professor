import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { addCaseRequestFile, deleteCaseRequest, removeCaseRequestFile, reopenCaseRequest, submitCaseRequest, updateCaseRequestStatus } from "@/app/cases/actions";
import { FILE_KIND_LABEL, STATUS_LABEL, getCaseRequest, type CaseRequestStatus } from "@/lib/case-requests";
import { getViewer } from "@/lib/role";
import { Badge, ButtonLink, Card, Note } from "@/components/ui";

const input = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
const primary = "rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";
const secondary = "rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium hover:bg-bg";

function tone(status: CaseRequestStatus): "neutral" | "green" | "note" {
  if (status === "delivered") return "green";
  if (status === "submitted" || status === "in_progress") return "note";
  return "neutral";
}

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function CaseContent({ params }: Pick<PageProps<"/cases/[id]">, "params">) {
  const { id } = await params;
  const [request, viewer] = await Promise.all([getCaseRequest(id), getViewer()]);
  if (!request) notFound();
  const admin = viewer.role === "admin";
  const open = request.status === "draft" || request.status === "submitted";
  const editable = request.status !== "in_progress" && request.status !== "delivered";

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
            Requested {request.created_at.slice(0, 10)}
            {admin && request.requesterEmail && <> by {request.requesterEmail}</>}; last changed {request.updated_at.slice(0, 10)}.
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

      {request.status === "draft" && (
        <Note>
          This is a draft. Read the brief below, attach any files it refers to, then submit it. The builder only sees submitted requests.
        </Note>
      )}
      {request.admin_notes && (
        <Card className="space-y-1 p-5">
          <h2 className="font-semibold">Notes from the builder</h2>
          <p className="whitespace-pre-wrap text-sm">{request.admin_notes}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <div className="prose-reading text-[15px]">
            <Markdown remarkPlugins={[remarkGfm]}>{request.brief_md}</Markdown>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Attachments</h2>
            <p className="text-sm text-muted">Data files, a map image, an example case, anything the brief refers to. Up to 4 MB each.</p>
            {request.files.length > 0 && (
              <ul className="space-y-2">
                {request.files.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <a href={`/cases/${request.id}/files/${f.id}`} className="font-medium hover:text-green-strong hover:underline" download>
                        {f.file_name}
                      </a>
                      <p className="text-xs text-muted">
                        {FILE_KIND_LABEL[f.kind]}, {size(f.size_bytes)}
                        {f.note && <>. {f.note}</>}
                      </p>
                    </div>
                    {open && (
                      <form action={removeCaseRequestFile}>
                        <input type="hidden" name="id" value={request.id} />
                        <input type="hidden" name="file" value={f.id} />
                        <button type="submit" className="text-xs text-muted hover:text-ink hover:underline">
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {open && (
              <form action={addCaseRequestFile} className="space-y-2">
                <input type="hidden" name="id" value={request.id} />
                <label htmlFor="file-kind" className="block text-sm font-medium">
                  What is it
                </label>
                <select id="file-kind" name="kind" className={`${input} w-full`}>
                  {Object.entries(FILE_KIND_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
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
                <p className="mb-2 text-sm text-muted">Submitted{request.submitted_at && ` ${request.submitted_at.slice(0, 10)}`}. Waiting for the builder.</p>
                <button type="submit" className={`${secondary} w-full`}>
                  Take back to draft
                </button>
              </form>
            )}
            {request.status === "in_progress" && <p className="text-sm text-muted">The case is being built from this brief. Changes go in a new request.</p>}
            {request.status === "delivered" && <p className="text-sm text-muted">Delivered. See the notes from the builder for where the files are.</p>}
            {request.status === "declined" && <p className="text-sm text-muted">Declined. See the notes from the builder.</p>}
            {request.status === "draft" && (
              <form action={deleteCaseRequest}>
                <input type="hidden" name="id" value={request.id} />
                <button type="submit" className="text-xs text-muted hover:text-ink hover:underline">
                  Delete this draft
                </button>
              </form>
            )}
          </Card>

          {admin && (
            <Card className="space-y-3 p-5">
              <h2 className="font-semibold">Builder (admin)</h2>
              <form action={updateCaseRequestStatus} className="space-y-2">
                <input type="hidden" name="id" value={request.id} />
                <label htmlFor="admin-status" className="block text-sm font-medium">
                  Status
                </label>
                <select id="admin-status" name="status" defaultValue={request.status} className={`${input} w-full`}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <label htmlFor="admin-notes" className="block text-sm font-medium">
                  Notes to the requester
                </label>
                <textarea id="admin-notes" name="admin_notes" defaultValue={request.admin_notes ?? ""} maxLength={4000} className={`${input} min-h-24 w-full`} placeholder="What was built, where the files are, what changed from the brief and why." />
                <button type="submit" className={`${primary} w-full`}>
                  Save
                </button>
              </form>
              <p className="text-xs text-muted">
                To build: download the brief and the attachments into <code>case-builder/cases/&lt;case&gt;/</code> and start the case-builder project with the brief as the kickoff.
              </p>
            </Card>
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
