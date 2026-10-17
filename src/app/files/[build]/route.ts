import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Serves a workbook build's student-version file from this platform.
 *
 * This route is the one place the file comes from, whatever is behind it. Today: a copy in the
 * private `workbooks` bucket, attached by an admin. Later: fetched from the add-in's API with a
 * machine credential, so the add-in stays the system of record for files.
 *
 * Access: workbook files are student material, readable by anyone who can see the course, so no
 * check beyond "the build exists and has a file" until the identity section lands.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/files/[build]">) {
  const { build: buildId } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(buildId)) return new Response("Not found", { status: 404 });

  const admin = createAdminClient();
  const { data: build, error } = await admin
    .from("workbook_builds")
    .select("file_path, file_name, status, items(title)")
    .eq("id", buildId)
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  if (!build?.file_path || !build.file_name) return new Response("No file is attached to this workbook yet.", { status: 404 });

  const { data: file, error: downloadError } = await admin.storage.from("workbooks").download(build.file_path);
  if (downloadError || !file) return new Response("The file could not be read.", { status: 502 });

  return new Response(file.stream(), {
    headers: {
      "content-type": contentType(build.file_name),
      "content-disposition": `attachment; filename="${build.file_name.replace(/["\r\n]/g, "")}"`,
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
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
