import { Container } from "@/components/ui/Container";

export default function HomePage() {
  return (
    <Container className="py-28 sm:py-36">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
        NOVARC
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-text sm:text-5xl">
        Home — under construction
      </h1>
      <p className="mt-5 max-w-prose text-text-muted">
        The scaffold, design tokens, and page chrome are in place. Section
        content arrives in a later work package.
      </p>
    </Container>
  );
}
