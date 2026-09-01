"use client";

import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /** Fraction of the element that must be visible to trigger. */
  threshold?: number;
  /** Margin around the root, e.g. "0px 0px -10% 0px" to fire slightly early. */
  rootMargin?: string;
  /**
   * When true (default) the element is considered "in view" once and stays
   * that way — suitable for reveal-on-scroll. Set false to track visibility
   * continuously.
   */
  once?: boolean;
}

/**
 * IntersectionObserver hook. Attach `ref` to the element to watch; read
 * `inView` for its visibility state.
 *
 * Degrades safely: if IntersectionObserver is unavailable (very old browsers,
 * some SSR-adjacent contexts) the element is reported visible immediately so
 * content is never hidden. Callers must still provide a non-animated resting
 * state for `prefers-reduced-motion`.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } =
    options;

  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer support: reveal on the next frame so content is never
      // left hidden. Deferred, so it is not a synchronous effect-body setState.
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
