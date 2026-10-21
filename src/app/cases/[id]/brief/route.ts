import type { NextRequest } from "next/server";
import { getCaseRequest } from "@/lib/case-requests";

/** The case brief as a Markdown file: what the builder downloads into the case folder. */
export async function GET(_request: NextRequest, context: RouteContext<"/cases/[id]/brief">) {
  const { id } = await context.params;
  const request = await getCaseRequest(id);
  if (!request) return new Response("Not found", { status: 404 });
  const slug = request.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "case";
  return new Response(request.brief_md, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}-case-brief.md"`,
      "cache-control": "private, no-store",
    },
  });
}
