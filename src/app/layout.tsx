import { Suspense } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { setRole } from "@/app/actions";
import { ROLES, getRole } from "@/lib/role";
import { Wordmark } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Grid Professor", template: "%s · Grid Professor" },
  description: "Excel teaching, learning and grading.",
};

async function RoleSwitcher() {
  const role = await getRole();
  return (
    <form action={setRole} className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 text-sm">
      <span className="px-2 text-muted">Viewing as</span>
      {ROLES.map((r) => (
        <button
          key={r}
          type="submit"
          name="role"
          value={r}
          aria-pressed={r === role}
          className={`rounded-md px-2.5 py-1 capitalize ${r === role ? "bg-green text-white" : "text-ink hover:bg-bg"}`}
        >
          {r}
        </button>
      ))}
    </form>
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
              <RoleSwitcher />
            </Suspense>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-line py-4 text-center text-xs text-muted">
          Prototype. Sign-in is a role switcher and workbooks open by link until the add-in API exists.
        </footer>
      </body>
    </html>
  );
}
