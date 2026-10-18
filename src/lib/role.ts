import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Role = Database["public"]["Enums"]["user_role"];
export const ROLES: readonly Role[] = ["student", "instructor", "admin"];

/** Set by an instructor or admin to see the site as a lesser role would. */
export const PREVIEW_COOKIE = "gp_preview";

/** The roles someone may preview as: anything below their own. */
export function previewRoles(actualRole: Role): Role[] {
  return ROLES.slice(0, ROLES.indexOf(actualRole));
}

export type Viewer = {
  user: { id: string; email: string } | null;
  /** The role the site acts on. Student when signed out, or when an editor is previewing. */
  role: Role;
  /** The role the signed-in person actually holds. */
  actualRole: Role;
  previewing: boolean;
};

export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { user: null, role: "student", actualRole: "student", previewing: false };

  const { data: profile } = await supabase.from("profiles").select("role, email").eq("user_id", claims.sub).maybeSingle();
  const actualRole: Role = profile?.role ?? "student";
  const wanted = (await cookies()).get(PREVIEW_COOKIE)?.value;
  const preview = previewRoles(actualRole).find((r) => r === wanted);
  return {
    user: { id: claims.sub, email: profile?.email ?? (typeof claims.email === "string" ? claims.email : "") },
    role: preview ?? actualRole,
    actualRole,
    previewing: preview !== undefined,
  };
}

export async function getRole(): Promise<Role> {
  return (await getViewer()).role;
}

export function canEditCourses(role: Role): boolean {
  return role === "instructor" || role === "admin";
}

export async function requireEditor(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!canEditCourses(viewer.role)) throw new Error("Only instructors and admins can change a course.");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer.role !== "admin") throw new Error("Only admins can change content.");
  return viewer;
}

export async function requireUser(): Promise<Viewer & { user: NonNullable<Viewer["user"]> }> {
  const viewer = await getViewer();
  if (!viewer.user) throw new Error("Sign in first.");
  return viewer as Viewer & { user: NonNullable<Viewer["user"]> };
}
