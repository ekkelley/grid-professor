"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The side panel on a module page. The video stays where it is; the reading and the help open
 * beside it (on wide screens) or over it (on narrow ones), never on another page.
 */
type View = "read" | "help" | null;
type PanelState = { view: View; itemId: string | null; open: (view: Exclude<View, null>, itemId?: string) => void; close: () => void };

const PanelContext = createContext<PanelState | null>(null);

export type HelpEntry = { id: string; title: string; label: string; skills: string[]; node: ReactNode };

export function ModulePanelProvider({ children, reading, help, skills }: { children: ReactNode; reading: ReactNode | null; help: HelpEntry[]; skills: string[] }) {
  const [view, setView] = useState<View>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const open = useCallback((v: Exclude<View, null>, id?: string) => {
    setView(v);
    setItemId(id ?? null);
  }, []);
  const close = useCallback(() => {
    setView(null);
    setItemId(null);
  }, []);
  const isOpen = view !== null;

  return (
    <PanelContext.Provider value={{ view, itemId, open, close }}>
      <div className={isOpen ? "lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8" : ""}>
        <div className="min-w-0">{children}</div>
        {isOpen && <Panel reading={reading} help={help} skills={skills} />}
      </div>
    </PanelContext.Provider>
  );
}

export function PanelButton({ target, children, className = "" }: { target: "read" | "help"; children: ReactNode; className?: string }) {
  const ctx = useContext(PanelContext);
  if (!ctx) return null;
  const active = ctx.view === target;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => (active ? ctx.close() : ctx.open(target))}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${active ? "border-green bg-green text-white" : "border-line bg-card text-ink hover:bg-bg"} ${className}`}
    >
      {children}
    </button>
  );
}

function Panel({ reading, help, skills }: { reading: ReactNode | null; help: HelpEntry[]; skills: string[] }) {
  const ctx = useContext(PanelContext)!;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selected = ctx.itemId ? help.find((h) => h.id === ctx.itemId) : undefined;

  useEffect(() => {
    headingRef.current?.focus();
  }, [ctx.view, ctx.itemId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx.close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ctx]);

  const title = ctx.view === "read" ? "Read instead" : selected ? selected.title : "Help with this module";

  return (
    <aside
      aria-label={title}
      className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-line bg-card shadow-xl lg:inset-auto lg:sticky lg:top-6 lg:z-auto lg:max-h-[calc(100vh-3rem)] lg:w-auto lg:max-w-none lg:rounded-xl lg:border lg:shadow-none"
    >
      <div className="flex items-start gap-3 border-b border-line px-4 py-3">
        {selected && (
          <button type="button" onClick={() => ctx.open("help")} className="mt-0.5 shrink-0 text-sm text-green-strong hover:underline">
            ← Help
          </button>
        )}
        <h2 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 font-semibold outline-none">
          {title}
        </h2>
        <button
          type="button"
          onClick={ctx.close}
          aria-label="Close and go back to the video"
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-bg hover:text-ink"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {ctx.view === "read" && <div className="p-4">{reading ?? <p className="text-sm text-muted">This module has no reading.</p>}</div>}

        {ctx.view === "help" && !selected && (
          <div>
            {skills.length > 0 && (
              <div className="border-b border-line px-4 py-3">
                <p className="text-xs text-muted">This module uses</p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {skills.map((s) => (
                    <li key={s} className="rounded-full bg-green-tint px-2 py-0.5 text-xs font-medium text-green-strong">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {help.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">Nothing in the library matches this module&apos;s skills yet.</p>
            ) : (
              <ul>
                {help.map((h) => (
                  <li key={h.id} className="border-line [&:not(:first-child)]:border-t">
                    <button type="button" onClick={() => ctx.open("help", h.id)} className="block w-full px-4 py-3 text-left hover:bg-bg">
                      <span className="block text-xs text-muted">{h.label}</span>
                      <span className="block font-medium">{h.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {ctx.view === "help" && selected && <div className="p-4">{selected.node}</div>}
      </div>

      <div className="border-t border-line px-4 py-2.5 lg:hidden">
        <button type="button" onClick={ctx.close} className="text-sm font-medium text-green-strong hover:underline">
          Back to the video
        </button>
      </div>
    </aside>
  );
}
