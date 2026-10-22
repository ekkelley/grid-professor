"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, requireAdmin, type Role, type Viewer } from "@/lib/role";
import type { ActionState } from "@/components/action-form";

const PAGE = "/admin/users";
const UUID = /^[0-9a-f-]{36}$/;

function roleFrom(value: FormDataEntryValue | null): Role | null {
  return ROLES.find((r) => r === value) ?? null;
}

/** "an admin", "an instructor", "a student". */
function article(role: Role): string {
  return role === "student" ? "a student" : `an ${role}`;
}

/** Lowercased and trimmed, the shape role_grants requires and the sign-in trigger matches on. */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** The admin check as a value an action can return straight away, so the form shows the sentence. */
async function adminGate(): Promise<{ viewer: Viewer } | { error: string }> {
  try {
    return { viewer: await requireAdmin() };
  } catch {
    return { error: "Only admins can change accounts." };
  }
}

/**
 * Change an account's role, with both guards: never the caller's own account, and never the change
 * that would leave no admin. The second holds whoever is switched, not only the caller.
 */
async function applyRole(viewer: Viewer, userId: string, role: Role, name?: string): Promise<ActionState> {
  if (viewer.user?.id === userId) return { error: "You can't change your own role. Ask another admin." };
  const admin = createAdminClient();
  const { data: profiles, error: readError } = await admin.from("profiles").select("user_id, email, name, role");
  if (readError) return { error: "Could not read the accounts. Try again." };
  const target = profiles.find((p) => p.user_id === userId);
  if (!target) return { error: "That account is no longer listed. Reload the page." };
  if (target.role === "admin" && role !== "admin") {
    const otherAdmins = profiles.filter((p) => p.user_id !== userId && p.role === "admin").length;
    if (otherAdmins === 0) return { error: "At least one account has to stay an admin." };
  }
  const patch: { role: Role; name?: string } = { role };
  if (name) patch.name = name;
  const { error } = await admin.from("profiles").update(patch).eq("user_id", userId);
  if (error) return { error: "Could not save. Try again." };
  revalidatePath(PAGE);
  return { ok: `${name || target.name || target.email} is now ${article(role)}.` };
}

/**
 * Admin: add someone by email with a role, like the FinTech portal's organizers allowlist. The
 * grant is applied the first time that address signs in (one-time code, Google or Microsoft);
 * nothing is emailed. An address that already has an account is changed in place instead.
 */
export async function addAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminGate();
  if ("error" in gate) return gate;
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const role = roleFrom(formData.get("role"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (!role) return { error: "Pick a role: student, instructor or admin." };

  const admin = createAdminClient();
  const { data: profiles, error: readError } = await admin.from("profiles").select("user_id, email, name, role");
  if (readError) return { error: "Could not read the accounts. Try again." };
  const existing = profiles.find((p) => p.email.toLowerCase() === email);
  if (existing) {
    const sameName = !name || existing.name === name;
    if (existing.role === role && sameName) return { error: "Could not add (already listed?)." };
    return applyRole(gate.viewer, existing.user_id, role, name || undefined);
  }

  const { error } = await admin.from("role_grants").insert({ email, role, name: name || null });
  if (error) return { error: "Could not add (already listed?)." };
  revalidatePath(PAGE);
  return { ok: `${name || email} added as ${article(role)}. It applies the first time they sign in.` };
}

/** Admin: move an account between student, instructor and admin. */
export async function setAccountRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminGate();
  if ("error" in gate) return gate;
  const userId = String(formData.get("user") ?? "");
  const role = roleFrom(formData.get("role"));
  if (!UUID.test(userId) || !role) return { error: "Bad request." };
  return applyRole(gate.viewer, userId, role);
}

/** Admin: change the role a not-yet-signed-in address will get. */
export async function setGrantRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminGate();
  if ("error" in gate) return gate;
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const role = roleFrom(formData.get("role"));
  if (!email.includes("@") || !role) return { error: "Bad request." };
  const { data, error } = await createAdminClient().from("role_grants").update({ role }).eq("email", email).select("name").maybeSingle();
  if (error) return { error: "Could not save. Try again." };
  if (!data) return { error: "That address is no longer listed. Reload the page." };
  revalidatePath(PAGE);
  return { ok: `${data.name || email} will be ${article(role)} when they first sign in.` };
}
