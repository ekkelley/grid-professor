import { Suspense } from "react";
import { redirect } from "next/navigation";
import { sendCode, verifyCode } from "@/app/auth/actions";
import { getViewer } from "@/lib/role";
import { Card, Note } from "@/components/ui";

const input = "w-full rounded-lg border border-line bg-card px-3 py-2 text-base";
const button = "w-full rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";

async function SignInContent({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : "";
  if ((await getViewer()).user) redirect(next.startsWith("/") ? next : "/");

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      {error === "email" && <Note>That doesn&apos;t look like an email address.</Note>}
      {error === "send" && <Note>The code couldn&apos;t be sent. Wait a minute and try again.</Note>}
      {error === "code" && <Note>That code didn&apos;t match or has expired. Request a new one.</Note>}

      {email ? (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-muted">
            We emailed a 6-digit code to <span className="font-medium text-ink">{email}</span>. Enter it here.
          </p>
          <form action={verifyCode} className="space-y-3">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <label htmlFor="code" className="block text-sm font-medium">
              Code
            </label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" required autoFocus className={input} />
            <button type="submit" className={button}>
              Sign in
            </button>
          </form>
          <form action={sendCode}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="text-sm text-green-strong hover:underline">
              Send a new code
            </button>
          </form>
        </Card>
      ) : (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-muted">Enter your email and we&apos;ll send a one-time code. No password to remember.</p>
          <form action={sendCode} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required autoFocus className={input} />
            <button type="submit" className={button}>
              Email me a code
            </button>
          </form>
        </Card>
      )}
      <p className="text-xs text-muted">Signing in lets the course remember what you&apos;ve watched and done. Browsing works without it.</p>
    </div>
  );
}

export default function SignIn({ searchParams }: PageProps<"/sign-in">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <SignInContent searchParams={searchParams} />
    </Suspense>
  );
}
