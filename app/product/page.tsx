import type { Metadata } from "next";

import { Hero } from "@/components/blocks/Hero";
import { InterfacePreview } from "@/components/blocks/InterfacePreview";
import { ScrollReveal } from "@/components/blocks/ScrollReveal";
import { SignalCard } from "@/components/blocks/SignalCard";
import { Section } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { site, ogImage } from "@/lib/site";
import {
  CommitmentList,
  type Commitment,
} from "@/components/product/CommitmentList";
import {
  ValidationMethods,
  type ValidationMethod,
} from "@/components/product/ValidationMethods";

const description =
  "The first NOVARC instrument reads how you reason while working with AI — three signals, every score attached to the passages behind it. In testing now; it reaches people during 2026.";
const ogTitle = `Product · ${site.name}`;

export const metadata: Metadata = {
  title: "Product",
  description,
  alternates: { canonical: "/product" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: ogTitle,
    description,
    url: `${site.url}/product`,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
};

const STANDARD: Commitment[] = [
  {
    label: "Most sessions go unscored",
    body: "You cannot read reasoning off a one-line factual query, or off a session that ends before any thinking gets going. An instrument that returns a number for every exchange anyway is manufacturing them. When the signal isn't there, the honest output is nothing.",
  },
  {
    label: "Every score opens to its evidence",
    body: "Tap a number and it expands to the exact passages from your own messages that produced it. Remove those passages and the number has nothing to stand on; it goes with them.",
  },
  {
    label: "Abstain by default",
    body: "When the evidence is thin, the instrument says so directly rather than returning a low-confidence guess.",
  },
  {
    label: "You against yourself, not a leaderboard",
    body: "No population percentile sits at the top of the screen. The comparison that counts is you now against you earlier.",
  },
];

const METHODS: ValidationMethod[] = [
  {
    name: "Agreement with human raters",
    question:
      "Do its scores line up with those of trained people marking the same transcripts?",
  },
  {
    name: "Adversarial testing",
    question:
      "Can writing that sounds like reasoning but carries none earn a high score?",
  },
  {
    name: "Repeat stability",
    question:
      "Given the same transcript twice, does it return the same score both times?",
  },
  {
    name: "Longitudinal calibration",
    question:
      "Over months, does Drift move with real change measured against a person's own baseline?",
  },
];

export default function ProductPage() {
  return (
    <>
      <Hero
        eyebrow="First NOVARC instrument · 2026"
        headline={
          <>
            Your reasoning shifts when an AI is in the loop. Until now there was
            no way to read it &mdash; so we built the <em>instrument</em>.
          </>
        }
        sub="It works alongside ChatGPT, Claude, and Gemini as you use them normally, and measures your half of each exchange rather than the model's. Ordinary use becomes three readings. Testing is under way; it reaches people during 2026."
        primaryCta={{ label: "Join the waitlist", href: "/#waitlist" }}
        secondaryCta={{ label: "Read the research", href: "/research" }}
      />

      <Section title="What the instrument is">
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          <p>
            The first NOVARC product sits in the assistants that already fill a
            working day and watches how the person on the human side of the
            conversation is thinking. Whether the model&rsquo;s answer was any
            good is not its concern. Its subject is you: the questions you
            brought, the parts of the problem you worked yourself, the point at
            which you decided the thing was settled.
          </p>
          <p>
            Its reference class is a blood panel or an EEG, not a coach and not
            a productivity dashboard. The number is not kept for its own sake.
            It reports something real about how you think, plainly, without
            softening it.
          </p>
        </div>
      </Section>

      <Section title="Interface preview — desktop view" titleClassName="sr-only">
        <ScrollReveal>
          <InterfacePreview
            variant="desktop"
            caption="A week of sessions in the desktop view: three scored, the rest left alone. Load and Rigor read as values, Drift as a direction against your personal baseline, and every figure stays attached to the passage that produced it."
          />
        </ScrollReveal>
      </Section>

      <Section title="The three signals">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SignalCard
            index={1}
            name="Load"
            gloss="the share of the thinking you carried"
          >
            Load estimates how much of the cognitive work was actually yours.
            Four moments carry the weight: settling what the problem is, doing
            the reasoning that moves it, checking whether that reasoning holds,
            and calling the answer good enough to stop. For each, the question
            is whether you did it or the model did. Word count plays no part &mdash;
            a long transcript you pasted in and smoothed over reads low, a brief
            exchange you set up and drove reads high.
          </SignalCard>
          <SignalCard
            index={2}
            name="Rigor"
            gloss="the quality of your reasoning where you engaged"
          >
            Where the exchange did call for reasoning, Rigor judges how sound it
            was. It reads better when you make an assumption explicit instead of
            leaning on it unstated, when you ask what backs a claim, when you
            take on the strongest version of the case against you, and when you
            let a position go once that case stands up. A quick factual question
            offers none of this to assess, so it is set aside rather than
            scored low.
          </SignalCard>
          <SignalCard
            index={3}
            name="Drift"
            gloss="the direction of your reasoning over time"
          >
            Drift is the long trend, tracked over months and compared only
            against your own earlier readings, never a cohort figure. The
            question it settles: is the reasoning you can do without assistance
            getting stronger, standing still, or slipping? It stays silent until
            there is enough baseline to judge against, and it discards any
            session the instrument coached, so it never grades its own effect.
          </SignalCard>
        </div>
      </Section>

      <Section title="An honest reading, including the unflattering parts">
        <CommitmentList items={STANDARD} />
      </Section>

      <Section title="Interface preview — mobile view" titleClassName="sr-only">
        <ScrollReveal>
          <InterfacePreview
            variant="mobile"
            caption="The same session on a phone. Load and Rigor stay in view, and any figure opens to the lines it was drawn from; a session the instrument could not read is shown as unscored, not filled in."
          />
        </ScrollReveal>
      </Section>

      <Section title="From a reading to a single prompt">
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          <p>
            Measurement is only half the point. Wherever the instrument finds a
            gap, it returns one prompt, pinned to the passage that showed the
            gap &mdash; a specific correction, not a page of general advice.
          </p>
          <p>
            If you revise something because the instrument pointed at it, that
            revision is marked as coached and kept out of the trend maths. Drift
            is meant to track your own movement, not the instrument&rsquo;s
            footprints in it.
          </p>
          <p>
            Nothing about this runs quietly. For any prompt, you can see the
            passage and the signal that set it off.
          </p>
        </div>
      </Section>

      <Section eyebrow="Arriving 2026" title="Tested before it ships">
        <ValidationMethods methods={METHODS} />
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-muted">
          Whatever the testing turns up, favourable or not, it gets published.
          Waitlist members see it before anyone else.
        </p>
      </Section>

      <Section eyebrow="Available now" title="Try the working prototype">
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          <p>
            Everything above is still being validated, on the timeline that
            section sets out. A rougher build of the same reading is already
            online, and you can run it yourself now.
          </p>
          <p>
            Give it one conversation you have had with ChatGPT, Claude, or
            Gemini. It scores your half of that exchange for Load and Rigor and
            shows the lines of your own writing that produced each figure. Most
            transcripts come back without a score, which is how it is meant to
            work.
          </p>
          <p>
            The default engine is a deterministic pass over a written rubric. It
            works from patterns in your phrasing and leans toward saying nothing,
            so it under-reads reasoning that a careful person would credit. A
            language-model judge does a closer read where the deployment is
            configured with a key for it. In either mode this is an illustration
            of the approach, not a reading to act on.
          </p>
        </div>
        <div className="mt-8">
          <LinkButton href="/instrument">Open the prototype</LinkButton>
        </div>
      </Section>
    </>
  );
}
