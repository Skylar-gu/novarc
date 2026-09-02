import type { Metadata } from "next";
import { Hero } from "@/components/blocks/Hero";
import { Section } from "@/components/ui/Section";
import { HouseSection } from "@/components/blocks/HouseSection";
import { FAQ } from "@/components/blocks/FAQ";
import { WaitlistForm } from "@/components/blocks/WaitlistForm";
import { externalLinks, site, ogImage } from "@/lib/site";

const description =
  "The company behind the instrument: its founding argument, why it is run as a single house rather than a set of startups, and answers to the questions that come up most.";
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
  "NOVARC builds AI, out of Zürich. The measure it works to is easy to state: with the system switched off, is the person more capable than before, or less? A first instrument is being validated as of now; everything after it answers to the same measure.";

const ARG_PARAS = [
  "The design goal in most products is convenience — fewer steps for the user, more of the work moved onto the system. Sustained at scale over years, that pattern is what people mean by cognitive outsourcing.",
  "A capacity you stop exercising doesn't hold its level; it slides. NOVARC runs the exchange in reverse. Each build — model, agent, or tool — has to clear one bar: take it away, and does the person come out ahead or behind? What the system generated on its own has no bearing on the answer.",
];

const ARG_RULE =
  "That sets a hard release line. Anything that sends its users away diminished is something we do not put out.";

const HOUSE_LEAD =
  "NOVARC is deliberately one company rather than a family of spin-offs. Everything it makes is made in the same place, and each product is built on top of what the ones before it established.";

const HOUSE_POINTS = [
  {
    title: "A single company",
    body: "One legal entity, one name, one bar for anything that ships. Ideas are not spun out into ventures of their own.",
  },
  {
    title: "A sequence of products",
    body: "The one in validation now is the first, not the full set. Models, agents, and further tools are meant to follow, all measured against the same six outcomes.",
  },
  {
    title: "Gains that carry forward",
    body: "Because it all stays in one place, it adds up — findings, hard-won craft, earned credibility. Each product starts from the position the last one reached.",
  },
];

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

const FAQ_ITEMS = [
  {
    q: "Who is behind NOVARC, and what was the starting observation?",
    a: "Pavel Abdulin founded it in 2026, in Zürich. The starting observation was that the commercial mainstream in AI keeps moving toward systems that take on more and more of the user's thinking, while the decade-scale cost of that shift goes mostly unexamined. The company exists to examine it and to build the other way.",
  },
  {
    q: "What sets NOVARC apart from the rest of the field?",
    a: "Most of the field works on the system: better output, delivered quicker, needing less from the user with each version. NOVARC works on the user instead. Success is measured by what someone can still do without the tool in hand, weeks after a session — not by anything the tool generated during it. That measure governs both the research agenda and the product roadmap.",
  },
  {
    q: "What is NOVARC building, in concrete terms?",
    a: "Models, agents, and finished products, all under the single conviction the company was founded on. The cognitive-augmentation work is where it starts, not where it stops: the first piece is an instrument that reports how well your reasoning is holding up. What is in development now is that instrument; anything later gets described once it is real, and not before.",
  },
  {
    q: "When does the first product open to users?",
    a: "It is in testing now and due to reach people in 2026, with no public name attached until then. Pricing and access terms go out ahead of that date, and the waitlist is told before everyone else.",
  },
  {
    q: "Is NOVARC a lab or a business?",
    a: "Both, and not as separate departments. NOVARC runs its own inquiry into how people think and how machine intelligence behaves, and it ships products built on what that inquiry turns up. Selling the products pays for the inquiry; the inquiry decides which products are worth building, and when. Neither is a hobby bolted onto the other.",
  },
  {
    q: "Is NOVARC attached to a university?",
    a: "No — it is an independent company. The work builds on published results from groups at MIT, Carnegie Mellon, ETH Zürich, and elsewhere, but carries no formal tie to any institution.",
  },
  {
    q: "Where does NOVARC post its updates?",
    a: (
      <>
        Research notes, product news, and company updates are posted publicly on{" "}
        <a
          href={externalLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          LinkedIn
        </a>{" "}
        as they happen. Anything about the first product goes to the waitlist
        before it appears there.
      </>
    ),
  },
  {
    q: "Against what is augmentation actually measured?",
    a: "Against the six outcomes above, and in time against readings from the instrument itself. The claim is built to resolve to numbers: whether a person's unaided reasoning, recall, and structured thinking hold their level or improve across months of use. If those figures move the wrong way, the product has failed the standard it set for itself.",
  },
];

const LOC_BODY =
  "NOVARC works out of Zürich. That first instrument is moving through its validation program now, with launch set for 2026. Whoever is on the waitlist hears before any public announcement.";

const CTA_BODY =
  "The instrument that will test whether that holds is currently in validation. The waitlist gets the first word at launch.";

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About NOVARC"
        headline={
          <>
            We build AI to <em>enlarge</em> what a person is capable of, not to
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
        eyebrow="Structure"
        title="Built as one company, across successive products."
      >
        <HouseSection lead={HOUSE_LEAD} points={HOUSE_POINTS} />
      </Section>

      <Section
        index={3}
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

      <Section title="Questions, answered">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Zürich-based, not Zürich-bound.">
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          {LOC_BODY}
        </p>
      </Section>

      <Section title="The point is that you end up more capable, not less.">
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          {CTA_BODY}
        </p>
        <div className="mt-8">
          <WaitlistForm />
        </div>
      </Section>
    </>
  );
}
