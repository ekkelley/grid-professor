"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireEditor } from "@/lib/role";
import { importGuideFromUrl } from "@/lib/guide-import";

export async function createSection(formData: FormData) {
  await requireEditor();
  const template = String(formData.get("template") ?? "");
  const title = String(formData.get("title") ?? "");
  const { data, error } = await createAdminClient().rpc("create_section_from_template", {
    p_template_slug: template,
    p_title: title,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/courses/${data}/edit`);
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
