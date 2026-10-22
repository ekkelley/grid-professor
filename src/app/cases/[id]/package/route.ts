import type { NextRequest } from "next/server";
import { zipSync, strToU8 } from "fflate";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCaseRequest, type CaseRequest } from "@/lib/case-requests";

/**
 * The build package: one zip the builder extracts into case-builder/cases/. Holds the brief, the
 * requester's attachments, any earlier deliverables (a change request starts from them), a
 * manifest, and the kickoff prompt for the case-builder project.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/cases/[id]/package">) {
  const { id } = await context.params;
  const request = await getCaseRequest(id);
  if (!request) return new Response("Not found", { status: 404 });
  const slug = slugOf(request);
  const admin = createAdminClient();
  const entries: Record<string, Uint8Array> = {};
  entries[`${slug}/case-brief.md`] = strToU8(request.brief_md);
  entries[`${slug}/KICKOFF.md`] = strToU8(kickoff(request, slug));
  const listed: { folder: string; file: string; kind: string; note: string | null; bytes: number }[] = [];
  for (const [folder, files] of [
    ["attachments", request.files],
    ["previous", request.deliverables],
  ] as const) {
    for (const f of files) {
      const { data, error } = await admin.storage.from("case-requests").download(f.file_path);
      if (error || !data) continue;
      const name = uniqueName(entries, `${slug}/${folder}/${f.file_name}`);
      entries[name] = new Uint8Array(await data.arrayBuffer());
      listed.push({ folder, file: name.slice(slug.length + 1), kind: f.kind, note: f.note, bytes: f.size_bytes });
    }
  }
  const manifest = {
    request_id: request.id,
    title: request.title,
    requester: request.requesterEmail,
    status: request.status,
    created_at: request.created_at,
    submitted_at: request.submitted_at,
    delivered_at: request.delivered_at,
    deployed_at: request.deployed_at,
    assignment_link: request.assignment_link,
    platform_url: `${new URL(_request.url).origin}/cases/${request.id}`,
    stated: statedLine(request.brief_md),
    files: listed,
    packaged_at: new Date().toISOString(),
  };
  entries[`${slug}/manifest.json`] = strToU8(JSON.stringify(manifest, null, 2));
  const zip = zipSync(entries, { level: 6 });
  return new Response(new Uint8Array(zip), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug}.zip"`,
      "cache-control": "private, no-store",
    },
  });
}

function slugOf(r: CaseRequest): string {
  return r.title.toLowerCase().replace(/\(untitled\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "case";
}

function uniqueName(entries: Record<string, Uint8Array>, name: string): string {
  if (!(name in entries)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > name.lastIndexOf("/") ? name.slice(0, dot) : name;
  const ext = dot > name.lastIndexOf("/") ? name.slice(dot) : "";
  let n = 2;
  while (`${base}-${n}${ext}` in entries) n += 1;
  return `${base}-${n}${ext}`;
}

function statedLine(brief: string): string {
  const m = brief.match(/^Stated by the requester: (.*?)\. Everything else/m);
  return m ? m[1] : "";
}

/** The kickoff for the case-builder Claude project, matching kit/08-Kickoff-Prompt.md. */
function kickoff(r: CaseRequest, slug: string): string {
  const previous = r.deliverables.length > 0;
  return `# Kickoff: ${r.title}

Paste this as the first message of a new chat in the Grid Professor Case Builder project, with
this package attached (or extracted into case-builder/cases/${slug}/).

---

I want to build a new MECC-format case from a Grid Professor case request. The brief is
\`case-brief.md\` in the attached package (request ${r.id}); its attachments are in
\`attachments/\`${previous ? " and the files delivered earlier are in `previous/` (this is a change request: start from them and say what changes)" : ""}.

Read the brief first, then \`02\`, \`03\`, \`04\`, \`07\` and the reference code. The brief opens with
the fields the requester stated and marks everything else "derive"; the Builder's notes section, if
present, takes precedence over a derived default but never over something the requester stated.
Restate the level chain in one sentence and confirm it with me. Then propose the design table with
the two extra columns \`09\` asks for (from the brief; source), stop for my approval, and continue with
the kit's steps: independent model, build with reconcile, QA, perturbation, render, Blank, notes.
Where the brief says "derive", say what you decided and why. Save everything under
\`case-builder/cases/${slug}/\` and tell me what a tester should look at closely.
`;
}
