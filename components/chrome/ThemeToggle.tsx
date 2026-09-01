"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  applyTheme,
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeTheme,
  themeCycle,
  type ThemeChoice,
} from "@/lib/theme";

const labels: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function Icon({ choice }: { choice: ThemeChoice }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (choice === "light") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7 13 13M13 3l-1.3 1.3M4.3 11.7 3 13" />
      </svg>
    );
  }

  if (choice === "dark") {
    return (
      <svg {...common}>
        <path d="M13.2 9.4A5.6 5.6 0 0 1 6.6 2.8 5.6 5.6 0 1 0 13.2 9.4Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="1.75" y="3" width="12.5" height="8.5" rx="1" />
      <path d="M6 14h4M8 11.5V14" />
    </svg>
  );
}

/**
 * Cycles light → dark → system → light. Persists the choice to localStorage
 * and mirrors it onto <html data-theme>. When set to "system" the attribute is
 * removed and the `prefers-color-scheme` media query in globals.css takes over.
 *
 * State is read through `useSyncExternalStore`, so the server and first client
 * paint agree on "system" and the real choice is picked up without a flash or a
 * hydration warning (the no-FOUC head script has already set the palette).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const choice = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const nextChoice =
    themeCycle[(themeCycle.indexOf(choice) + 1) % themeCycle.length];

  return (
    <button
      type="button"
      onClick={() => applyTheme(nextChoice)}
      aria-label={`Theme: ${labels[choice]}. Switch to ${labels[nextChoice]}.`}
      title={`Theme: ${labels[choice]}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors duration-150 hover:bg-surface hover:text-text",
        className,
      )}
    >
      <Icon choice={choice} />
    </button>
  );
}
