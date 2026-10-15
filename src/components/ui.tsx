import Link from "next/link";
import type { ReactNode } from "react";
import type { Tag } from "@/lib/data";

export function Logo() {
  return (
    <span aria-hidden="true" className="grid size-7 grid-cols-2 gap-[3px] rounded-md bg-green p-[5px]">
      <span className="rounded-[2px] bg-white" />
      <span className="rounded-[2px] bg-white" />
      <span className="rounded-[2px] bg-white" />
      <span className="rounded-[2px] bg-white" />
    </span>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-ink">
      <Logo />
      <span className="text-[17px]">
        Grid<span className="text-green">Professor</span>
      </span>
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "note" }) {
  const tones = {
    neutral: "bg-bg text-muted border-line",
    green: "bg-green-tint text-green-strong border-green-tint",
    note: "bg-note-bg text-note-ink border-note-bg",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-note-bg px-4 py-3 text-sm text-note-ink">{children}</div>;
}

export function TagList({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills and topics">
      {tags.map((t) => (
        <li key={`${t.kind}:${t.slug}`}>
          <Badge tone={t.kind === "skill" ? "green" : "neutral"}>
            <span className="sr-only">{t.kind === "skill" ? "Excel skill: " : "Topic: "}</span>
            {t.name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const styles =
    variant === "primary"
      ? "bg-green text-white hover:bg-green-strong"
      : "border border-line bg-card text-ink hover:bg-bg";
  return (
    <Link href={href} className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium ${styles}`}>
      {children}
    </Link>
  );
}
