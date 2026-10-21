import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/role";
import type { Database } from "@/lib/database.types";
import { paramsFromJson, type CaseBriefParams } from "@/lib/case-brief";

export type CaseRequestStatus = Database["public"]["Enums"]["case_request_status"];
export type CaseRequestFileKind = Database["public"]["Enums"]["case_request_file_kind"];

export type CaseRequestRow = Database["public"]["Tables"]["case_requests"]["Row"];
export type CaseRequestFile = Database["public"]["Tables"]["case_request_files"]["Row"];

export type CaseRequest = CaseRequestRow & {
  requesterEmail: string;
  params: CaseBriefParams;
  files: CaseRequestFile[];
};

export const STATUS_LABEL: Record<CaseRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "Being built",
  delivered: "Delivered",
  declined: "Declined",
};

export const FILE_KIND_LABEL: Record<CaseRequestFileKind, string> = {
  data: "Data file",
  map: "Map",
  example_case: "Example case",
  other: "Other",
};

/** Who may see or change a request: the person who made it, and admins. */
export function canAccess(viewer: Viewer, row: Pick<CaseRequestRow, "requester_id">): boolean {
  if (viewer.role === "admin") return true;
  return viewer.user !== null && viewer.user.id === row.requester_id;
}

/** Requests the viewer may see: their own, or every request for an admin. Newest first. */
export async function listCaseRequests(): Promise<CaseRequest[]> {
  const viewer = await getViewer();
  if (!viewer.user) return [];
  const admin = createAdminClient();
  let query = admin.from("case_requests").select("*, profiles(email), case_request_files(*)").order("updated_at", { ascending: false });
  if (viewer.role !== "admin") query = query.eq("requester_id", viewer.user.id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(shape);
}

/** One request, or null when it does not exist or the viewer may not see it. */
export async function getCaseRequest(id: string): Promise<CaseRequest | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const viewer = await getViewer();
  if (!viewer.user) return null;
  const { data, error } = await createAdminClient()
    .from("case_requests")
    .select("*, profiles(email), case_request_files(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !canAccess(viewer, data)) return null;
  return shape(data);
}

type Joined = CaseRequestRow & { profiles: { email: string } | null; case_request_files: CaseRequestFile[] };

function shape(row: Joined): CaseRequest {
  const { profiles, case_request_files, ...rest } = row;
  return {
    ...rest,
    requesterEmail: profiles?.email ?? "",
    params: paramsFromJson(rest.params),
    files: [...case_request_files].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}
