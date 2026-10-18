"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CourseTabs({ slug, showEdit }: { slug: string; showEdit: boolean }) {
  const pathname = usePathname();
  const base = `/courses/${slug}`;
  const tabs = [
    { href: base, label: "Roadmap", active: pathname === base || pathname.startsWith(`${base}/modules`) },
    { href: `${base}/library`, label: "Library", active: pathname.startsWith(`${base}/library`) || pathname.startsWith(`${base}/items`) },
    { href: `${base}/grades`, label: "Grades", active: pathname.startsWith(`${base}/grades`) },
    ...(showEdit ? [{ href: `${base}/edit`, label: "Edit course", active: pathname.startsWith(`${base}/edit`) }] : []),
  ];
  return (
    <nav aria-label="Course" className="border-b border-line">
      <ul className="-mb-px flex gap-6">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`inline-block border-b-2 pb-2.5 text-sm font-medium ${
                t.active ? "border-green text-green-strong" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
