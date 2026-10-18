import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-prose space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-sm text-muted">Last updated October 18, 2026</p>
      <p>
        Grid Professor is a teaching platform for Excel courses, run by Eric Kelley at the University of Tennessee and David Brown at the University of
        Arizona. This page explains what it keeps about you and why.
      </p>
      <h2 className="text-lg font-semibold">What we keep</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Your email address, and your name if Google or Microsoft provides it when you sign in.</li>
        <li>Which course videos you play and which parts of them you watch, so your instructor can grade viewing.</li>
      </ul>
      <p>You can browse course content without signing in. Nothing is kept about you until you do.</p>
      <h2 className="text-lg font-semibold">How it is used</h2>
      <p>
        Only to run your course: signing you in, showing you your progress, and showing your instructor the progress of students in their course. We
        don&apos;t sell it, share it with advertisers, or use it for anything else.
      </p>
      <h2 className="text-lg font-semibold">Where it is stored</h2>
      <p>
        The site is hosted by Vercel and its data is stored by Supabase. Sign-in codes are emailed through Resend. If you sign in with Google or Microsoft,
        we receive only your name and email address from them, never your password.
      </p>
      <h2 className="text-lg font-semibold">Your choices</h2>
      <p>
        To see or delete what we keep about you, email{" "}
        <a href="mailto:ekk.utk@gmail.com" className="font-medium text-green-strong hover:underline">
          ekk.utk@gmail.com
        </a>
        .
      </p>
    </article>
  );
}
