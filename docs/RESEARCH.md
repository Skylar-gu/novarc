# Research basis

The claims NOVARC's site and product rest on, with sources and the limits of
each. This file is the reference the `/research` page is written against; if a
line on the page cannot be traced to something here, one of the two is wrong.

The standard we hold to: cite primary sources, state what a study actually
measured rather than its headline, and name the gap between what the evidence
shows and what we are building. Results that come in against us get published
the same way (PRODUCT §5, VISION §7).

---

## 1. Anchor studies — AI use and cognition

### Kosmyna et al. (2025), "Your Brain on ChatGPT"

*Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing
Task.* MIT Media Lab. Preprint: arXiv:2506.08872.

- **Design.** 54 adults, three groups — large-language-model, search-engine,
  and unaided ("brain-only") — each writing essays across three sessions under
  the same condition, with a fourth session in which a subset switched
  condition. EEG recorded throughout; essays scored by human teachers and by an
  automated judge; participants interviewed on recall and sense of ownership.
- **What it found.** The LLM group showed the weakest and least distributed
  EEG connectivity of the three, quoted and recalled the least from essays they
  had just written, and reported the lowest sense that the work was theirs. The
  group that moved from LLM to unaided in the fourth session under-performed
  the group that went the other way, which the authors read as a carryover
  cost — their term is *cognitive debt*.
- **What it does not show.** The sample is modest and the task is a single
  genre of writing. EEG connectivity is a coarse proxy for "engagement," not a
  direct measure of reasoning or of durable skill. "Cognitive debt" is the
  authors' framing, not an established construct, and the preprint had not
  completed peer review when it circulated. It is evidence of a short-term
  effect on one task, not proof of lasting capability loss.

Used on the site for: the claim that delegated reasoning shows measurable
disengagement, and that the effect compounds with repeated reliance.

### Lee et al. (2025), "The Impact of Generative AI on Critical Thinking"

*Self-Reported Reductions in Cognitive Effort and Confidence Effects From a
Survey of Knowledge Workers.* Microsoft Research and Carnegie Mellon
University. CHI 2025. DOI: 10.1145/3706598.3713778.

- **Design.** Survey of 319 knowledge workers who supplied 936 first-hand
  accounts of real generative-AI use at work, each annotated by the participant
  for whether and how they applied critical thinking and how much effort it
  took.
- **What it found.** Higher confidence in the AI was associated with less
  reported critical thinking on the task; higher confidence in one's own
  ability was associated with more, and with more perceived effort.
  Participants described their critical-thinking effort shifting from producing
  work toward verifying and integrating what the tool returned.
- **What it does not show.** Everything is self-reported and measured at a
  single point in time. The study establishes an association, not that AI use
  causes a decline, and it does not track anyone over months. "Critical
  thinking" is operationalised through participants' own ratings against a
  taxonomy, not an independent test.

Used on the site for: the claim that trust in the tool and the habit of
auditing it move in opposite directions.

---

## 2. Mechanism — established results from cognitive science

These are older, well-replicated findings used to explain *why* the anchor
studies come out as they do. They are about human learning and judgment in
general; applying them to AI-assisted work is our extrapolation, not theirs.

### Reward prediction error — learning follows surprise

Schultz, Dayan & Montague (1997), "A neural substrate of prediction and
reward," *Science* 275, 1593–1599; Schultz (2016) for the review.

Dopaminergic learning signals track the gap between predicted and actual
outcome: no gap, little update. The applied reading: an answer you receive
without having formed a prediction first carries little to learn from, however
carefully you read it.

### Productive failure — struggle before instruction deepens understanding

Kapur (2008), "Productive Failure," *Cognition and Instruction* 26(3),
379–424; Kapur (2016), "Examining Productive Failure...", *Educational
Psychologist* 51(2).

Learners who attempt an unfamiliar problem before being shown the method — and
often fail at it — later show better conceptual understanding and transfer than
those given the method up front. The failed attempt is what makes the
explanation land. An assistant that supplies the full solution on the first
sign of difficulty removes that step.

### Metacognitive calibration — the confidence gap is real and trainable

Bjork, Dunlosky & Kornell (2013), "Self-Regulated Learning: Beliefs,
Techniques, and Illusions," *Annual Review of Psychology* 64, 417–444; Schraw
(2009) on calibration of competence; Dunlosky & Rawson (2012) on the learning
cost of overconfidence.

People routinely overestimate how well they understand and how well they
reason, and the overestimate predicts weaker learning. Practising the loop of
committing to an answer and then checking it against the outcome measurably
narrows the gap. An assistant that agrees by default widens it.

---

## 3. Techniques behind the interventions

The prompts the instrument returns for a detected gap draw on a small set of
established techniques from the learning and judgment literature. Each is
well-supported *in its original setting*; that a single prompt dropped into an
AI chat session reproduces the effect is exactly what is not yet established,
and is what the validation program is for. The mapping from each technique to
each prompt is in [`INTERVENTIONS.md`](INTERVENTIONS.md).

- **Generation effect.** Slamecka & Graf (1978), "The generation effect:
  Delineation of a phenomenon," *JEP: Human Learning and Memory* 4(6). Material
  you produce yourself is retained better than the same material read.
- **Self-explanation effect.** Chi, Bassok, Lewis, Reimann & Glaser (1989),
  *Cognitive Science* 13; Chi, de Leeuw, Chiu & LaVancher (1994), "Eliciting
  self-explanations improves understanding," *Cognitive Science* 18(3).
  Prompting a learner to explain a step to themselves improves comprehension
  and the detection of their own gaps.
- **Considering the opposite.** Lord, Lepper & Preston (1984), "Considering the
  opposite: A corrective strategy for social judgment," *JPSP* 47(6).
  Explicitly generating reasons a judgment could be wrong reduces bias more
  than a general instruction to be fair.
- **Prospective hindsight / premortem.** Mitchell, Russo & Pennington (1989),
  "Back to the future: Temporal perspective in the explanation of events,"
  *Journal of Behavioral Decision Making* 2(1); Klein (2007), "Performing a
  Project Premortem," *Harvard Business Review*. Assuming an outcome has already
  happened and explaining why surfaces risks and causes that a forward look
  misses.
- **Utility ranking of study techniques.** Dunlosky, Rawson, Marsh, Nathan &
  Willingham (2013), "Improving Students' Learning With Effective Learning
  Techniques," *Psychological Science in the Public Interest* 14(1). Practice
  testing and distributed practice rank high-utility; self-explanation and
  elaborative interrogation, moderate. Used here to keep intervention design
  weighted toward the better-evidenced moves.

---

## 4. What is still open

- No longitudinal evidence, ours or anyone's, that any intervention here
  changes a person's unaided reasoning over months. This is the central claim
  and it is unproven. VISION §7 Phase 3.
- No independent human-rater agreement study for the instrument's scores yet.
  `docs/VALIDATION.md` records the current seed and what it does and does not
  cover.
- The anchor studies measure disengagement and short-term carryover. Whether
  sustained AI reliance produces lasting capability change is not settled by
  the current literature.
