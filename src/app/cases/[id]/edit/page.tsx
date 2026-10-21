import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { saveCaseRequest } from "@/app/cases/actions";
import { getCaseRequest } from "@/lib/case-requests";
import { CaseRequestForm } from "@/components/case-request-form";
import { Note } from "@/components/ui";

export const metadata = { title: "Edit case request" };

async function EditCaseContent({ params }: Pick<PageProps<"/cases/[id]/edit">, "params">) {
  const { id } = await params;
  const request = await getCaseRequest(id);
  if (!request) notFound();
  if (request.status === "in_progress" || request.status === "delivered") redirect(`/cases/${id}`);
  return (
    <div className="space-y-6">
      <div className="max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">Edit: {request.title}</h1>
        <p className="mt-1 text-muted">Saving rewrites the brief from these answers. Attachments stay as they are.</p>
      </div>
      {request.status === "submitted" && <Note>This request has been submitted. Saving keeps it submitted; the builder sees the updated brief.</Note>}
      <CaseRequestForm initial={request.params} id={request.id} action={saveCaseRequest} />
    </div>
  );
}

export default function EditCasePage({ params }: PageProps<"/cases/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <EditCaseContent params={params} />
    </Suspense>
  );
}
