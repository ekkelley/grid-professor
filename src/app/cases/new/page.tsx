import { Suspense } from "react";
import { redirect } from "next/navigation";
import { saveCaseRequest } from "@/app/cases/actions";
import { canEditCourses, getViewer } from "@/lib/role";
import { defaultParams } from "@/lib/case-brief";
import { CaseRequestForm } from "@/components/case-request-form";

export const metadata = { title: "Request a case" };

async function NewCaseContent() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/sign-in?next=/cases/new");
  if (!canEditCourses(viewer.role)) redirect("/");
  return (
    <div className="space-y-6">
      <div className="max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">Request a case</h1>
        <p className="mt-1 text-muted">
          One field is enough; the builder chooses whatever you leave blank. You will see the brief before you submit, and you can attach data files, a map or an example case on that page.
        </p>
      </div>
      <CaseRequestForm initial={defaultParams()} action={saveCaseRequest} />
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <NewCaseContent />
    </Suspense>
  );
}
