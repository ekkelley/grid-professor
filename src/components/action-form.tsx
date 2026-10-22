"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

/** What a form action reports back: one sentence either way. */
export type ActionState = { ok?: string; error?: string };

/**
 * A form around a Server Action that returns an ActionState, showing the sentence inline instead
 * of navigating. The action's revalidatePath refreshes the page around it.
 */
export function ActionForm({
  action,
  children,
  className = "",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {pending ? (
        <p role="status" className="text-sm text-muted">
          Saving
        </p>
      ) : state.error ? (
        <p role="alert" className="rounded-lg bg-note-bg px-3 py-1.5 text-sm text-note-ink">
          {state.error}
        </p>
      ) : state.ok ? (
        <p role="status" className="text-sm font-medium text-green-strong">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
