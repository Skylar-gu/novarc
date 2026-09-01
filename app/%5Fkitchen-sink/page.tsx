import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/blocks/Hero";
import { PrincipleStatement } from "@/components/blocks/PrincipleStatement";
import { SignalCard } from "@/components/blocks/SignalCard";
import { PhaseCard } from "@/components/blocks/PhaseCard";
import { PrincipleGrid, PrincipleCard } from "@/components/blocks/PrincipleGrid";
import { StatCard } from "@/components/blocks/StatCard";
import { StudyCard } from "@/components/blocks/StudyCard";
import { FindingCard } from "@/components/blocks/FindingCard";
import { InterfacePreview } from "@/components/blocks/InterfacePreview";
import { FAQ } from "@/components/blocks/FAQ";
import { WaitlistForm } from "@/components/blocks/WaitlistForm";
import { HouseSection } from "@/components/blocks/HouseSection";
import { ScrollReveal } from "@/components/blocks/ScrollReveal";
import { externalLinks } from "@/lib/site";

/**
 * Dev-only preview of every shared block. Not linked from navigation and
 * excluded from indexing here; WP-7 removes it from any crawlable surface.
 *
 * Heading order dogfoods the real contract: the single `Hero` is the only
 * `<h1>`; each `Section` carries an `<h2>` via its `title` prop; card blocks
 * emit `<h3>`.
 */
export const metadata: Metadata = {
  title: "Kitchen sink",
  robots: { index: false, follow: false },
};

/** One labelled preview block. Uses the shared `Section` so the `<h2>` and
 *  spacing come from the same primitive the real pages use. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section title={title}>
      <div className="flex flex-col gap-12">{children}</div>
    </Section>
  );
}

export default function KitchenSinkPage() {
  return (
    <div className="pb-24">
      <Container className="py-12">
        <p className="font-serif text-3xl font-medium text-text">
          Component kitchen sink
        </p>
        <p className="mt-3 max-w-prose leading-relaxed text-text-muted">
          Every shared block from WP-2, with representative sample copy. Switch
          themes from the header control to check light and dark. The block below
          is the only <code>&lt;h1&gt;</code> on the page; every group heading is
          an <code>&lt;h2&gt;</code>, and cards render <code>&lt;h3&gt;</code>.
        </p>
      </Container>

      {/* Hero owns the page h1, so it comes before any Section h2. */}
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-[72rem] px-6 pt-16 font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted sm:px-8">
          Hero
        </p>
        <Hero
          eyebrow="NOVARC"
          headline={
            <>
              AI that builds the <em>person</em>, not just the answer.
            </>
          }
          sub="It works inside the assistants you already use and returns three measures of how you are reasoning over time. The first validation results are due in 2026."
          primaryCta={{ label: "Join the waitlist", href: "#kitchen-waitlist" }}
          secondaryCta={{ label: "Read the research", href: "/research" }}
        />
      </div>

      <Group title="PrincipleStatement">
        <PrincipleStatement index={1}>
          Take the tool away. If the person left behind can do less than before,
          it was the wrong tool.
        </PrincipleStatement>
      </Group>

      <Group title="SignalCard">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SignalCard
            index={1}
            name="Load"
            gloss="the share of the thinking you carried"
          >
            Four parts go into the score: who set up the problem, who worked the
            logic, who checked it, and who made the call. A long paste with light
            edits reads low. A short exchange where you did the hard part reads
            high.
          </SignalCard>
          <SignalCard
            index={2}
            name="Rigor"
            gloss="the quality of your reasoning where you engaged"
          >
            It looks for the marks of real thinking: stating what you assume,
            asking what the evidence is, sitting with the best objection, and
            moving your position when that objection holds. A quick fact check
            has none of that and stays unscored.
          </SignalCard>
          <SignalCard
            index={3}
            name="Drift"
            gloss="the direction of your reasoning over time"
          >
            Once there is enough history to compare against, it reports whether
            your unaided reasoning is climbing, level, or slipping. The
            comparison is you against your earlier self, never against an
            average.
          </SignalCard>
        </div>
      </Group>

      <Group title="PhaseCard">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PhaseCard index={1} title="Instruments" state="In validation">
            You cannot correct a trend you cannot see. The measurement is built
            first so every later decision has something real to answer to. What
            is being validated now is where the line begins.
          </PhaseCard>
          <PhaseCard index={2} title="Models" state="Not built yet">
            Models trained and tested against a different question: after
            someone works with this, can they do the next one alone? Nothing
            here begins until the measurement is trusted.
          </PhaseCard>
          <PhaseCard index={3} title="Agents" state="A direction, not a product">
            Systems that take the mechanical work off your plate, return the real
            choices with enough context to make them, and record what you
            decided. Stated as intent, not inventory.
          </PhaseCard>
        </div>
      </Group>

      <Group title="PrincipleGrid + PrincipleCard">
        <PrincipleGrid>
          <PrincipleCard index={1} title="Augment, never replace">
            Removing the system should cost the user nothing they did not have
            before they picked it up.
          </PrincipleCard>
          <PrincipleCard index={2} title="Judgment stays human">
            Hand over the labour. Choosing which questions matter, and which
            answers to accept, stays with the person.
          </PrincipleCard>
          <PrincipleCard index={3} title="Make reasoning visible">
            Trust follows from being able to check the work. Show every step, not
            only the verdict at the end.
          </PrincipleCard>
          <PrincipleCard index={4} title="Measure capability, not engagement">
            The figure that counts is whatever someone manages unaided once the
            product is closed, not how long they stayed inside it.
          </PrincipleCard>
        </PrincipleGrid>
      </Group>

      <Group title="StatCard">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            stat="Writers who leaned on a language model showed weaker brain connectivity and recalled less of the text they had just produced."
            source="MIT Media Lab · 2025"
          />
          <StatCard
            stat="83% of participants could not quote a line from an essay they had finished minutes earlier with model help."
            source="MIT Media Lab · 2025"
          />
          <StatCard
            stat="More trust in the AI went with less critical thinking; more trust in your own judgement went with more of it."
            source="Microsoft × Carnegie Mellon · 2025"
          />
          <StatCard
            stat="The survey covered 319 knowledge workers and 936 real tasks they had carried out with generative AI."
            source="Microsoft × CMU · CHI 2025"
          />
        </div>
      </Group>

      <Group title="StudyCard">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StudyCard
            org="MIT Media Lab"
            year="2025"
            title="Your Brain on ChatGPT"
            authors="Kosmyna et al."
            finding="People who used a language model to help them write showed lower neural connectivity, remembered their own text less well, and felt less ownership of what they had made."
            pullQuote="Cognitive debt: efficiency now, paid back later in lost capability."
            href={externalLinks.mitStudy}
          />
          <StudyCard
            org="Microsoft × Carnegie Mellon"
            year="2025"
            title="Generative AI and Critical Thinking"
            authors="Lee et al., CHI 2025"
            finding="As reliance on the tool rose, critical thinking fell; as people's confidence in their own reasoning rose, it went the other way."
            pullQuote="The more the system is relied on, the less the faculties it should support get used."
            href={externalLinks.microsoftStudy}
          />
        </div>
      </Group>

      <Group title="FindingCard">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <FindingCard
            index={1}
            claim="The brain learns from prediction error."
            researcher="Wolfram Schultz · Cambridge · Brain Prize, 2017"
          >
            What drives an update is the mismatch between what you expected and
            what happened. Deliver the answer instantly and there is no mismatch
            to learn from.
          </FindingCard>
          <FindingCard
            index={2}
            claim="Productive failure beats being handed the solution."
            researcher="Manu Kapur · ETH Zürich"
          >
            People who work at a problem before seeing a worked answer end up
            understanding it more deeply. A tool that supplies the finished
            answer skips the part that builds the understanding.
          </FindingCard>
          <FindingCard
            index={3}
            claim="Calibration can be trained, and most people have not been."
            researcher="Schraw · Dunlosky · Bjork"
          >
            Most people rate their own grasp of a topic too high, and that gap
            tracks with worse learning. A tool that agrees with everything you
            say widens it.
          </FindingCard>
        </div>
      </Group>

      <Group title="InterfacePreview">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">variant=&quot;desktop&quot;</p>
            <InterfacePreview
              variant="desktop"
              caption="A week of sessions, three of them with enough reasoning to score."
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">variant=&quot;mobile&quot;</p>
            <InterfacePreview
              variant="mobile"
              caption="Every score opens to the exact lines that produced it."
            />
          </div>
        </div>
      </Group>

      <Group title="FAQ">
        <FAQ
          items={[
            {
              q: "Who started NOVARC, and what prompted it?",
              a: "Pavel Abdulin founded it in 2026, in Zürich. The prompt was a plain observation: mainstream AI is heading toward doing more of people's thinking for them, and the long-run effect of that on human ability rarely gets serious attention. The company is the attempt to give it that attention.",
            },
            {
              q: "What makes NOVARC's approach different?",
              a: "The usual aim is a more capable system. Here the aim is a more capable user. What counts is what someone can manage once the tool is closed, not what it produced while it was open.",
            },
            {
              q: "When will the first product be available?",
              a: "It is being validated now and is set to launch in 2026, unnamed until then. Details on access and pricing come before launch, and people on the waitlist hear first.",
            },
            {
              q: "Is this a research group or a company?",
              a: "Both at once. Revenue from the products pays for the research, and the research decides what gets built.",
            },
          ]}
        />
      </Group>

      <Group title="WaitlistForm">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              variant=&quot;block&quot; (default), id=&quot;kitchen-waitlist&quot;
            </p>
            <WaitlistForm id="kitchen-waitlist" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">variant=&quot;inline&quot;</p>
            <WaitlistForm variant="inline" />
          </div>
        </div>
      </Group>

      <Group title="HouseSection">
        <HouseSection
          lead="One company holding many builds over the years — on purpose, not a spread of separate startups."
          points={[
            {
              title: "One entity",
              body: "Anything worth building gets built here, under a single name and a single bar for what ships.",
            },
            {
              title: "Many builds",
              body: "The one being validated now is the first of them. Models and agents are meant to follow, judged the same way.",
            },
            {
              title: "Compounding",
              body: "Evidence, skill, and credibility gather in one place, so each build starts further along than a fresh company would.",
            },
          ]}
        />
      </Group>

      <Group title="ScrollReveal">
        <ScrollReveal className="flex flex-col gap-2">
          <p className="font-serif text-2xl font-medium text-text">
            This block eases in as it scrolls into view.
          </p>
          <p className="max-w-prose leading-relaxed text-text-muted">
            With reduced motion switched on it simply appears — full opacity, no
            shift, no transition.
          </p>
        </ScrollReveal>
      </Group>
    </div>
  );
}
