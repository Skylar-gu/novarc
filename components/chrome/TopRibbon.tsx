"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { storageKeys, waitlist } from "@/lib/site";
import { Container } from "@/components/ui/Container";

const RIBBON_EVENT = "novarc:ribbonchange";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(RIBBON_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(RIBBON_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(storageKeys.ribbonDismissed) !== "1";
  } catch {
    return true;
  }
}

/** Closed during SSR and first paint, so a previously dismissed bar never flashes. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Announcement bar above the header. Dismissible; the dismissal persists to
 * localStorage and is read back through `useSyncExternalStore`, so it stays
 * closed on return visits with no flash-then-hide.
 */
export function TopRibbon() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function dismiss() {
    try {
      localStorage.setItem(storageKeys.ribbonDismissed, "1");
    } catch {
      /* storage unavailable — bar reappears next load, acceptable */
    }
    window.dispatchEvent(new Event(RIBBON_EVENT));
  }

  if (!open) return null;

  return (
    <div className="border-b border-border bg-surface text-text-muted">
      <Container width="wide" className="flex items-center gap-3 py-2 text-xs">
        <p className="min-w-0 flex-1 sm:truncate">
          <span>{waitlist.ribbon} </span>
          <Link
            href="/#waitlist"
            className="font-medium text-text underline underline-offset-2 hover:text-accent"
          >
            {waitlist.ribbonAction}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-border hover:text-text"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </Container>
    </div>
  );
}
