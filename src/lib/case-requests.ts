import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer, type Viewer } from "@/lib/role";
import type { Database } from "@/lib/database.types";
import { paramsFromJson, type CaseBriefParams } from "@/lib/case-brief";

export type CaseRequestStatus = Database["public"]["Enums"]["case_request_status"];
export type CaseRequestFileKind = Database["public"]["Enums"]["case_request_file_kind"];

export type CaseRequestRow = Database["public"]["Tables"]["case_requests"]["Row"];
export type CaseRequestFile = Database["public"]["Tables"]["case_request_files"]["Row"];
export type CaseRequestEvent = Database["public"]["Tables"]["case_request_events"]["Row"] & { authorEmail: string | null };

export type CaseRequest = CaseRequestRow & {
  requesterEmail: string;
  params: CaseBriefParams;
  /** What the requester attached (data, map, example case, other). */
  files: CaseRequestFile[];
  /** What the builder delivered (Solution, Blank, Answer Key, notes). */
  deliverables: CaseRequestFile[];
  events: CaseRequestEvent[];
};

/** The lifecycle, in order. */
export const STATUS_ORDER: CaseRequestStatus[] = ["draft", "submitted", "in_progress", "delivered", "deployed", "declined"];

export const STATUS_LABEL: Record<CaseRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "Being built",
  delivered: "Delivered",
  deployed: "Deployed to the add-in",
  declined: "Declined",
};

/** Closed requests: the requester can no longer change answers or attachments. */
export function isClosed(status: CaseRequestStatus): boolean {
  return status === "delivered" || status === "deployed" || status === "declined";
}

export const FILE_KIND_LABEL: Record<CaseRequestFileKind, string> = {
  data: "Data file",
  map: "Map",
  example_case: "Example case",
  other: "Other",
  deliverable: "Deliverable",
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
  let query = admin.from("case_requests").select("*, profiles(email), case_request_files(*), case_request_events(*, profiles(email))").order("updated_at", { ascending: false });
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
    .select("*, profiles(email), case_request_files(*), case_request_events(*, profiles(email))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !canAccess(viewer, data)) return null;
  return shape(data);
}

type EventRow = Database["public"]["Tables"]["case_request_events"]["Row"] & { profiles: { email: string } | null };
type Joined = CaseRequestRow & { profiles: { email: string } | null; case_request_files: CaseRequestFile[]; case_request_events: EventRow[] };

function shape(row: Joined): CaseRequest {
  const { profiles, case_request_files, case_request_events, ...rest } = row;
  const files = [...case_request_files].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    ...rest,
    requesterEmail: profiles?.email ?? "",
    params: paramsFromJson(rest.params),
    files: files.filter((f) => f.kind !== "deliverable"),
    deliverables: files.filter((f) => f.kind === "deliverable"),
    events: [...case_request_events]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(({ profiles: author, ...e }) => ({ ...e, authorEmail: author?.email ?? null })),
  };
}
