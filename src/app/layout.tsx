import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { setPreview, signOut } from "@/app/auth/actions";
import { getViewer } from "@/lib/role";
import { Wordmark } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Grid Professor", template: "%s · Grid Professor" },
  description: "Excel teaching, learning and grading.",
};

async function Account() {
  const viewer = await getViewer();
  if (!viewer.user) {
    return (
      <Link href="/sign-in" className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium hover:bg-bg">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {viewer.actualRole !== "student" && (
        <form action={setPreview} className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
          <span className="px-1.5 text-muted">View as</span>
          <button
            type="submit"
            name="preview"
            value="self"
            aria-pressed={!viewer.previewing}
            className={`rounded-md px-2 py-0.5 capitalize ${!viewer.previewing ? "bg-green text-white" : "hover:bg-bg"}`}
          >
            {viewer.actualRole}
          </button>
          <button
            type="submit"
            name="preview"
            value="student"
            aria-pressed={viewer.previewing}
            className={`rounded-md px-2 py-0.5 ${viewer.previewing ? "bg-green text-white" : "hover:bg-bg"}`}
          >
            Student
          </button>
        </form>
      )}
      <span className="max-w-48 truncate text-muted" title={viewer.user.email}>
        {viewer.user.email}
      </span>
      <form action={signOut}>
        <button type="submit" className="rounded-lg border border-line bg-card px-3 py-1.5 font-medium hover:bg-bg">
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-card focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Wordmark />
            <Suspense fallback={<span className="h-9" />}>
              <Account />
            </Suspense>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-line py-4 text-center text-xs text-muted">Prototype. Workbooks are graded by the Grid Professor add-in inside Excel.</footer>
      </body>
    </html>
  );
}
