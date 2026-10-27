import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { InstrumentApp } from "@/app/instrument/InstrumentApp";
import { site, ogImage } from "@/lib/site";

const description =
  "A working prototype of the NOVARC instrument: paste one AI conversation, and it reads how much of the thinking was yours and how well you reasoned, with every score attached to your own words.";
const ogTitle = `Instrument · ${site.name}`;

export const metadata: Metadata = {
  title: "Instrument",
  description,
  alternates: { canonical: "/instrument" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: ogTitle,
    description,
    url: `${site.url}/instrument`,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
};

/**
 * `/instrument` — the prototype surface. This shell is a server component so the
 * metadata and the page `<h1>` are real and prerendered; the interaction is the
 * `InstrumentApp` client island below.
 */
export default function InstrumentPage() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
            Prototype
          </p>
          <h1 className="max-w-3xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-text sm:text-5xl">
            Read one session
          </h1>
          <div className="mt-6 flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-text-muted">
            <p>
              Paste a single conversation you had with an AI assistant. The
              instrument scores your half of it: Load, the share of the thinking
              you carried, and Rigor, the quality of your reasoning where you
              engaged. Every score opens to the passages from your own messages
              behind it, and most sessions come back unscored.
            </p>
            <p>
              Your transcript is sent once to the scoring route and is not
              stored on a server. The scores it returns are kept only in this
              browser.
            </p>
          </div>
        </Container>
      </section>

      <InstrumentApp />
    </>
  );
}
