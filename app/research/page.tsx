import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/blocks/Hero";
import { StudyCard } from "@/components/blocks/StudyCard";
import { FindingCard } from "@/components/blocks/FindingCard";
import { WaitlistForm } from "@/components/blocks/WaitlistForm";
import { RecallFailureChart } from "@/components/charts/RecallFailureChart";
import { TrustEffortChart } from "@/components/charts/TrustEffortChart";
import { externalLinks, site, ogImage } from "@/lib/site";
import { formatIndex } from "@/components/blocks/shared";

const description =
  "The evidence base for NOVARC's position: two anchor studies on AI and cognition, three results from cognitive science, and the standard we hold our own work to.";
const ogTitle = `Research · ${site.name}`;

export const metadata: Metadata = {
  title: "Research",
  description,
  alternates: { canonical: "/research" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: ogTitle,
    description,
    url: `${site.url}/research`,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
};

const RESEARCH_AREAS: { term: string; gloss: string }[] = [
  {
    term: "Measurement",
    gloss:
      "Instruments for a question the field mostly skips: after the AI, can the person do more on their own, or only get through it faster?",
  },
  {
    term: "Cognitive augmentation",
    gloss:
      "Systems where using the tool doubles as practice, so the reasoning it draws on gets exercised rather than retired.",
  },
  {
    term: "Human–AI interfaces",
    gloss:
      "Interaction patterns that send someone away more able, not more dependent on coming back.",
  },
  {
    term: "Reasoning and model behavior",
    gloss:
      "Where a model's reasoning holds, where it gives way, and what has to be true before its output is worth acting on.",
  },
  {
    term: "Agentic systems",
    gloss:
      "Agents that take on the legwork and return the judgment calls, with enough context attached to make them.",
  },
];

export default function ResearchPage() {
  return (
    <>
      <Hero
        eyebrow="Research"
        headline={
          <>
            Build a tool to spare people effort and it tends to take the{" "}
            <em>thinking</em> with it. That effect has now been measured.
          </>
        }
        sub="The result shows up across teams that share no method and no dataset. Hand more of your reasoning to the tool, and your own capacity for it thins out. What follows is the two studies the case rests on, the cognitive science that explains them, and the test we accept for our own work."
        primaryCta={{ label: "Join the waitlist", href: "/#waitlist" }}
        secondaryCta={{ label: "See the instrument", href: "/product" }}
      />

      <Section divider={false}>
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          One group wired essay-writers for EEG. Another asked several hundred
          knowledge workers how they actually use AI on the job. The projects
          had no connection to each other and reported the same thing: the
          reasoning you delegate is reasoning you slowly lose the ability to
          do.
        </p>
      </Section>

      <Section
        index={1}
        eyebrow="Anchor studies"
        title="Two studies, read from the source"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <StudyCard
            org="MIT Media Lab"
            year="2025"
            title="Your Brain on ChatGPT: Accumulation of Cognitive Debt When Using an AI Assistant for Essay Writing"
            authors="Kosmyna et al."
            finding="Across three essay-writing sessions recorded under EEG, the participants who drafted with a chatbot showed the weakest coupling between brain regions of any group, recalled the least of what they had just written, and reported the faintest sense that the work was their own. The effect grew the longer they leaned on the tool."
            pullQuote="The time saved on the page is borrowed against the capability you keep."
            href={externalLinks.mitStudy}
          />
          <StudyCard
            org="Microsoft × Carnegie Mellon"
            year="2025"
            title="The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers"
            authors="Lee et al. (CHI 2025)"
            finding="In 936 accounts of real AI use at work, the people who expressed the most trust in the tool also reported putting the least effort into checking, questioning, and improving what it returned. Those who backed their own judgment reported the opposite. Confidence did not raise the quality of the thinking; it moved who was doing it."
            pullQuote="Reliance on the tool climbs; the habit of auditing it slips away quietly."
            href={externalLinks.microsoftStudy}
          />
        </div>
      </Section>

      <Section
        index={2}
        eyebrow="The measurements"
        title="What the studies measured"
      >
        <div className="flex flex-col gap-8">
          <RecallFailureChart />
          <TrustEffortChart />
        </div>
      </Section>

      <Section title="The standard this implies" titleClassName="sr-only">
        <p className="max-w-3xl font-serif text-2xl font-medium leading-snug text-text sm:text-3xl">
          We already demand it of a drug, a course of study, a training block:
          show that the people who go through it come out stronger, not weaker.
          Something that works directly on how a person reasons should face the
          same demand &mdash; and NOVARC&rsquo;s own products are not exempt
          from it.
        </p>
      </Section>

      <Section
        index={3}
        eyebrow="The mechanism"
        title="Three established results, and what they imply"
      >
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-3">
          <FindingCard
            index={1}
            claim="Surprise is what the brain learns from: the wider the gap between a prediction and the outcome, the more gets revised."
            researcher="Wolfram Schultz · Cambridge · Brain Prize 2017"
          >
            You only learn from a prediction you actually made. Ask a tool for
            the answer before forming your own expectation and there is nothing
            to be wrong about, nothing for the outcome to correct, and the
            exchange leaves you where it found you even if you read the result
            with care.
          </FindingCard>
          <FindingCard
            index={2}
            claim="Let people flounder on a hard problem before teaching the method, and their eventual grasp of it runs deeper."
            researcher="Manu Kapur · ETH Zürich"
          >
            Those first unsuccessful attempts expose the gaps in what you know
            and leave you ready to absorb the fix when it arrives. An assistant
            that produces the whole solution the moment you slow down takes
            that step out of the sequence. Kapur&rsquo;s term for the step is
            productive failure.
          </FindingCard>
          <FindingCard
            index={3}
            claim="People overrate their own reasoning by a consistent margin, and that margin responds to training."
            researcher="Schraw · Dunlosky · Bjork"
          >
            The distance between how well someone thinks they are reasoning and
            how well they are runs wide, and it tracks with poorer learning.
            Drills that shrink it — commit to an estimate, then check it
            against what happened — raise accuracy measurably. An assistant
            that agrees by default pushes the other way, lifting confidence
            while the skill under it stays put.
          </FindingCard>
        </div>
      </Section>

      <Section
        index={4}
        eyebrow="The research program"
        title="One question across five areas"
      >
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {RESEARCH_AREAS.map((area, i) => (
            <div
              key={area.term}
              className="flex flex-col gap-2 border-t border-border pt-4"
            >
              <dt className="flex items-baseline gap-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                <span className="text-text">{formatIndex(i + 1)}</span>
                <span>{area.term}</span>
              </dt>
              <dd className="leading-relaxed text-text-muted">{area.gloss}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-text">
          All five report to the same question: can someone who uses it do more
          without it than they could before?
        </p>
      </Section>

      <Section title="Validation is under way. The first instrument follows in 2026.">
        <p className="mb-8 max-w-xl leading-relaxed text-text-muted">
          The people on the list see the numbers first — including the ones
          that go against us.
        </p>
        <WaitlistForm variant="inline" />
      </Section>
    </>
  );
}
