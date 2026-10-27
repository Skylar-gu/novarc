# SITE_COPY — every word on the site, by page

A single mirror of the user-facing text on novarc.tech (this build), page by
page, so copy can be read and revised in one place.

**Source of truth today is still the code** — the strings live in
`app/**/page.tsx`, `app/**/*.tsx`, and `lib/site.ts`. This file is kept in
sync by hand. If you want to make *this* file the source and have edits flow
back to the site, that is a small refactor (lift copy into a `lib/copy.ts`
module the pages import) — say the word and it gets done.

Punctuation here is shown as it renders (`—`, `'`, `"`), not as the HTML
entities used in the JSX.

Last synced: 2026-09-04 (commit `8cd118c`).

---

## Global chrome

Appears on every page.

### Top ribbon

> NOVARC's first instrument is due in 2026. **Join the waitlist**

("Join the waitlist" links to `/#waitlist`. The bar is dismissible.)

### Header

- Wordmark: **NOVARC**
- Location line (next to the wordmark, desktop only): Zürich · Founded 2026
- Nav: Home · Product · Instrument · About · Research
- Button: **Get updates** (→ `/#waitlist`)
- Theme toggle labels: Light · Dark · System

### Footer

- Wordmark: **NOVARC**
- Identity line: An AI company with a single conviction: augmentation over replacement. Tools that leave the people using them more capable, not less.
- Location line: Zürich · Founded 2026
- Column heading: **Explore**
- Column links: Product · Instrument · About · Research · Waitlist
- Legal line: © 2026 NOVARC · Engineering intelligence

### Waitlist form (all states)

- Field label: Email address
- Placeholder: you@example.com
- Submitting: Sending…
- Success: You are on the list. We will write when there is something to show.
- Error: That did not go through. Try again in a moment.
- Invalid email: Enter an email address that looks complete.

---

## Home (`/`)

### 1 — Hero

- Eyebrow: NOVARC
- Headline: AI that builds the *person*, not just the answer.
- Sub: We make models, agents, and tools built to a single rule: each time you use one, you should be more capable afterward than you were before.
- Primary CTA: Join the waitlist (→ `#waitlist`)
- Secondary CTA: See the instrument (→ `/product`)

### 2 — The founding principle

Principle 01:

> A tool earns its place only if removing it leaves the person more able than
> they started. If it instead leaves them leaning on it to do what they once
> managed alone, it was the wrong tool.

Link: How we hold to this (→ `/about`)

### 3 — The first instrument

- Eyebrow: Arriving 2026
- Body: The first instrument is now in its validation program, and reaches people during 2026.
- Link: What it looks at (→ `/product`)

### 4 — Convenience vs. capability

- Eyebrow: The argument
- Title: Built for capability, not convenience.
- Body:
  > The usual design target for an AI product is convenience: fewer steps, and
  > a little less asked of the person with each release. Spread that across
  > millions of users and years of use, and it compounds. Reasoning gets passed
  > to the machine one task at a time, and the faculty behind it, out of use,
  > weakens.
  >
  > We build toward the opposite result. The question we hold every release to
  > is whether its user is more capable on their own once it is switched off —
  > not how much work it did for them. Nobody can act on that question without a
  > way to measure it, and there wasn't one, so we built it first.

### 5 — The instrument, explained

- Eyebrow: The instrument
- Title: One instrument, three readings
- Body: It runs inside ChatGPT, Claude, and Gemini. It does not grade the model's answer. It looks at how you worked while that answer came together, and turns a stretch of ordinary use into three measures.
- Interface preview caption: One week of use. Most sessions stay unscored; three held enough reasoning to read.
- Link: How the reading works (→ `/product`)

### 6 — Three signals

- Eyebrow: Signals
- Title: What it reads: Load, Rigor, Drift

**Load** — the share of the thinking you carried
> It comes down to who was doing the cognitive work: did you set up the
> question or inherit it, work the reasoning or receive it, stress-test the
> result or take it on trust, own the call or ratify one. Transcript length is
> not a factor — a long answer you lightly edited reads low, a short exchange
> you steered reads high.

**Rigor** — the quality of your reasoning where you engaged
> Where you did engage, how well did the reasoning hold up? It looks for an
> assumption you named rather than smuggled in, a claim you asked for support
> on, an objection you took on instead of deflecting, a view you let the
> evidence move. It applies only where there was reasoning to assess; a quick
> lookup is passed over.

**Drift** — the direction of your reasoning over time
> It waits until it has enough of a baseline to compare against, then tracks
> movement only relative to your own past readings — no population percentile
> enters into it. Any session the instrument coached is dropped from the
> calculation, so the trend cannot reflect its own nudging.

Link: Each signal, in full (→ `/product`)

### 7 — What comes after measurement

- Eyebrow: Roadmap
- Title: What comes after measurement

**Phase 1 — Instruments** (In validation)
> Nothing further along works without this step: a model or an agent built for
> capability needs a capability reading to be judged against. The instrument in
> validation opens the sequence rather than completing it.

**Phase 2 — Models** (Not built yet)
> Models trained and judged on a different test: after working with one, can
> the person handle the next case without it? Work here begins once the
> measurement can be trusted, and not before.

**Phase 3 — Agents** (A direction, not a product)
> Systems that take on the routine work, put the real choices back in front of
> the person with enough context to make them, and keep a record of what was
> decided. We are naming a direction here, not shipping a product today.

Link: The full roadmap (→ `/product`)

### 8 — Four principles

- Eyebrow: Principles
- Title: Four principles

1. **Augment, never replace** — Removing a system should cost its user nothing they walked in with. If it leaves them relying on it for what they used to manage alone, it failed the test.
2. **Judgment stays human** — An agent can shoulder the work. Deciding which problems deserve attention, and which results to believe, is never handed off.
3. **Make reasoning visible** — Trust in a result should come from being able to trace how it was reached. So we lay the path open to inspection, every step of it, not a summary at the end.
4. **Measure capability, not engagement** — What counts is read after the session ends: the reasoning a person can still do on their own, not the minutes they spent parked inside the tool.

### 9 — The trade shows up in the data

- Eyebrow: Evidence
- Title: The trade shows up in the data

Stat cards:
- Writers who drafted with a language model showed weaker coordination across the brain regions that work together during composition, and remembered less of what they had written. — *MIT Media Lab · Kosmyna et al. · 2025*
- Asked to quote a single line from an essay they had finished minutes earlier with model help, about five in six could not. — *MIT Media Lab · 2025*
- The essays came from 54 people wired for EEG and split across three conditions: unaided, search-assisted, and model-assisted. — *MIT Media Lab · 2025*
- The more a worker trusted the AI, the less critical thinking they reported bringing to the task; the more they trusted their own judgement, the more they brought. — *Microsoft × Carnegie Mellon · Lee et al. · 2025*
- The pattern comes from a survey of 319 knowledge workers describing how they actually use generative AI in their jobs. — *Microsoft × CMU · CHI 2025*
- Those workers walked through 936 tasks they had genuinely carried out with generative tools, not hypothetical ones. — *Microsoft × CMU · CHI 2025*

(Followed by the Recall-failure and Trust-vs-effort charts.)

Link: See the evidence (→ `/research`)

### 10 — Kept under one roof

- Eyebrow: Structure
- Title: Kept under one roof
- Lead: Everything NOVARC makes is made in the same place: one company, one name, a run of products across the years rather than a scatter of separate ventures.
- **A single company** — One legal entity, one bar for what ships. Anything worth doing is done inside the company, not spun out on its own.
- **A sequence of products** — The instrument being validated now is the first of them, not the last. Models and agents are meant to follow, each answering to the same test.
- **Gains that carry forward** — Findings, craft, and trust gather in one place, so each new product starts further along than a company beginning from zero would.

Link: More on the house (→ `/about`)

### 11 — Closing / waitlist

> The aim is plain to say and hard to keep: you should come away from the tools
> we build reasoning better than when you picked them up.

> The first instrument enters its validation program in 2026. The waitlist is
> told first, and we only write when there is something real to show.

(Inline waitlist form.)

---

## Product (`/product`)

Page metadata description: The first NOVARC instrument reads how you reason while working with AI — three signals, every score attached to the passages behind it. In testing now; it reaches people during 2026.

### Hero

- Eyebrow: First NOVARC instrument · 2026
- Headline: Your reasoning shifts when an AI is in the loop. Until now there was no way to read it — so we built the *instrument*.
- Sub: It works alongside ChatGPT, Claude, and Gemini as you use them normally, and measures your half of each exchange rather than the model's. Ordinary use becomes three readings. Testing is under way; it reaches people during 2026.
- Primary CTA: Join the waitlist (→ `/#waitlist`)
- Secondary CTA: Read the research (→ `/research`)

### What the instrument is

> The first NOVARC product sits in the assistants that already fill a working
> day and watches how the person on the human side of the conversation is
> thinking. Whether the model's answer was any good is not its concern. Its
> subject is you: the questions you brought, the parts of the problem you
> worked yourself, the point at which you decided the thing was settled.
>
> Its reference class is a blood panel or an EEG, not a coach and not a
> productivity dashboard. The number is not kept for its own sake. It reports
> something real about how you think, plainly, without softening it.

### Interface preview (desktop)

Caption: A week of sessions in the desktop view: three scored, the rest left alone. Load and Rigor read as values, Drift as a direction against your personal baseline, and every figure stays attached to the passage that produced it.

### The three signals

**Load** — the share of the thinking you carried
> Load estimates how much of the cognitive work was actually yours. Four
> moments carry the weight: settling what the problem is, doing the reasoning
> that moves it, checking whether that reasoning holds, and calling the answer
> good enough to stop. For each, the question is whether you did it or the
> model did. Word count plays no part — a long transcript you pasted in and
> smoothed over reads low, a brief exchange you set up and drove reads high.

**Rigor** — the quality of your reasoning where you engaged
> Where the exchange did call for reasoning, Rigor judges how sound it was. It
> reads better when you make an assumption explicit instead of leaning on it
> unstated, when you ask what backs a claim, when you take on the strongest
> version of the case against you, and when you let a position go once that
> case stands up. A quick factual question offers none of this to assess, so it
> is set aside rather than scored low.

**Drift** — the direction of your reasoning over time
> Drift is the long trend, tracked over months and compared only against your
> own earlier readings, never a cohort figure. The question it settles: is the
> reasoning you can do without assistance getting stronger, standing still, or
> slipping? It stays silent until there is enough baseline to judge against,
> and it discards any session the instrument coached, so it never grades its
> own effect.

### An honest reading, including the unflattering parts

- **Most sessions go unscored** — You cannot read reasoning off a one-line factual query, or off a session that ends before any thinking gets going. An instrument that returns a number for every exchange anyway is manufacturing them. When the signal isn't there, the honest output is nothing.
- **Every score opens to its evidence** — Tap a number and it expands to the exact passages from your own messages that produced it. Remove those passages and the number has nothing to stand on; it goes with them.
- **Abstain by default** — When the evidence is thin, the instrument says so directly rather than returning a low-confidence guess.
- **You against yourself, not a leaderboard** — No population percentile sits at the top of the screen. The comparison that counts is you now against you earlier.

### Interface preview (mobile)

Caption: The same session on a phone. Load and Rigor stay in view, and any figure opens to the lines it was drawn from; a session the instrument could not read is shown as unscored, not filled in.

### From a reading to a single prompt

> Measurement is only half the point. Wherever the instrument finds a gap, it
> returns one prompt, pinned to the passage that showed the gap — a specific
> correction, not a page of general advice.
>
> If you revise something because the instrument pointed at it, that revision
> is marked as coached and kept out of the trend maths. Drift is meant to track
> your own movement, not the instrument's footprints in it.
>
> Nothing about this runs quietly. For any prompt, you can see the passage and
> the signal that set it off.

### Tested before it ships

- Eyebrow: Arriving 2026

Validation methods:
- **Agreement with human raters** — Do its scores line up with those of trained people marking the same transcripts?
- **Adversarial testing** — Can writing that sounds like reasoning but carries none earn a high score?
- **Repeat stability** — Given the same transcript twice, does it return the same score both times?
- **Longitudinal calibration** — Over months, does Drift move with real change measured against a person's own baseline?

> Whatever the testing turns up, favourable or not, it gets published. Waitlist
> members see it before anyone else.

### Try the working prototype

- Eyebrow: Available now
- Title: Try the working prototype
> Everything above is still being validated, on the timeline that section sets
> out. A rougher build of the same reading is already online, and you can run
> it yourself now.
>
> Give it one conversation you have had with ChatGPT, Claude, or Gemini. It
> scores your half of that exchange for Load and Rigor and shows the lines of
> your own writing that produced each figure. Most transcripts come back
> without a score, which is how it is meant to work.
>
> The default engine is a deterministic pass over a written rubric. It works
> from patterns in your phrasing and leans toward saying nothing, so it
> under-reads reasoning that a careful person would credit. A language-model
> judge does a closer read where the deployment is configured with a key for
> it. In either mode this is an illustration of the approach, not a reading to
> act on.

Button: Open the prototype (→ `/instrument`)

### Join the waitlist

> Measurement comes first for a reason: every NOVARC build after it rests on a
> claim about human capability, and a claim like that should not be taken on
> faith when it can be instrumented instead.

(Inline waitlist form.)

---

## Instrument (`/instrument`)

Page metadata description: A working prototype of the NOVARC instrument: paste one AI conversation, and it reads how much of the thinking was yours and how well you reasoned, with every score attached to your own words.

### Header

- Eyebrow: Prototype
- Title: Read one session
> Paste a single conversation you had with an AI assistant. The instrument
> scores your half of it: Load, the share of the thinking you carried, and
> Rigor, the quality of your reasoning where you engaged. Every score opens to
> the passages from your own messages behind it, and most sessions come back
> unscored.
>
> This is a prototype, not the validated instrument. Its scores have not been
> checked against trained human raters, and it should be read as a
> demonstration of the method rather than a measurement to rely on.
>
> Your transcript is sent once to the scoring route and is not stored on a
> server. The scores it returns are kept only in this browser, under your
> control, and you can export or delete them at any time.

### Interaction copy

- Section (sr-only): Your transcript
- While scoring: Scoring this session. This is one request to the scoring route; the transcript is not stored.
- On error: "Your transcript is still in the field above. Adjust it if you need to, then score again." (preceded by the specific error message)
- Live-region announcements: "Scoring your session." · "Session scored." · "This session was not scored."
- Result heading: The reading
- Result status line: "Scored from your turns only." / "Not scored this session."
- Buttons: Score another session · Score another session
- Sections: Drift · Recorded sessions

### Interface preview miniature (shared block, also shown on Home and Product)

- Panel heading: Session review
- Counter: 3 of 11 scored this week / 3 of 11 scored this week
- Load meter gloss: the share of the thinking you carried
- Rigor meter gloss: the quality of your reasoning where you engaged
- Drift row: Drift — the direction of your reasoning over time — Holding, against your 90-day baseline
- Receipt caption: Receipt · supports Rigor
- Receipt quote: *"If the retry storm only shows up during partial network partitions, backoff is not the fix — the client is treating a timeout and a refusal as the same event."*
- Receipt note: Your turn 6 — assumption named, then checked against the failure pattern.
- Desktop frame label: novarc · instrument

---

## About (`/about`)

Page metadata description: The company behind the instrument: its founding argument, and the six outcomes every NOVARC product is held to.

### Hero

- Eyebrow: About NOVARC
- Headline: We build AI to *expand* what a person is capable of, not to do it for them.
- Sub: NOVARC builds AI that gives an affirmative to: without the system, is the person more capable than before, or less? A first instrument is being validated as of now; everything after it answers to the same measure.
- Primary CTA: Join the waitlist (→ `/#waitlist`)
- Secondary CTA: See the first instrument (→ `/product`)

### The argument — Judged by what the user can do afterward

> The design goal in most products is convenience — fewer steps for the user,
> more of the work moved onto the system. Sustained at scale over years, that
> pattern is what people mean by cognitive outsourcing.
>
> A capacity you stop exercising doesn't hold its level; it slides. NOVARC runs
> the exchange in reverse. Each build — model, agent, or tool — has to clear
> one bar: take it away, and does the person come out ahead or behind? What the
> system generated on its own has no bearing on the answer.

Pull line:
> Anything that sends its users away diminished is something we do not put
> out.

### The standard — Six outcomes we hold every product to

Intro: "Augmentation" means little until you say how you would know it happened. Here is how: six outcomes, each one a thing a NOVARC product can be checked for.

1. **Strengthen reasoning ability** — Sharper inference, fewer skipped steps, arguments that hold their shape under pressure.
2. **Increase learning speed** — Less elapsed time between meeting an idea and being able to use it.
3. **Improve memory formation** — More of what passes through is still there a week later, without a second study pass.
4. **Enhance structured thinking** — Large problems split into parts that fit back together.
5. **Enable deeper problem-solving** — Traction on questions that were previously out of reach.
6. **Increase the rate of original discovery** — More conclusions that were not already contained in the prompt.

### Zürich-based, not Zürich-bound.

> NOVARC works out of Zürich. That first instrument is moving through its
> validation program now, with launch set for 2026. Whoever is on the waitlist
> hears before any public announcement.

### The point is that you end up more capable, not less.

> The instrument that will test whether that holds is currently in validation.
> The waitlist gets the first word at launch.

(Waitlist form.)

---

## Research (`/research`)

Page metadata description: The evidence base for NOVARC's position: two anchor studies on AI and cognition, three results from cognitive science, and the standard we hold our own work to.

### Hero

- Eyebrow: Research
- Headline: Build a tool to spare people effort and it tends to take the *thinking* with it. Two independent research teams — not us — have now measured that effect.
- Sub: The result shows up across teams that share no method and no dataset. Hand more of your reasoning to the tool, and your own capacity for it thins out. What follows is the two studies the case rests on, the cognitive science that explains them, and the test we accept for our own work.
- Primary CTA: Join the waitlist (→ `/#waitlist`)
- Secondary CTA: See the instrument (→ `/product`)

### Opening

> One group wired essay-writers for EEG. Another asked several hundred knowledge
> workers how they actually use AI on the job. The projects had no connection
> to each other and reported the same thing: the reasoning you delegate is
> reasoning you slowly lose the ability to do.

### Anchor studies — Two studies, read from the source

**MIT Media Lab · 2025**
Title: Your Brain on ChatGPT: Accumulation of Cognitive Debt When Using an AI Assistant for Essay Writing
Authors: Kosmyna et al.
Finding: Across three essay-writing sessions recorded under EEG, the participants who drafted with a chatbot showed the weakest coupling between brain regions of any group, recalled the least of what they had just written, and reported the faintest sense that the work was their own. The effect grew the longer they leaned on the tool.
Pull quote: The time saved on the page is borrowed against the capability you keep.

**Microsoft × Carnegie Mellon · 2025**
Title: The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers
Authors: Lee et al. (CHI 2025)
Finding: In 936 accounts of real AI use at work, the people who expressed the most trust in the tool also reported putting the least effort into checking, questioning, and improving what it returned. Those who backed their own judgment reported the opposite. Confidence did not raise the quality of the thinking; it moved who was doing it.
Pull quote: Reliance on the tool climbs; the habit of auditing it slips away quietly.

### The measurements — What the studies measured

(Recall-failure chart and Trust-vs-effort chart.)

### The standard this implies

> We already demand it of a drug, a course of study, a training block: show
> that the people who go through it come out stronger, not weaker. Something
> that works directly on how a person reasons should face the same demand —
> and NOVARC's own products are not exempt from it.

### The mechanism — Three established results, and what they imply

**1. Wolfram Schultz · Cambridge · Brain Prize 2017**
Claim: Surprise is what the brain learns from: the wider the gap between a prediction and the outcome, the more gets revised.
> You only learn from a prediction you actually made. Ask a tool for the answer
> before forming your own expectation and there is nothing to be wrong about,
> nothing for the outcome to correct, and the exchange leaves you where it
> found you even if you read the result with care.

**2. Manu Kapur · ETH Zürich**
Claim: Let people flounder on a hard problem before teaching the method, and their eventual grasp of it runs deeper.
> Those first unsuccessful attempts expose the gaps in what you know and leave
> you ready to absorb the fix when it arrives. An assistant that produces the
> whole solution the moment you slow down takes that step out of the sequence.
> Kapur's term for the step is productive failure.

**3. Schraw · Dunlosky · Bjork**
Claim: People overrate their own reasoning by a consistent margin, and that margin responds to training.
> The distance between how well someone thinks they are reasoning and how well
> they are runs wide, and it tracks with poorer learning. Drills that shrink it
> — commit to an estimate, then check it against what happened — raise accuracy
> measurably. An assistant that agrees by default pushes the other way, lifting
> confidence while the skill under it stays put.

### The research program — One question across five areas

- **Measurement** — Instruments for a question the field mostly skips: after the AI, can the person do more on their own, or only get through it faster?
- **Cognitive augmentation** — Systems where using the tool doubles as practice, so the reasoning it draws on gets exercised rather than retired.
- **Human–AI interfaces** — Interaction patterns that send someone away more able, not more dependent on coming back.
- **Reasoning and model behavior** — Where a model's reasoning holds, where it gives way, and what has to be true before its output is worth acting on.
- **Agentic systems** — Agents that take on the legwork and return the judgment calls, with enough context attached to make them.

Closing line:
> All five report to the same question: can someone who uses it do more without
> it than they could before?

### Validation is under way. The first instrument follows in 2026.

> The people on the list see the numbers first — including the ones that go
> against us.

(Inline waitlist form.)

---

## 404 (`/not-found`)

- Eyebrow: 404
- Title: That page is not here.
- Body: The address may be out of date, or the page may never have existed. Everything published so far is reachable from the home page.
- Button: Return home (→ `/`)

---

## Notes on cross-page reuse

- The **three-signal glosses** ("the share of the thinking you carried", "the
  quality of your reasoning where you engaged", "the direction of your
  reasoning over time") appear verbatim on Home, Product, Instrument (preview),
  and the instrument readout. Change them in all four.
- The **Kosmyna** and **Lee et al.** study framing appears on Home (stat
  cards), Research (study cards), and `docs/RESEARCH.md`. `docs/RESEARCH.md` is
  the fact-checked master; keep the site copy consistent with it.
- The **four validation methods** appear on Product and in `docs/VALIDATION.md`.
- "Reaches people during 2026" / "in testing now" is the launch-timing line and
  recurs on every page — keep the phrasing aligned.
