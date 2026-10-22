"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { canEditCourses, requireAdmin, requireUser } from "@/lib/role";
import { canAccess, isClosed, STATUS_LABEL, STATUS_ORDER, type CaseRequestStatus } from "@/lib/case-requests";
import { paramsFromForm, paramsFromJson, renderBrief, statedFields, titleFor, type CaseBriefParams } from "@/lib/case-brief";

const UUID = /^[0-9a-f-]{36}$/;
const REQUESTER_FILE_KINDS = ["data", "map", "example_case", "other"] as const;
const ATTACHMENT_RE = /\.(xlsx|xlsm|csv|tsv|txt|md|json|png|jpg|jpeg|pdf)$/i;
const DELIVERABLE_RE = /\.(xlsx|xlsm|md|pdf|txt|csv|zip)$/i;
const MAX_BYTES = 4 * 1024 * 1024;

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

/** Render the brief from the stored answers, builder's notes and attachments, and save it. */
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
      builderNotes: data.builder_notes,
    },
    data.case_request_files.filter((f) => f.kind !== "deliverable").map((f) => ({ kind: f.kind, fileName: f.file_name, note: f.note })),
  );
  const { error: updateError } = await admin
    .from("case_requests")
    .update({ brief_md: brief, params: JSON.parse(JSON.stringify(p)), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);
}

/** A status change is a system entry in the thread. */
async function logStatus(id: string, authorId: string, status: CaseRequestStatus, note?: string) {
  const body = note?.trim() ? `${STATUS_LABEL[status]}. ${note.trim()}` : `${STATUS_LABEL[status]}.`;
  const { error } = await createAdminClient().from("case_request_events").insert({ request_id: id, author_id: authorId, kind: "status", status, body });
  if (error) throw new Error(error.message);
}

/** Create or update a request from the form, then show its brief. */
export async function saveCaseRequest(formData: FormData) {
  const viewer = await requireRequester();
  const params = paramsFromForm(formData);
  if (statedFields(params).length === 0) throw new Error("Fill in at least one field; the builder chooses the rest.");
  const title = titleFor(params);
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  let requestId = id;
  if (id) {
    const { row } = await ownedRequest(id);
    if (row.status !== "draft" && row.status !== "submitted") throw new Error("This request is already being built; ask for changes in the thread or start a new request.");
    const { error } = await admin.from("case_requests").update({ title }).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin
      .from("case_requests")
      .insert({ requester_id: viewer.user.id, title, params: JSON.parse(JSON.stringify(params)) })
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
  const { viewer, row } = await ownedRequest(id);
  if (row.status !== "draft") throw new Error("Only a draft can be submitted.");
  const { error } = await createAdminClient().from("case_requests").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await logStatus(id, viewer.user.id, "submitted");
  await rerender(id);
  revalidatePath("/cases", "layout");
}

/** Take a submitted request back to draft to change it (not once building has started). */
export async function reopenCaseRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { viewer, row } = await ownedRequest(id);
  if (row.status !== "submitted") throw new Error("Only a submitted request can be reopened.");
  const { error } = await createAdminClient().from("case_requests").update({ status: "draft", submitted_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  await logStatus(id, viewer.user.id, "draft", "Taken back to draft by the requester.");
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

async function storeFile(id: string, file: File, kind: "data" | "map" | "example_case" | "other" | "deliverable", note: string | null) {
  const admin = createAdminClient();
  const safeName = file.name.replace(/[^A-Za-z0-9._ ()-]/g, "_").slice(0, 120);
  const folder = kind === "deliverable" ? "deliverables" : "requests";
  const path = `${folder}/${id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await admin.storage.from("case-requests").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);
  const { error } = await admin.from("case_request_files").insert({ request_id: id, kind, file_name: safeName, file_path: path, size_bytes: file.size, note });
  if (error) throw new Error(error.message);
}

/** The requester attaches a data file, a map, an example case or anything else the brief refers to. */
export async function addCaseRequestFile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (isClosed(row.status)) throw new Error("This request is closed.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file first.");
  if (file.size > MAX_BYTES) throw new Error("Files up to 4 MB here; for anything larger, describe where it lives in the brief.");
  if (!ATTACHMENT_RE.test(file.name)) throw new Error("Attach a workbook, a data file (csv, tsv, txt, json), a map image (png, jpg) or a PDF.");
  const kindRaw = String(formData.get("kind") ?? "other");
  const kind = REQUESTER_FILE_KINDS.find((k) => k === kindRaw) ?? "other";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  await storeFile(id, file, kind, note);
  await rerender(id);
  revalidatePath(`/cases/${id}`);
}

/** The admin delivers a finished file (Solution, Blank, Answer Key, notes). Several can be chosen at once. */
export async function addDeliverable(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { row } = await ownedRequest(id);
  if (row.status === "declined") throw new Error("This request was declined.");
  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) throw new Error("Choose at least one file.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  for (const file of files) {
    if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 4 MB.`);
    if (!DELIVERABLE_RE.test(file.name)) throw new Error(`${file.name}: deliverables are workbooks, Markdown, PDF, text or zip.`);
    await storeFile(id, file, "deliverable", note);
  }
  revalidatePath(`/cases/${id}`);
}

export async function removeCaseRequestFile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const fileId = String(formData.get("file") ?? "");
  const { viewer, row } = await ownedRequest(id);
  if (!UUID.test(fileId)) throw new Error("No such file.");
  const admin = createAdminClient();
  const { data: f, error } = await admin.from("case_request_files").select("file_path, kind").eq("id", fileId).eq("request_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!f) throw new Error("No such file.");
  if (f.kind === "deliverable" ? viewer.role !== "admin" : isClosed(row.status)) throw new Error("This file can no longer be removed.");
  await admin.storage.from("case-requests").remove([f.file_path]);
  const { error: deleteError } = await admin.from("case_request_files").delete().eq("id", fileId);
  if (deleteError) throw new Error(deleteError.message);
  await rerender(id);
  revalidatePath(`/cases/${id}`);
}

/** Either side posts to the thread. */
export async function postCaseRequestMessage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { viewer } = await ownedRequest(id);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!body) throw new Error("Write something first.");
  const { error } = await createAdminClient().from("case_request_events").insert({ request_id: id, author_id: viewer.user.id, kind: "message", body });
  if (error) throw new Error(error.message);
  revalidatePath(`/cases/${id}`);
}

/** Admin: the builder's notes, rendered into the brief under their own heading. */
export async function saveBuilderNotes(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("No such request.");
  const notes = String(formData.get("builder_notes") ?? "").trim().slice(0, 8000) || null;
  const { error } = await createAdminClient().from("case_requests").update({ builder_notes: notes }).eq("id", id);
  if (error) throw new Error(error.message);
  await rerender(id);
  revalidatePath(`/cases/${id}`);
}

/** Admin: move a request along; the change is logged in the thread, with an optional note. */
export async function updateCaseRequestStatus(formData: FormData) {
  const viewer = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("No such request.");
  const statusRaw = String(formData.get("status") ?? "");
  const status = STATUS_ORDER.find((s) => s === statusRaw);
  if (!status) throw new Error("Unknown status.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  const link = formData.has("assignment_link") ? String(formData.get("assignment_link") ?? "").trim().slice(0, 500) || null : undefined;
  if (status === "deployed" && link !== undefined && !link) throw new Error("Record the assignment link or id when marking a case deployed.");
  const now = new Date().toISOString();
  const patch: { status: CaseRequestStatus; delivered_at?: string; deployed_at?: string; assignment_link?: string | null } = { status };
  if (status === "delivered") patch.delivered_at = now;
  if (status === "deployed") patch.deployed_at = now;
  if (link !== undefined) patch.assignment_link = link;
  const { error } = await createAdminClient().from("case_requests").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  await logStatus(id, viewer.user!.id, status, note);
  await rerender(id);
  revalidatePath("/cases", "layout");
}
