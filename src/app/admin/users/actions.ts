"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, requireAdmin, type Role } from "@/lib/role";

const PAGE = "/admin/users";
const UUID = /^[0-9a-f-]{36}$/;

function roleFrom(value: FormDataEntryValue | null): Role | null {
  return ROLES.find((r) => r === value) ?? null;
}

/**
 * Admin: make an account for someone before they sign in, with the role already set. Nothing is
 * emailed; they sign in with this address as usual (one-time code, Google or Microsoft) and land
 * on the account made here. createUser rather than inviteUserByEmail because Supabase invite links
 * do not work with the PKCE sign-in this app uses.
 */
export async function addAccount(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const role = roleFrom(formData.get("role"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${PAGE}?error=email`);
  if (!role) redirect(`${PAGE}?error=role`);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : {},
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") redirect(`${PAGE}?error=exists&email=${encodeURIComponent(email)}`);
    throw new Error(error.message);
  }
  // The auth trigger has already made the profile (role from role_grants, else student); the
  // admin's choice wins. Upsert so the account is whole even if the trigger did not run.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ user_id: data.user.id, email, role, name: name || null }, { onConflict: "user_id" });
  if (profileError) throw new Error(profileError.message);
  revalidatePath(PAGE);
  redirect(`${PAGE}?added=${encodeURIComponent(email)}`);
}

/** Admin: move an account between student, instructor and admin. Never your own, so there is always an admin left. */
export async function setAccountRole(formData: FormData) {
  const viewer = await requireAdmin();
  const userId = String(formData.get("user") ?? "");
  const role = roleFrom(formData.get("role"));
  if (!UUID.test(userId)) throw new Error("No such account.");
  if (!role) throw new Error("Unknown role.");
  if (viewer.user?.id === userId) redirect(`${PAGE}?error=self`);

  const { data, error } = await createAdminClient().from("profiles").update({ role }).eq("user_id", userId).select("email").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No such account.");
  revalidatePath(PAGE);
  redirect(`${PAGE}?saved=${encodeURIComponent(data.email)}`);
}
