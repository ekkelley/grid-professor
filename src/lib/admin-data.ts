import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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
