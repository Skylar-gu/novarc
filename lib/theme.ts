import { storageKeys } from "@/lib/site";

export type ThemeChoice = "light" | "dark" | "system";

/** Order the header toggle cycles through. */
export const themeCycle: ThemeChoice[] = ["light", "dark", "system"];

/** Fired on <window> whenever the theme choice changes in this tab. */
export const THEME_EVENT = "novarc:themechange";

/**
 * Inline script for the document <head>. Runs before first paint, reads the
 * stored choice, and sets `data-theme` on <html> so the correct palette is
 * applied with no flash of the wrong theme.
 *
 * - "light" / "dark": set the attribute explicitly.
 * - "system" or unset: remove the attribute and let the
 *   `prefers-color-scheme` media query in globals.css decide.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(
  storageKeys.theme,
)};var c=localStorage.getItem(k);var d=document.documentElement;if(c==="light"||c==="dark"){d.setAttribute("data-theme",c);}else{d.removeAttribute("data-theme");}}catch(e){}})();`;

/** Read the persisted choice; defaults to "system" when unset or unreadable. */
export function readTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(storageKeys.theme);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

/** Apply a choice at runtime: mirror it to <html>, persist it, notify listeners. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "light" || choice === "dark") {
    root.setAttribute("data-theme", choice);
  } else {
    root.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(storageKeys.theme, choice);
  } catch {
    /* storage unavailable — the choice still applies for this page view */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/* --- useSyncExternalStore bindings ---------------------------------------- */

export function subscribeTheme(callback: () => void): () => void {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getThemeSnapshot(): ThemeChoice {
  return readTheme();
}

export function getThemeServerSnapshot(): ThemeChoice {
  return "system";
}
