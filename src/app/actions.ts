"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, ROLE_COOKIE, requireEditor, type Role } from "@/lib/role";

export async function setRole(formData: FormData) {
  const role = formData.get("role");
  if (!ROLES.includes(role as Role)) throw new Error("Unknown role");
  (await cookies()).set(ROLE_COOKIE, role as string, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/", "layout");
}

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
