"use client";

import { useLinkStatus } from "next/link";

/** Feedback before a cold route's loading boundary has been prefetched. */
export function NavigationPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] border border-tertiary/40 bg-tertiary/10" />
      <span role="status" className="sr-only">Abriendo sección…</span>
    </>
  );
}
