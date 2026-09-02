import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/blocks/Hero";
import { PrincipleStatement } from "@/components/blocks/PrincipleStatement";
import { SignalCard } from "@/components/blocks/SignalCard";
import { PhaseCard } from "@/components/blocks/PhaseCard";
import { PrincipleGrid, PrincipleCard } from "@/components/blocks/PrincipleGrid";
import { StatCard } from "@/components/blocks/StatCard";
import { InterfacePreview } from "@/components/blocks/InterfacePreview";
import { HouseSection } from "@/components/blocks/HouseSection";
import { ScrollReveal } from "@/components/blocks/ScrollReveal";
import { WaitlistForm } from "@/components/blocks/WaitlistForm";
import { InstrumentTeaser } from "@/components/home/InstrumentTeaser";
import { RecallFailureChart } from "@/components/charts/RecallFailureChart";
import { TrustEffortChart } from "@/components/charts/TrustEffortChart";
import { site, ogImage, waitlist } from "@/lib/site";

const description =
  "NOVARC's case for AI that makes its users more capable, plus the first instrument and the research it stands on.";

export const metadata: Metadata = {
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description,
    url: site.url,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description,
    images: [ogImage],
  },
};

/** Trailing link shared by several sections. */
function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-8 inline-block font-sans text-sm font-medium text-accent underline underline-offset-4"
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1 — Hero */}
      <Hero
        eyebrow="NOVARC"
        headline={
          <>
            AI that builds the <em>person</em>, not just the answer.
          </>
        }
        sub="We make models, agents, and tools built to a single rule: each time you use one, you should be more capable afterward than you were before."
        primaryCta={{ label: waitlist.ctaLong, href: "#waitlist" }}
        secondaryCta={{ label: "See the instrument", href: "/product" }}
      />

      {/* 2 — Principle 01 teaser */}
      <Section title="The founding principle" titleClassName="sr-only">
        <PrincipleStatement index={1}>
          A tool earns its place only if removing it leaves the person more able
          than they started. If it instead leaves them leaning on it to do what
          they once managed alone, it was the wrong tool.
        </PrincipleStatement>
        <SectionLink href="/about">How we hold to this</SectionLink>
      </Section>

      {/* 3 — First instrument teaser */}
      <Section title="The first instrument" titleClassName="sr-only">
        <InstrumentTeaser
          eyebrow="Arriving 2026"
          cta={{ label: "What it looks at", href: "/product" }}
        >
          The first instrument is now in its validation program, and reaches
          people during 2026.
        </InstrumentTeaser>
      </Section>

      {/* 4 — Convenience vs. capability */}
      <Section eyebrow="The argument" title="Built for capability, not convenience.">
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          <p>
            The usual design target for an AI product is convenience: fewer
            steps, and a little less asked of the person with each release.
            Spread that across millions of users and years of use, and it
            compounds. Reasoning gets passed to the machine one task at a time,
            and the faculty behind it, out of use, weakens.
          </p>
          <p>
            We build toward the opposite result. The question we hold every
            release to is whether its user is more capable on their own once it
            is switched off — not how much work it did for them. Nobody can act
            on that question without a way to measure it, and there wasn&rsquo;t
            one, so we built it first.
          </p>
        </div>
      </Section>

      {/* 5 — The instrument, explained */}
      <Section eyebrow="The instrument" title="One instrument, three readings">
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          It runs inside ChatGPT, Claude, and Gemini. It does not grade the
          model&rsquo;s answer. It looks at how you worked while that answer came
          together, and turns a stretch of ordinary use into three measures.
        </p>
        <div className="mt-10 max-w-3xl">
          <InterfacePreview
            variant="desktop"
            caption="One week of use. Most sessions stay unscored; three held enough reasoning to read."
          />
        </div>
        <SectionLink href="/product">How the reading works</SectionLink>
      </Section>

      {/* 6 — Three signals */}
      <Section eyebrow="Signals" title="What it reads: Load, Rigor, Drift">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SignalCard
            index={1}
            name="Load"
            gloss="the share of the thinking you carried"
          >
            It comes down to who was doing the cognitive work: did you set up
            the question or inherit it, work the reasoning or receive it,
            stress-test the result or take it on trust, own the call or ratify
            one. Transcript length is not a factor &mdash; a long answer you
            lightly edited reads low, a short exchange you steered reads high.
          </SignalCard>
          <SignalCard
            index={2}
            name="Rigor"
            gloss="the quality of your reasoning where you engaged"
          >
            Where you did engage, how well did the reasoning hold up? It looks
            for an assumption you named rather than smuggled in, a claim you
            asked for support on, an objection you took on instead of
            deflecting, a view you let the evidence move. It applies only where
            there was reasoning to assess; a quick lookup is passed over.
          </SignalCard>
          <SignalCard
            index={3}
            name="Drift"
            gloss="the direction of your reasoning over time"
          >
            It waits until it has enough of a baseline to compare against, then
            tracks movement only relative to your own past readings &mdash; no
            population percentile enters into it. Any session the instrument
            coached is dropped from the calculation, so the trend cannot
            reflect its own nudging.
          </SignalCard>
        </div>
        <SectionLink href="/product">Each signal, in full</SectionLink>
      </Section>

      {/* 7 — Where this goes */}
      <Section eyebrow="Roadmap" title="What comes after measurement">
        <ScrollReveal className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PhaseCard index={1} title="Instruments" state="In validation">
            Nothing further along works without this step: a model or an agent
            built for capability needs a capability reading to be judged
            against. The instrument in validation opens the sequence rather
            than completing it.
          </PhaseCard>
          <PhaseCard index={2} title="Models" state="Not built yet">
            Models trained and judged on a different test: after working with
            one, can the person handle the next case without it? Work here
            begins once the measurement can be trusted, and not before.
          </PhaseCard>
          <PhaseCard
            index={3}
            title="Agents"
            state="A direction, not a product"
          >
            Systems that take on the routine work, put the real choices back in
            front of the person with enough context to make them, and keep a
            record of what was decided. We are naming a direction here, not
            shipping a product today.
          </PhaseCard>
        </ScrollReveal>
        <SectionLink href="/product">The full roadmap</SectionLink>
      </Section>

      {/* 8 — Four principles */}
      <Section eyebrow="Principles" title="Four principles">
        <ScrollReveal>
          <PrincipleGrid>
            <PrincipleCard index={1} title="Augment, never replace">
              Removing a system should cost its user nothing they walked in
              with. If it leaves them relying on it for what they used to manage
              alone, it failed the test.
            </PrincipleCard>
            <PrincipleCard index={2} title="Judgment stays human">
              An agent can shoulder the work. Deciding which problems deserve
              attention, and which results to believe, is never handed off.
            </PrincipleCard>
            <PrincipleCard index={3} title="Make reasoning visible">
              Trust in a result should come from being able to trace how it was
              reached. So we lay the path open to inspection, every step of it,
              not a summary at the end.
            </PrincipleCard>
            <PrincipleCard index={4} title="Measure capability, not engagement">
              What counts is read after the session ends: the reasoning a person
              can still do on their own, not the minutes they spent parked inside
              the tool.
            </PrincipleCard>
          </PrincipleGrid>
        </ScrollReveal>
      </Section>

      {/* 9 — Research stat cards + chart slots */}
      <Section eyebrow="Evidence" title="The trade shows up in the data">
        <ScrollReveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              stat="Writers who drafted with a language model showed weaker coordination across the brain regions that work together during composition, and remembered less of what they had written."
              source="MIT Media Lab · Kosmyna et al. · 2025"
            />
            <StatCard
              stat="Asked to quote a single line from an essay they had finished minutes earlier with model help, about five in six could not."
              source="MIT Media Lab · 2025"
            />
            <StatCard
              stat="The essays came from 54 people wired for EEG and split across three conditions: unaided, search-assisted, and model-assisted."
              source="MIT Media Lab · 2025"
            />
            <StatCard
              stat="The more a worker trusted the AI, the less critical thinking they reported bringing to the task; the more they trusted their own judgement, the more they brought."
              source="Microsoft × Carnegie Mellon · Lee et al. · 2025"
            />
            <StatCard
              stat="The pattern comes from a survey of 319 knowledge workers describing how they actually use generative AI in their jobs."
              source="Microsoft × CMU · CHI 2025"
            />
            <StatCard
              stat="Those workers walked through 936 tasks they had genuinely carried out with generative tools, not hypothetical ones."
              source="Microsoft × CMU · CHI 2025"
            />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <RecallFailureChart />
            <TrustEffortChart />
          </div>
        </ScrollReveal>
        <SectionLink href="/research">See the evidence</SectionLink>
      </Section>

      {/* 10 — The house */}
      <Section eyebrow="Structure" title="Kept under one roof">
        <ScrollReveal>
          <HouseSection
            lead="Everything NOVARC makes is made in the same place: one company, one name, a run of products across the years rather than a scatter of separate ventures."
            points={[
              {
                title: "A single company",
                body: "One legal entity, one bar for what ships. Anything worth doing is done inside the company, not spun out on its own.",
              },
              {
                title: "A sequence of products",
                body: "The instrument being validated now is the first of them, not the last. Models and agents are meant to follow, each answering to the same test.",
              },
              {
                title: "Gains that carry forward",
                body: "Findings, craft, and trust gather in one place, so each new product starts further along than a company beginning from zero would.",
              },
            ]}
          />
        </ScrollReveal>
        <SectionLink href="/about">More on the house</SectionLink>
      </Section>

      {/* 11 — Closing */}
      <Section title="Join the waitlist" titleClassName="sr-only">
        <p className="max-w-3xl font-serif text-3xl font-medium leading-[1.15] tracking-tight text-text sm:text-4xl">
          The aim is plain to say and hard to keep: you should come away from the
          tools we build reasoning better than when you picked them up.
        </p>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
          The first instrument enters its validation program in 2026. The
          waitlist is told first, and we only write when there is something real
          to show.
        </p>
        <div className="mt-9">
          <WaitlistForm id="waitlist" variant="inline" />
        </div>
      </Section>
    </>
  );
}
