"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireEditor, requireUser } from "@/lib/role";
import { importGuideFromUrl } from "@/lib/guide-import";

export async function createSection(formData: FormData) {
  const viewer = await requireEditor();
  const template = String(formData.get("template") ?? "");
  const title = String(formData.get("title") ?? "");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_section_from_template", {
    p_template_slug: template,
    p_title: title,
  });
  if (error) throw new Error(error.message);
  // The person who makes a course teaches it.
  if (viewer.user) {
    const { data: course } = await admin.from("courses").select("id").eq("slug", data).single();
    if (course) await admin.from("course_members").insert({ course_id: course.id, user_id: viewer.user.id, role: "instructor" });
  }
  revalidatePath("/");
  redirect(`/courses/${data}/edit`);
}

/** A student enters a course's join code once and is a member from then on. */
export async function joinCourse(formData: FormData) {
  const viewer = await requireUser();
  const code = String(formData.get("code") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 6) redirect("/join?error=shape");
  const admin = createAdminClient();
  const { data: match, error } = await admin.from("course_join_codes").select("course_id, courses(slug)").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  if (!match?.courses) redirect("/join?error=unknown");
  const { error: insertError } = await admin
    .from("course_members")
    .upsert({ course_id: match.course_id, user_id: viewer.user.id, role: "student" }, { onConflict: "course_id,user_id", ignoreDuplicates: true });
  if (insertError) throw new Error(insertError.message);
  revalidatePath("/", "layout");
  redirect(`/courses/${match.courses.slug}`);
}

/** Changes allowed only on a section, never on a template. Returns the course slug for revalidation. */
async function sectionSlugForPlacement(placementId: string): Promise<string> {
  const { data, error } = await createAdminClient()
    .from("course_modules")
    .select("course_units(courses(slug, kind))")
    .eq("id", placementId)
    .single();
  if (error) throw new Error(error.message);
  const course = data.course_units?.courses;
  if (!course || course.kind !== "section") throw new Error("Templates can't be edited here. Use this template to make your own copy.");
  return course.slug;
}

export async function moveModule(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("placement"));
  const direction = Number(formData.get("direction"));
  const slug = await sectionSlugForPlacement(id);
  const { error } = await createAdminClient().rpc("move_course_module", { p_course_module_id: id, p_direction: direction });
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

export async function setHidden(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("placement"));
  const hidden = formData.get("hidden") === "true";
  const slug = await sectionSlugForPlacement(id);
  const { error } = await createAdminClient().from("course_modules").update({ is_hidden: hidden }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

export async function setOpensOn(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("placement"));
  const raw = String(formData.get("opens_on") ?? "").trim();
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Use a date like 2026-10-20");
  const slug = await sectionSlugForPlacement(id);
  const { error } = await createAdminClient().from("course_modules").update({ opens_on: raw || null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

async function sectionSlugForUnit(unitId: string): Promise<string> {
  const { data, error } = await createAdminClient().from("course_units").select("courses(slug, kind)").eq("id", unitId).single();
  if (error) throw new Error(error.message);
  if (!data.courses || data.courses.kind !== "section") throw new Error("Templates can't be edited here. Use this template to make your own copy.");
  return data.courses.slug;
}

async function sectionBySlug(slug: string): Promise<{ id: string; slug: string }> {
  const { data, error } = await createAdminClient().from("courses").select("id, slug, kind").eq("slug", slug).single();
  if (error) throw new Error(error.message);
  if (data.kind !== "section") throw new Error("Templates can't be edited here. Use this template to make your own copy.");
  return data;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Move a module into the unit above (to its end) or below (to its start). */
export async function moveModuleAcrossUnits(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("placement"));
  const direction = Number(formData.get("direction"));
  const slug = await sectionSlugForPlacement(id);
  const { error } = await createAdminClient().rpc("move_course_module_across_units", { p_course_module_id: id, p_direction: direction });
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

export async function addUnit(formData: FormData) {
  await requireEditor();
  const course = await sectionBySlug(String(formData.get("course") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Give the unit a title.");
  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin.from("course_units").select("slug, position").eq("course_id", course.id);
  if (readError) throw new Error(readError.message);
  const base = slugify(title) || "unit";
  let slug = base;
  for (let n = 2; existing.some((u) => u.slug === slug); n++) slug = `${base}-${n}`;
  const position = Math.max(0, ...existing.map((u) => u.position)) + 1;
  const { error } = await admin.from("course_units").insert({ course_id: course.id, slug, title, position });
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${course.slug}`, "layout");
}

export async function renameUnit(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("unit"));
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title) throw new Error("Give the unit a title.");
  const slug = await sectionSlugForUnit(id);
  const { error } = await createAdminClient().from("course_units").update({ title, summary: summary || null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

export async function moveUnit(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("unit"));
  const direction = Number(formData.get("direction"));
  const slug = await sectionSlugForUnit(id);
  const { error } = await createAdminClient().rpc("move_course_unit", { p_unit_id: id, p_direction: direction });
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

/** Only an empty unit can be deleted; move its modules first. */
export async function deleteUnit(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("unit"));
  const slug = await sectionSlugForUnit(id);
  const { error } = await createAdminClient().rpc("delete_empty_course_unit", { p_unit_id: id });
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${slug}`, "layout");
}

// ---------------------------------------------------------------------------------------------
// Content administration. Admin only; these write to the content system itself.
// ---------------------------------------------------------------------------------------------

/** Attach the student-version file to a workbook build. Served afterwards by /files/[build]. */
export async function attachWorkbookFile(formData: FormData) {
  await requireAdmin();
  const buildId = String(formData.get("build") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file first.");
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) throw new Error("Workbook files are .xlsx or .xlsm.");

  const admin = createAdminClient();
  const { data: build, error } = await admin.from("workbook_builds").select("id, items(slug)").eq("id", buildId).single();
  if (error) throw new Error(error.message);

  const safeName = file.name.replace(/[^A-Za-z0-9._ -]/g, "_");
  const path = `builds/${build.id}/${safeName}`;
  const { error: uploadError } = await admin.storage
    .from("workbooks")
    .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await admin
    .from("workbook_builds")
    .update({ file_path: path, file_name: safeName, file_attached_at: new Date().toISOString() })
    .eq("id", build.id);
  if (updateError) throw new Error(updateError.message);
  revalidatePath("/", "layout");
}

/**
 * Import a guide published on app.gridprof.com into the content system, as a guide item derived
 * from the workbook it explains. Re-importing the same workbook's guide updates it in place.
 */
export async function importWorkbookGuide(formData: FormData) {
  await requireAdmin();
  const workbookId = String(formData.get("workbook") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const admin = createAdminClient();

  const { data: workbook, error } = await admin
    .from("items")
    .select("id, slug, owner_id, item_skills(skill_id)")
    .eq("id", workbookId)
    .eq("kind", "workbook")
    .single();
  if (error) throw new Error(error.message);

  const guide = await importGuideFromUrl(url);
  const slug = `${workbook.slug}--guide`;
  const { data: item, error: upsertError } = await admin
    .from("items")
    .upsert(
      {
        slug,
        kind: "guide",
        title: guide.title,
        summary: `Level-by-level solution guide for ${workbook.slug}, from the Grid Professor add-in.`,
        owner_id: workbook.owner_id,
        stored_at: url,
        body_md: guide.markdown,
        origin: "derived",
        derived_from: workbook.id,
        source: `gridprof skill guide generator; imported ${new Date().toISOString().slice(0, 10)} from ${url}`,
      },
      { onConflict: "kind,slug" },
    )
    .select("id")
    .single();
  if (upsertError) throw new Error(upsertError.message);

  // The guide teaches what the workbook declares.
  await admin.from("item_skills").delete().eq("item_id", item.id);
  if (workbook.item_skills.length > 0) {
    const { error: tagError } = await admin
      .from("item_skills")
      .insert(workbook.item_skills.map((s) => ({ item_id: item.id, skill_id: s.skill_id, basis: "declared" as const })));
    if (tagError) throw new Error(tagError.message);
  }
  revalidatePath("/", "layout");
}
