import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/role";

/** Someone on the platform: an account (signed in at least once) or a grant waiting for its first sign-in. */
export type Person = {
  email: string;
  name: string | null;
  role: Role;
  /** The auth user id for an account; null for a grant, whose person has not signed in yet. */
  userId: string | null;
  /** When the account was made; null for a grant. */
  joined: string | null;
  /** A note on a grant (who it is, from the migration that made it); null for an account. */
  note: string | null;
};

/**
 * Everyone, one list by email: accounts from profiles, plus role_grants rows with no account yet.
 * Service role; only the admin's accounts page calls this.
 */
export async function listPeople(): Promise<Person[]> {
  const admin = createAdminClient();
  const [{ data: profiles, error }, { data: grants, error: grantError }] = await Promise.all([
    admin.from("profiles").select("user_id, email, name, role, created_at"),
    admin.from("role_grants").select("email, name, role, note"),
  ]);
  if (error) throw new Error(error.message);
  if (grantError) throw new Error(grantError.message);
  const accounts: Person[] = profiles.map((p) => ({ email: p.email, name: p.name, role: p.role, userId: p.user_id, joined: p.created_at, note: null }));
  const taken = new Set(accounts.map((a) => a.email.toLowerCase()));
  const pending: Person[] = grants
    .filter((g) => !taken.has(g.email))
    .map((g) => ({ email: g.email, name: g.name, role: g.role, userId: null, joined: null, note: g.note }));
  return [...accounts, ...pending].sort((a, b) => a.email.localeCompare(b.email));
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
