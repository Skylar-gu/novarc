import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/blocks/Hero";
import { StudyCard } from "@/components/blocks/StudyCard";
import { FindingCard } from "@/components/blocks/FindingCard";
import { PaperEntry } from "@/components/blocks/PaperEntry";
import { RecallFailureChart } from "@/components/charts/RecallFailureChart";
import { TrustEffortChart } from "@/components/charts/TrustEffortChart";
import { externalLinks, site, ogImage } from "@/lib/site";
import { formatIndex } from "@/components/blocks/shared";

const description =
  "The evidence base for NOVARC's position: two anchor studies on AI and cognition, a wider literature on offloading, judging, and user modeling, and the standard we hold our own work to.";
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

interface LandscapePaper {
  /** Attribution line, e.g. "Gerlich · Societies · 2025". */
  authors: string;
  title: string;
  summary: string;
  /** Method or confidence badge, e.g. "Correlational · N=666". */
  tag: string;
  href: string;
}

interface LandscapeCluster {
  /** Anchor id the overview cards link down to. */
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  papers: LandscapePaper[];
  /** Short line closing out the cluster, after the paper list. */
  outro?: string;
}

const LANDSCAPE_CLUSTERS: LandscapeCluster[] = [
  {
    id: "offloading",
    eyebrow: "Landscape · Offloading",
    title: "The pattern replicates — with one sharp exception",
    intro:
      "The two anchor studies are not outliers. A wider pull of the literature finds the same inverse relationship at larger scale, under random assignment, and split into two kinds of offloading that matter very differently — plus one study that found the opposite result, and explains why.",
    papers: [
      {
        authors: "Gerlich · Societies · 2025",
        title: "AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking",
        summary:
          "A 666-person survey and interview study found the same inverse relationship as the two anchor studies, at larger scale and across a wider age range — widest among the youngest respondents. Explicitly correlational, same caveat as above.",
        tag: "Correlational · N=666",
        href: "https://doi.org/10.3390/soc15010006",
      },
      {
        authors: "Georgiou · 2025",
        title: "ChatGPT Produces More “Lazy” Thinkers: Evidence of Cognitive Engagement Decline",
        summary:
          "The one study here with random assignment: writers paired with ChatGPT scored significantly lower on a researcher-built Cognitive Engagement Scale than an unassisted control group.",
        tag: "Randomized trial",
        href: "https://arxiv.org/abs/2507.00181",
      },
      {
        authors: "Nasr, Tu, Werner, Bauer, Yen & Sujo-Montes · Education Sciences · 2025",
        title:
          "Exploring the Impact of Generative AI ChatGPT on Critical Thinking in Higher Education: Passive AI-Directed Use or Human–AI Supported Collaboration?",
        summary:
          "The sharp exception. Students who used ChatGPT collaboratively, with guidance, worked through every stage of a standard critical-thinking model; students who let it direct the exchange didn’t. The variable that decided the outcome was how the tool was used, not whether it was used at all.",
        tag: "Counter-finding",
        href: "https://doi.org/10.3390/educsci15091198",
      },
      {
        authors: "Frontiers in Psychology · 2026",
        title: "A three-wave study distinguishing dependent from autonomous cognitive offloading",
        summary:
          "Splits offloading into two kinds: handing core thinking to the model, which tracked with lower motivation and a measurable transfer of cognitive control to the AI, versus using it as a scaffold while keeping control, which tracked with higher motivation and no such transfer. The closest published analogue to what NOVARC’s Load signal is built to read.",
        tag: "Three-wave survey · N=589",
        href: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1878629/full",
      },
    ],
    outro:
      "No randomized, multi-month trial with an objective, non-self-report outcome exists on either side of this debate yet — a gap that applies equally to every study above.",
  },
  {
    id: "judging",
    eyebrow: "Landscape · Judging",
    title: "What it takes to score reasoning instead of guessing at it",
    intro:
      "Grading a human’s reasoning from a chat transcript needs two things nobody has fully combined yet: a category scheme for what good reasoning looks like, and a way to stop an LLM judge from scoring confidently on a claim that was never actually grounded in the source.",
    papers: [
      {
        authors: "Zheng et al. · NeurIPS 2023",
        title: "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena",
        summary:
          "Established that a strong LLM judge agrees with human preference about as often as two humans agree with each other — and named the four biases nearly all later work tries to correct: position, verbosity, self-preference, and limited reasoning.",
        tag: "Benchmark",
        href: "https://arxiv.org/abs/2306.05685",
      },
      {
        authors: "Wang et al. · FairEval · 2023",
        title: "Large Language Models Are Not Fair Evaluators",
        summary:
          "Measured how large that first bias really is: simply swapping the order of two answers let a weaker model “beat” ChatGPT in 66 of 80 head-to-head comparisons, with nothing else changed.",
        tag: "Bias audit",
        href: "https://arxiv.org/abs/2305.17926",
      },
      {
        authors: "Liu et al. · G-Eval · 2023",
        title: "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment",
        summary:
          "Having the judge reason step-by-step before it scores, rather than scoring first and explaining after, measurably raised its agreement with human raters.",
        tag: "Method",
        href: "https://arxiv.org/abs/2303.16634",
      },
      {
        authors: "Verga et al. · PoLL · 2024",
        title: "Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models",
        summary:
          "A panel of smaller, differently-built judges agreed with human raters better than one large same-family judge did — at roughly seven to eight times lower cost to run.",
        tag: "Method",
        href: "https://arxiv.org/abs/2404.18796",
      },
      {
        authors: "Min et al. · FActScore · 2023",
        title: "FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation",
        summary:
          "The grounding pattern NOVARC’s own receipt mechanism extends: break a claim into atomic facts and verify each one independently against the source, rather than scoring the claim as one whole.",
        tag: "Method",
        href: "https://arxiv.org/abs/2305.14251",
      },
      {
        authors: "Cui & Zhao · Journal of Intelligence · 2024",
        title: "Assessing Students’ Critical Thinking in Dialogue",
        summary:
          "A validated way to grade critical thinking directly inside dialogue — analysis, comparison, evaluation, inference, synthesis — built for classroom exchanges, not AI chat, but the nearest existing category scheme to what a transcript-level rubric needs.",
        tag: "Coding scheme",
        href: "https://doi.org/10.3390/jintelligence12110106",
      },
      {
        authors: "Peczuh, Ashok Kumar, Baker et al. · EDM 2026",
        title: "Toward LLM-Supported Automated Assessment of Critical Thinking Subskills",
        summary:
          "The closest existing attempt at NOVARC’s exact problem: a six-subskill critical-thinking rubric scored by an LLM, strongest on frequent, well-separated categories and weaker on subtle or rare ones.",
        tag: "Benchmark",
        href: "https://arxiv.org/abs/2510.12915",
      },
    ],
    outro:
      "No paper found applies verbatim-quote grounding to gate a judge’s score, as opposed to a RAG system’s factual answer — and none evaluates an LLM judge on multi-turn AI-chat transcripts for reasoning quality specifically. Both are open.",
  },
  {
    id: "user-modeling",
    eyebrow: "Landscape · User modeling",
    title: "What a model can read off the person on the other side",
    intro:
      "A separate line of work asks what a chatbot already knows about its user, and whether that knowledge can be read out, shown back, or steered — all without the user ever stating it.",
    papers: [
      {
        authors: "Chen, Wattenberg, Viégas et al. · Harvard / Google Research · 2024",
        title: "Designing a Dashboard for Transparency and Control of Conversational AI",
        summary:
          "TalkTuner: a probe trained on a model’s internal activations reads age, gender, education, and socioeconomic status back out at up to 98% accuracy, far above just asking the model. Users wanted the readout, but five of nineteen found it unsettling once they saw it — and the probe itself was less accurate for women than for men.",
        tag: "User study · N=19",
        href: "https://arxiv.org/abs/2406.07882",
      },
      {
        authors: "Zou et al. · 2023",
        title: "Representation Engineering: A Top-Down Approach to AI Transparency",
        summary:
          "The broader program TalkTuner sits inside: reading and steering a model’s behavior through directions in its internal activation space, rather than through what it says.",
        tag: "Method",
        href: "https://arxiv.org/abs/2310.01405",
      },
      {
        authors: "Perez et al. · 2022",
        title: "Discovering Language Model Behaviors with Model-Written Evaluations",
        summary:
          "Found that larger, more heavily RLHF-trained models increasingly echo a user’s own stated opinion back to them — the sycophancy result that makes an agreeable assistant a risk to measured reasoning, not just a comfort.",
        tag: "Finding",
        href: "https://arxiv.org/abs/2212.09251",
      },
      {
        authors: "Anthropic · 2025",
        title: "Persona vectors",
        summary:
          "Extracts directions in activation space for traits like sycophancy or a tendency to fabricate, to monitor and correct drift in those traits during training — methodologically adjacent to TalkTuner, but aimed at the model’s own behavior rather than its model of the user.",
        tag: "Method",
        href: "https://www.anthropic.com/news/persona-vectors",
      },
    ],
    outro:
      "No paper found connects this thread — reading a model’s model of its user — to scoring that user’s reasoning quality. The two literatures are developing side by side with no bridge between them yet.",
  },
];

export default function ResearchPage() {
  return (
    <>
      <Hero
        eyebrow="Research"
        headline={
          <>
            Two independent research teams found that a tool built to spare
            people effort can take the <em>thinking</em> with it. Ours is
            built to reverse that.
          </>
        }
        sub="Both found reliance on AI tools inversely correlated against the person's own effort: less of their own thinking and less time spent checking results. We delve into the studies behind that finding below."
        primaryCta={{ label: "Join the waitlist", href: "/#waitlist" }}
        secondaryCta={{ label: "See the instrument", href: "/product" }}
      />

      <Section divider={false} className="-mt-20 sm:-mt-28">
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          One group had people write essays while hooked up to EEG. Another
          asked several hundred knowledge workers how they actually use AI on
          the job. Neither study
          ran long enough to show a skill eroding over time — but both found
          the same pattern in the moment: the more someone leaned on the tool,
          the less of their own thinking showed up in the work, and the less
          effort went into checking it.
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

      <Section
        index={3}
        eyebrow="The wider landscape"
        title="Beyond the two anchor studies"
      >
        <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
          The anchor studies above are the two most load-bearing results, not
          the whole literature. Pulling wider turns up three more clusters: a
          deeper read on offloading itself, the methodology for scoring
          reasoning from text at all, and a separate thread on what a model
          already knows about the person typing into it.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {LANDSCAPE_CLUSTERS.map((cluster, i) => (
            <Link
              key={cluster.id}
              href={`#${cluster.id}`}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-6 transition-colors hover:border-accent"
            >
              <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
                {formatIndex(i + 1)}
              </span>
              <h3 className="font-serif text-xl font-medium text-text group-hover:text-accent">
                {cluster.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {cluster.intro}
              </p>
              <span className="mt-auto font-sans text-xs font-medium uppercase tracking-[0.14em] text-accent">
                {cluster.papers.length} papers
                <span aria-hidden="true"> ↓</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {LANDSCAPE_CLUSTERS.map((cluster, i) => (
        <Section
          key={cluster.id}
          id={cluster.id}
          index={i + 4}
          eyebrow={cluster.eyebrow}
          title={cluster.title}
        >
          <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
            {cluster.intro}
          </p>
          <div className="mt-10 max-w-3xl">
            {cluster.papers.map((paper) => (
              <PaperEntry key={paper.href} {...paper} />
            ))}
          </div>
          {cluster.outro && (
            <p className="mt-2 max-w-2xl border-t border-border pt-6 text-sm leading-relaxed text-text-muted">
              {cluster.outro}
            </p>
          )}
        </Section>
      ))}

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
        index={7}
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
        index={8}
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
    </>
  );
}
