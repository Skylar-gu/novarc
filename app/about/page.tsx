import type { Metadata } from "next";
import { Hero } from "@/components/blocks/Hero";
import { Section } from "@/components/ui/Section";
import { site, ogImage } from "@/lib/site";

const description =
  "The company behind the instrument: its founding argument, and the six outcomes every NOVARC product is held to.";
const ogTitle = `About · ${site.name}`;

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: ogTitle,
    description,
    url: `${site.url}/about`,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
};

const HERO_SUB =
  "NOVARC builds AI that gives an affirmative to: without the system, is the person more capable than before, or less? A first instrument is being validated as of now; everything after it answers to the same measure.";

const ARG_PARAS = [
  "The design goal in most products is convenience — fewer steps for the user, more of the work moved onto the system. Sustained at scale over years, that pattern is what people mean by cognitive outsourcing.",
  "A capacity you stop exercising doesn't hold its level; it slides. NOVARC runs the exchange in reverse. Each build — model, agent, or tool — has to clear one bar: take it away, and does the person come out ahead or behind? What the system generated on its own has no bearing on the answer.",
];

const ARG_RULE =
  "Anything that sends its users away diminished is something we do not put out.";

const OUT_INTRO =
  "“Augmentation” means little until you say how you would know it happened. Here is how: six outcomes, each one a thing a NOVARC product can be checked for.";

const OUTCOMES = [
  {
    term: "Strengthen reasoning ability",
    gloss:
      "Sharper inference, fewer skipped steps, arguments that hold their shape under pressure.",
  },
  {
    term: "Increase learning speed",
    gloss:
      "Less elapsed time between meeting an idea and being able to use it.",
  },
  {
    term: "Improve memory formation",
    gloss:
      "More of what passes through is still there a week later, without a second study pass.",
  },
  {
    term: "Enhance structured thinking",
    gloss: "Large problems split into parts that fit back together.",
  },
  {
    term: "Enable deeper problem-solving",
    gloss: "Traction on questions that were previously out of reach.",
  },
  {
    term: "Increase the rate of original discovery",
    gloss: "More conclusions that were not already contained in the prompt.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About NOVARC"
        headline={
          <>
            We build AI to <em>expand</em> what a person is capable of, not to
            do it for them.
          </>
        }
        sub={HERO_SUB}
        primaryCta={{ label: "Join the waitlist", href: "/#waitlist" }}
        secondaryCta={{ label: "See the first instrument", href: "/product" }}
      />

      <Section
        index={1}
        eyebrow="The argument"
        title="Judged by what the user can do afterward"
      >
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          {ARG_PARAS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-10 max-w-3xl font-serif text-2xl font-medium leading-snug text-text sm:text-3xl">
          {ARG_RULE}
        </p>
      </Section>

      <Section
        index={2}
        eyebrow="The standard"
        title="Six outcomes we hold every product to"
      >
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          {OUT_INTRO}
        </p>
        <ol className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
          {OUTCOMES.map((outcome, position) => (
            <li
              key={outcome.term}
              className="flex flex-col gap-2 border-t border-border pt-4"
            >
              <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-xl font-medium text-text">
                {outcome.term}
              </span>
              <span className="leading-relaxed text-text-muted">
                {outcome.gloss}
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
