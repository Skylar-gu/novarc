import Link from "next/link";
import { exploreItems, site } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/chrome/Wordmark";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container width="wide" className="py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-md">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              {site.identity}
            </p>
            <p className="mt-4 text-sm text-text-muted">{site.location}</p>
          </div>

          <nav aria-label="Explore" className="md:text-right">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
              Explore
            </p>
            <ul className="mt-4 space-y-2">
              {exploreItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted transition-colors duration-150 hover:text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-xs text-text-muted">
          © 2026 {site.name} · {site.descriptor}
        </p>
      </Container>
    </footer>
  );
}
