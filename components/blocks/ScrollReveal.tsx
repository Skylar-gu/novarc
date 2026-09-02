"use client";

import type { ElementType, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/useInView";

export interface ScrollRevealProps {
  /** Content to reveal. */
  children: ReactNode;
  /** Element or component to render. Defaults to `"div"`. */
  as?: ElementType;
  /** Delay before the reveal transition starts, in milliseconds. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its children into place the first time they scroll into view
 * (`useInView` with `once: true`).
 *
 * Reduced motion: the `motion-reduce:*` utilities force the resting state
 * (fully opaque, no translate, no transition) regardless of the in-view state,
 * so the content is simply present with no animation.
 *
 * No JavaScript: the pre-reveal state is `opacity-0`, which would leave the
 * content invisible if the reveal never runs. The `.nv-reveal` marker class
 * pairs with a `<noscript>` stylesheet in `app/layout.tsx` that forces the
 * resting state (opaque, untransformed) when scripting is disabled. That rule
 * is inert when JS runs, so the animation is unaffected in the common case.
 */
export function ScrollReveal({
  children,
  as,
  delay = 0,
  className,
}: ScrollRevealProps) {
  const Tag: ElementType = as ?? "div";
  const { ref, inView } = useInView<HTMLElement>({ once: true });

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "nv-reveal transition duration-700 ease-out will-change-transform",
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
