import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

// Next already emits `<meta name="robots" content="noindex">` for the
// not-found route; no explicit `robots` here, to avoid a duplicate tag.
export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Root 404. Renders inside the shared chrome from `app/layout.tsx`. Carries its
 * own `<h1>` — it is a standalone page, not one of the marketing routes.
 */
export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
          404
        </p>
        <h1 className="max-w-3xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-text sm:text-5xl">
          That page is not here.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
          The address may be out of date, or the page may never have existed.
          Everything published so far is reachable from the home page.
        </p>
        <div className="mt-9">
          <LinkButton href="/">Return home</LinkButton>
        </div>
      </Container>
    </section>
  );
}
