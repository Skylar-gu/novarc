"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { waitlist } from "@/lib/site";

type Status = "idle" | "pending" | "success" | "error" | "invalid";

export interface WaitlistFormProps {
  /**
   * "inline" places the field and button in one row from the `sm` breakpoint
   * up; "block" (default) always stacks them. Neither imposes layout beyond a
   * `max-width` on the form.
   */
  variant?: "inline" | "block";
  /** DOM id for the form element, so a page can anchor (e.g. `#waitlist`). */
  id?: string;
  className?: string;
}

/** Conservative address check: one `@`, a dotted domain, no whitespace. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Email capture for the waitlist. Validates locally, then POSTs JSON to
 * `/api/waitlist`. Renders loading, success, error, and invalid-email states
 * from the `waitlist.*` microcopy in `lib/site.ts`. Includes an off-screen
 * honeypot field that real users never see or tab to.
 */
export function WaitlistForm({
  variant = "block",
  id,
  className,
}: WaitlistFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const fieldId = useId();
  const messageId = useId();
  const successRef = useRef<HTMLParagraphElement>(null);

  // On success the form is replaced by the status message; move focus to it so
  // a keyboard user is not stranded on a control that no longer exists and the
  // confirmation is announced.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const honeypot = String(data.get("company") ?? "").trim();

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      setStatus("invalid");
      return;
    }

    setStatus("pending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: honeypot }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
      } | null;
      if (res.ok && body?.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p
        id={id}
        ref={successRef}
        role="status"
        tabIndex={-1}
        className={cn(
          "max-w-md scroll-mt-24 text-sm leading-relaxed text-text outline-none",
          className,
        )}
      >
        {waitlist.success}
      </p>
    );
  }

  const errored = status === "error" || status === "invalid";
  const liveMessage =
    status === "pending"
      ? waitlist.pending
      : status === "error"
        ? waitlist.error
        : status === "invalid"
          ? waitlist.invalidEmail
          : "";

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      noValidate
      className={cn("max-w-md scroll-mt-24", className)}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          variant === "inline" && "sm:flex-row sm:items-start",
        )}
      >
        <div className="flex-1">
          <label htmlFor={fieldId} className="sr-only">
            {waitlist.inputLabel}
          </label>
          <input
            id={fieldId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={MAX_EMAIL_LENGTH}
            placeholder={waitlist.inputPlaceholder}
            aria-describedby={messageId}
            aria-invalid={errored}
            className="h-11 w-full rounded-full border border-border bg-surface-raised px-4 text-sm text-text placeholder:text-text-muted"
          />
        </div>

        {/* Honeypot: off-screen and untabbable. A filled value marks a bot. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={`${fieldId}-company`}>Company</label>
          <input
            id={`${fieldId}-company`}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? waitlist.pending : waitlist.ctaLong}
        </Button>
      </div>

      <p
        id={messageId}
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 min-h-[1.25rem] text-sm",
          errored ? "text-text" : "text-text-muted",
        )}
      >
        {liveMessage}
      </p>
    </form>
  );
}
