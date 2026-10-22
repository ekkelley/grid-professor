import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

export type Account = Database["public"]["Tables"]["profiles"]["Row"];
export type RoleGrant = Database["public"]["Tables"]["role_grants"]["Row"];

/** Every account on the platform, newest first. Service role; only the admin's accounts page calls this. */
export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await createAdminClient().from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Addresses granted a role ahead of their first sign-in that have no account yet. */
export async function listPendingGrants(): Promise<RoleGrant[]> {
  const admin = createAdminClient();
  const [{ data: grants, error }, { data: profiles, error: profileError }] = await Promise.all([
    admin.from("role_grants").select("*").order("email"),
    admin.from("profiles").select("email"),
  ]);
  if (error) throw new Error(error.message);
  if (profileError) throw new Error(profileError.message);
  const taken = new Set(profiles.map((p) => p.email.toLowerCase()));
  return grants.filter((g) => !taken.has(g.email));
}

/** A section's join code. Service role only; the caller must have checked the viewer can edit the course. */
export async function getJoinCode(courseId: string): Promise<string | null> {
  const { data, error } = await createAdminClient().from("course_join_codes").select("code").eq("course_id", courseId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.code ?? null;
}

/** How many people are in a course, by role. Service role; for instructors and admins. */
export async function getMemberCounts(courseId: string): Promise<{ students: number; instructors: number }> {
  const { data, error } = await createAdminClient().from("course_members").select("role").eq("course_id", courseId);
  if (error) throw new Error(error.message);
  return { students: data.filter((m) => m.role === "student").length, instructors: data.filter((m) => m.role === "instructor").length };
}
