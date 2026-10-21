import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCaseRequest } from "@/lib/case-requests";

/** Serves an attachment of a case request to its requester or an admin. */
export async function GET(_request: NextRequest, context: RouteContext<"/cases/[id]/files/[file]">) {
  const { id, file: fileId } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(fileId)) return new Response("Not found", { status: 404 });
  const request = await getCaseRequest(id);
  if (!request) return new Response("Not found", { status: 404 });
  const file = request.files.find((f) => f.id === fileId);
  if (!file) return new Response("Not found", { status: 404 });

  const { data, error } = await createAdminClient().storage.from("case-requests").download(file.file_path);
  if (error || !data) return new Response("The file could not be read.", { status: 502 });
  return new Response(data.stream(), {
    headers: {
      "content-type": contentType(file.file_name),
      "content-disposition": `attachment; filename="${file.file_name.replace(/["\r\n]/g, "")}"`,
      "cache-control": "private, no-store",
    },
  });
}

function contentType(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  switch (ext) {
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xlsm":
      return "application/vnd.ms-excel.sheet.macroEnabled.12";
    case "csv":
      return "text/csv; charset=utf-8";
    case "tsv":
    case "txt":
      return "text/plain; charset=utf-8";
    case "md":
      return "text/markdown; charset=utf-8";
    case "json":
      return "application/json";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
