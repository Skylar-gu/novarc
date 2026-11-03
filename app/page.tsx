import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/blocks/Hero";
import { SignalCard } from "@/components/blocks/SignalCard";
import { PhaseCard } from "@/components/blocks/PhaseCard";
import { PrincipleGrid, PrincipleCard } from "@/components/blocks/PrincipleGrid";
import { StatCard } from "@/components/blocks/StatCard";
import { InterfacePreview } from "@/components/blocks/InterfacePreview";
import { ScrollReveal } from "@/components/blocks/ScrollReveal";
import { LinkButton } from "@/components/ui/Button";
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
        note="Launching 2026"
        primaryCta={{ label: waitlist.ctaLong, href: "#waitlist" }}
        secondaryCta={{ label: "See the instrument", href: "/product" }}
      />

      {/* 2 — Convenience vs. capability */}
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
        <SectionLink href="/about">The full argument</SectionLink>
      </Section>

      {/* 3 — The instrument, explained */}
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

      {/* 4 — Three signals */}
      <Section eyebrow="Signals" title="What it reads: Load, Rigor, Drift">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <SignalCard index={1} name="Load" gloss="the share of the thinking you carried">
            Who was doing the cognitive work — not how long the transcript ran.
          </SignalCard>
          <SignalCard
            index={2}
            name="Rigor"
            gloss="the quality of your reasoning where you engaged"
          >
            How well that reasoning held up, only where there was reasoning to judge.
          </SignalCard>
          <SignalCard
            index={3}
            name="Drift"
            gloss="the direction of your reasoning over time"
          >
            Movement against your own baseline, never a population curve.
          </SignalCard>
        </div>
        <SectionLink href="/product">Each signal, in full</SectionLink>
      </Section>

      {/* 5 — Where this goes */}
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

      {/* 6 — Four principles */}
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

      {/* 7 — Research stat cards + chart slots */}
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

      {/* 8 — Closing CTA */}
      <Section eyebrow="Try it" title="See how it works">
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-text-muted">
          <p>
            The validated version is still in testing, but a working prototype
            of the reading is already live. Give it one conversation you have
            had with ChatGPT, Claude, or Gemini and see what it finds.
          </p>
        </div>
        <div className="mt-8">
          <LinkButton href="/instrument">Try the prototype</LinkButton>
        </div>
      </Section>

    </>
  );
}
