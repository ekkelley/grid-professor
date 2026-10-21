"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { canEditCourses, requireAdmin, requireUser } from "@/lib/role";
import { canAccess, type CaseRequestStatus } from "@/lib/case-requests";
import { paramsFromForm, paramsFromJson, renderBrief, type CaseBriefParams } from "@/lib/case-brief";

const UUID = /^[0-9a-f-]{36}$/;
const FILE_KINDS = ["data", "map", "example_case", "other"] as const;
const STATUSES: CaseRequestStatus[] = ["draft", "submitted", "in_progress", "delivered", "declined"];

/** Instructors and admins request cases. */
async function requireRequester() {
  const viewer = await requireUser();
  if (!canEditCourses(viewer.role)) throw new Error("Only instructors and admins can request a case.");
  return viewer;
}

/** The request, after checking the viewer may change it. */
async function ownedRequest(id: string) {
  if (!UUID.test(id)) throw new Error("No such request.");
  const viewer = await requireRequester();
  const { data, error } = await createAdminClient().from("case_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !canAccess(viewer, data)) throw new Error("No such request.");
  return { viewer, row: data };
}

/** Render the brief from the stored answers and attachments and save it. Called after every change. */
async function rerender(id: string, params?: CaseBriefParams) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("case_requests").select("*, profiles(email), case_request_files(kind, file_name, note)").eq("id", id).single();
  if (error) throw new Error(error.message);
  const p = params ?? paramsFromJson(data.params);
  const brief = renderBrief(
    p,
    {
      requesterEmail: data.profiles?.email ?? "",
      requestedOn: data.created_at.slice(0, 10),
      status: data.status,
      requestId: data.id,
    },
    data.case_request_files.map((f) => ({ kind: f.kind, fileName: f.file_name, note: f.note })),
  );
  const { error: updateError } = await admin
    .from("case_requests")
    .update({ brief_md: brief, params: JSON.parse(JSON.stringify(p)), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);
}

/** Create or update a request from the form, then show its brief. */
export async function saveCaseRequest(formData: FormData) {
  const viewer = await requireRequester();
  const params = paramsFromForm(formData);
  if (!params.title) throw new Error("Give the case a working title.");
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  let requestId = id;
  if (id) {
    const { row } = await ownedRequest(id);
    if (row.status === "in_progress" || row.status === "delivered") throw new Error("This request is already being built; ask for changes in a new request.");
    const { error } = await admin.from("case_requests").update({ title: params.title }).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin
      .from("case_requests")
      .insert({ requester_id: viewer.user.id, title: params.title, params: JSON.parse(JSON.stringify(params)) })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    requestId = data.id;
  }
  await rerender(requestId, params);
  revalidatePath("/cases", "layout");
  redirect(`/cases/${requestId}`);
}

export async function submitCaseRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status !== "draft") throw new Error("Only a draft can be submitted.");
  if (!row.title.trim()) throw new Error("Give the case a working title first.");
  const admin = createAdminClient();
  const { error } = await admin.from("case_requests").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await rerender(id);
  revalidatePath("/cases", "layout");
}

/** Take a submitted request back to draft to change it (not once building has started). */
export async function reopenCaseRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status !== "submitted") throw new Error("Only a submitted request can be reopened.");
  const { error } = await createAdminClient().from("case_requests").update({ status: "draft", submitted_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  await rerender(id);
  revalidatePath("/cases", "layout");
}

export async function deleteCaseRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status !== "draft") throw new Error("Only a draft can be deleted.");
  const admin = createAdminClient();
  const { data: files } = await admin.from("case_request_files").select("file_path").eq("request_id", id);
  if (files && files.length > 0) await admin.storage.from("case-requests").remove(files.map((f) => f.file_path));
  const { error } = await admin.from("case_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cases", "layout");
  redirect("/cases");
}

/** Attach a data file, a map, an example case or anything else the brief refers to. */
export async function addCaseRequestFile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status === "delivered" || row.status === "declined") throw new Error("This request is closed.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file first.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Files up to 4 MB here; for anything larger, describe where it lives in the brief.");
  if (!/\.(xlsx|xlsm|csv|tsv|txt|md|json|png|jpg|jpeg|pdf)$/i.test(file.name)) throw new Error("Attach a workbook, a data file (csv, tsv, txt, json), a map image (png, jpg) or a PDF.");
  const kindRaw = String(formData.get("kind") ?? "other");
  const kind = FILE_KINDS.find((k) => k === kindRaw) ?? "other";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 120);
  const path = `requests/${id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await admin.storage
    .from("case-requests")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);
  const { error } = await admin.from("case_request_files").insert({ request_id: id, kind, file_name: safeName, file_path: path, size_bytes: file.size, note });
  if (error) throw new Error(error.message);
  await rerender(id);
  revalidatePath(`/cases/${id}`);
}

export async function removeCaseRequestFile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const fileId = String(formData.get("file") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status === "delivered" || row.status === "declined") throw new Error("This request is closed.");
  if (!UUID.test(fileId)) throw new Error("No such file.");
  const admin = createAdminClient();
  const { data: f, error } = await admin.from("case_request_files").select("file_path").eq("id", fileId).eq("request_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!f) throw new Error("No such file.");
  await admin.storage.from("case-requests").remove([f.file_path]);
  const { error: deleteError } = await admin.from("case_request_files").delete().eq("id", fileId);
  if (deleteError) throw new Error(deleteError.message);
  await rerender(id);
  revalidatePath(`/cases/${id}`);
}

/** Admin: move a request along and leave notes for the requester. */
export async function updateCaseRequestStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("No such request.");
  const statusRaw = String(formData.get("status") ?? "");
  const status = STATUSES.find((s) => s === statusRaw);
  if (!status) throw new Error("Unknown status.");
  const notes = String(formData.get("admin_notes") ?? "").trim().slice(0, 4000) || null;
  const { error } = await createAdminClient().from("case_requests").update({ status, admin_notes: notes }).eq("id", id);
  if (error) throw new Error(error.message);
  await rerender(id);
  revalidatePath("/cases", "layout");
}
