import { Suspense } from "react";
import Link from "next/link";
import { joinCourse } from "@/app/actions";
import { getViewer } from "@/lib/role";
import { Card, Note } from "@/components/ui";

async function JoinContent({ searchParams }: Pick<PageProps<"/join">, "searchParams">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code.toUpperCase() : "";
  const error = typeof params.error === "string" ? params.error : "";
  const viewer = await getViewer();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Join a course</h1>
      <p className="text-muted">Your instructor gives you a six-character code. Enter it once and the course shows up on your home page.</p>
      {error === "shape" && <Note>A join code is six letters and numbers, like K7PM3Q.</Note>}
      {error === "unknown" && <Note>No course has that code. Check it with your instructor.</Note>}
      <Card className="p-5">
        {viewer.user ? (
          <form action={joinCourse} className="space-y-3">
            <label htmlFor="code" className="block text-sm font-medium">
              Join code
            </label>
            <input
              id="code"
              name="code"
              defaultValue={code}
              required
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={7}
              placeholder="K7PM3Q"
              className="w-full rounded-lg border border-line bg-card px-3 py-2 font-mono text-lg uppercase tracking-[0.2em] placeholder:tracking-[0.2em] placeholder:text-muted/60"
            />
            <button type="submit" className="w-full rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong">
              Join
            </button>
          </form>
        ) : (
          <p className="text-sm">
            <Link href={`/sign-in?next=${encodeURIComponent(`/join${code ? `?code=${code}` : ""}`)}`} className="font-medium text-green-strong hover:underline">
              Sign in
            </Link>{" "}
            first, then enter your code. It takes a minute and there&apos;s no password to remember.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function Join({ searchParams }: PageProps<"/join">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <JoinContent searchParams={searchParams} />
    </Suspense>
  );
}
