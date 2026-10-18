"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_COOKIE, getViewer, previewRoles } from "@/lib/role";

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Start a Google or Microsoft sign-in. The browser goes to the provider and comes back to /auth/callback. */
export async function signInWith(formData: FormData) {
  const provider = String(formData.get("provider"));
  if (provider !== "google" && provider !== "azure") throw new Error("Unknown sign-in provider.");
  const next = safeNext(formData.get("next"));
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      // Supabase needs a verified email from Microsoft; Google sends one by default.
      ...(provider === "azure" ? { scopes: "email" } : {}),
    },
  });
  if (error || !data.url) redirect(`/sign-in?error=provider&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

/** Step 1: email a one-time code. New addresses become accounts on first sign-in. */
export async function sendCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/sign-in?error=email&next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) redirect(`/sign-in?error=send&next=${encodeURIComponent(next)}`);
  redirect(`/sign-in?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

/** Step 2: check the code. On success the session cookie is set and the person is signed in. */
export async function verifyCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) redirect(`/sign-in?email=${encodeURIComponent(email)}&error=code&next=${encodeURIComponent(next)}`);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(PREVIEW_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}

/** Instructors and admins can look at the site as a lesser role would. */
export async function setPreview(formData: FormData) {
  const viewer = await getViewer();
  const wanted = formData.get("preview");
  const role = previewRoles(viewer.actualRole).find((r) => r === wanted);
  const store = await cookies();
  if (role) {
    store.set(PREVIEW_COOKIE, role, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 });
  } else {
    store.delete(PREVIEW_COOKIE);
  }
  revalidatePath("/", "layout");
}
