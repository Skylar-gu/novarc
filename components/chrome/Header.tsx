"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navItems, site, waitlist } from "@/lib/site";
import { LinkButton } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { Wordmark } from "@/components/chrome/Wordmark";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(pathname);

  // Close the mobile menu when the route changes. Adjusted during render (the
  // React-sanctioned alternative to a route-change effect): when the path no
  // longer matches the one last seen, record it and collapse the menu.
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ground/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[80rem] items-center gap-4 px-6 py-3 sm:px-8">
        <Link
          href="/"
          aria-label={`${site.name} — home`}
          className="flex shrink-0 items-center gap-3"
        >
          <Wordmark />
          <span className="hidden text-xs text-text-muted sm:inline">
            {site.location}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-auto hidden items-center gap-6 md:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors duration-150 hover:text-text",
                isActive(pathname, item.href)
                  ? "text-text"
                  : "text-text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LinkButton
            href="/#waitlist"
            size="sm"
            className="hidden sm:inline-flex"
          >
            {waitlist.cta}
          </LinkButton>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors duration-150 hover:bg-surface hover:text-text md:hidden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M3 3l10 10M13 3L3 13" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-ground md:hidden"
        >
          <nav
            aria-label="Primary (mobile)"
            className="mx-auto flex w-full max-w-[80rem] flex-col px-6 py-2 sm:px-8"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isActive(pathname, item.href) ? "page" : undefined
                }
                className={cn(
                  "border-b border-border py-3 text-sm last:border-b-0",
                  isActive(pathname, item.href)
                    ? "text-text"
                    : "text-text-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <LinkButton href="/#waitlist" size="sm" className="my-3 self-start">
              {waitlist.cta}
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  );
}
