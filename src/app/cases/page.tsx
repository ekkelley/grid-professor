import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canEditCourses, getViewer } from "@/lib/role";
import { listCaseRequests, STATUS_LABEL } from "@/lib/case-requests";
import { chainSummary } from "@/lib/case-brief";
import { Badge, ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "Case requests" };

function tone(status: string): "neutral" | "green" | "note" {
  if (status === "delivered") return "green";
  if (status === "submitted" || status === "in_progress") return "note";
  return "neutral";
}

async function CaseListContent() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/sign-in?next=/cases");
  if (!canEditCourses(viewer.role)) redirect("/");
  const requests = await listCaseRequests();
  const admin = viewer.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">Case requests</h1>
          <p className="mt-1 text-muted">
            Describe the competition case you want and how its levels should connect. The request becomes a case brief that the case builder works from; the finished Solution, Blank and Answer Key come back to you here.
          </p>
        </div>
        <ButtonLink href="/cases/new">Request a case</ButtonLink>
      </div>

      {requests.length === 0 ? (
        <Card className="p-5 text-muted">No requests yet. Start one and you will see its brief before anything is sent.</Card>
      ) : (
        <ul className="grid gap-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/cases/${r.id}`} className="text-lg font-semibold tracking-tight hover:text-green-strong">
                      {r.title}
                    </Link>
                    <Badge tone={tone(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {r.params.levelCount} levels, {r.params.bonusCount} bonuses, {r.params.division === "both" ? "JV and Varsity" : r.params.division === "derive" ? "division open" : r.params.division.toUpperCase() === "JV" ? "JV" : "Varsity"}.{" "}
                    {chainSummary(r.params.levels)} {r.files.length > 0 && `${r.files.length} file${r.files.length === 1 ? "" : "s"} attached.`}
                    {admin && r.requesterEmail && <> Requested by {r.requesterEmail}.</>}
                  </p>
                </div>
                <ButtonLink href={`/cases/${r.id}`} variant="secondary">
                  Open
                </ButtonLink>
              </Card>
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
