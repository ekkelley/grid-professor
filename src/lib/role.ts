import "server-only";
import { cookies } from "next/headers";

/**
 * Prototype stand-in for sign-in. The viewer picks a role and it is kept in a cookie.
 * Replaced by real identity (SPEC section 10) before any student uses this.
 */
export const ROLES = ["student", "instructor", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_COOKIE = "gp_role";

export async function getRole(): Promise<Role> {
  const value = (await cookies()).get(ROLE_COOKIE)?.value;
  return ROLES.includes(value as Role) ? (value as Role) : "student";
}

export function canEditCourses(role: Role): boolean {
  return role === "instructor" || role === "admin";
}

export async function requireEditor(): Promise<Role> {
  const role = await getRole();
  if (!canEditCourses(role)) throw new Error("Only instructors and admins can change a course.");
  return role;
}

export async function requireAdmin(): Promise<Role> {
  const role = await getRole();
  if (role !== "admin") throw new Error("Only admins can change content.");
  return role;
}
