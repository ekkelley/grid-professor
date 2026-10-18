export type Provider = "google" | "azure";

/** Sign-in providers switched on for this deployment (NEXT_PUBLIC_AUTH_PROVIDERS, e.g. "google,azure"). Each needs its Supabase configuration first. */
export function enabledProviders(): Provider[] {
  return (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Provider => p === "google" || p === "azure");
}
