import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateCaseRequestStatus } from "@/app/cases/actions";
import { canEditCourses, getViewer } from "@/lib/role";
import { listCaseRequests, STATUS_LABEL, type CaseRequest, type CaseRequestStatus } from "@/lib/case-requests";
import { chainSummary } from "@/lib/case-brief";
import { Badge, ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "Case requests" };

const textButton = "rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium hover:bg-bg";

function tone(status: CaseRequestStatus): "neutral" | "green" | "note" {
  if (status === "delivered") return "green";
  if (status === "submitted" || status === "in_progress") return "note";
  return "neutral";
}

function divisionLabel(d: string): string {
  if (d === "both") return "JV and Varsity";
  if (d === "jv") return "JV";
  if (d === "varsity") return "Varsity";
  return "division: builder decides";
}

function shapeLabel(r: CaseRequest): string {
  const lv = r.params.levelCount === null ? "levels: builder decides" : `${r.params.levelCount} ${r.params.levelCount === 1 ? "level" : "levels"}`;
  const bn = r.params.bonusCount === null ? "bonuses: builder decides" : `${r.params.bonusCount} ${r.params.bonusCount === 1 ? "bonus" : "bonuses"}`;
  return `${lv}, ${bn}, ${divisionLabel(r.params.division)}.`;
}

/** One request in the list; admins get the next pipeline step as a button. */
function RequestRow({ r, admin }: { r: CaseRequest; admin: boolean }) {
  const next: { status: CaseRequestStatus; label: string } | null =
    r.status === "submitted" ? { status: "in_progress", label: "Start building" } : r.status === "in_progress" ? { status: "delivered", label: "Mark delivered" } : null;
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/cases/${r.id}`} className="text-lg font-semibold tracking-tight hover:text-green-strong">
            {r.title}
          </Link>
          <Badge tone={tone(r.status)}>{STATUS_LABEL[r.status]}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {shapeLabel(r)} {chainSummary(r.params.levels)}
          {r.files.length > 0 && ` ${r.files.length} file${r.files.length === 1 ? "" : "s"} attached.`}
          {admin && r.requesterEmail && ` Requested by ${r.requesterEmail}.`}
          {r.submitted_at && ` Submitted ${r.submitted_at.slice(0, 10)}.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {admin && next && (
          <form action={updateCaseRequestStatus}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value={next.status} />
            <button type="submit" className={textButton}>
              {next.label}
            </button>
          </form>
        )}
        <ButtonLink href={`/cases/${r.id}`} variant="secondary">
          Open
        </ButtonLink>
      </div>
    </Card>
  );
}

/** The admin's queue: submitted first, then in progress, drafts, and the closed ones. */
const QUEUE: { status: CaseRequestStatus; title: string; blurb: string }[] = [
  { status: "submitted", title: "Waiting to be built", blurb: "Download the brief and its files into case-builder/cases/<case>/, then start building." },
  { status: "in_progress", title: "Being built", blurb: "Mark delivered when the Solution, Blank and Answer Key are in the case folder, and say where in the notes." },
  { status: "draft", title: "Drafts", blurb: "Not submitted yet; the requester is still working on them." },
  { status: "delivered", title: "Delivered", blurb: "" },
  { status: "declined", title: "Declined", blurb: "" },
];

async function CaseListContent() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/sign-in?next=/cases");
  if (!canEditCourses(viewer.role)) redirect("/");
  const requests = await listCaseRequests();
  const admin = viewer.role === "admin";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">Case requests</h1>
          <p className="mt-1 text-muted">
            {admin
              ? "Every request on the platform, as a build queue. Each one is a row in case_requests with its brief and attachments."
              : "Describe the competition case you want and how its levels should connect. The request becomes a case brief that the case builder works from; the finished Solution, Blank and Answer Key come back to you here."}
          </p>
        </div>
        <ButtonLink href="/cases/new">Request a case</ButtonLink>
      </div>

      {requests.length === 0 ? (
        <Card className="p-5 text-muted">No requests yet. Start one and you will see its brief before anything is sent.</Card>
      ) : admin ? (
        QUEUE.map((q) => {
          const rows = requests.filter((r) => r.status === q.status);
          if (rows.length === 0) return null;
          return (
            <section key={q.status} aria-labelledby={`queue-${q.status}`} className="space-y-3">
              <div>
                <h2 id={`queue-${q.status}`} className="text-lg font-semibold">
                  {q.title} <span className="font-normal text-muted">({rows.length})</span>
                </h2>
                {q.blurb && <p className="text-sm text-muted">{q.blurb}</p>}
              </div>
              <ul className="grid gap-3">
                {rows.map((r) => (
                  <li key={r.id}>
                    <RequestRow r={r} admin />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <ul className="grid gap-3">
          {requests.map((r) => (
            <li key={r.id}>
              <RequestRow r={r} admin={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <CaseListContent />
    </Suspense>
  );
}
