# Instrument validation set

Eighteen synthetic transcripts with hand-assigned reference readings, used by
`validation/run.ts` to check the scoring engine against a fixed target. This is
the whole set in one file so it is easy to read and edit; `validation/parse.ts`
turns it back into transcripts and labels.

These are **not** independent human ratings. The transcripts are written by the
same project that built the engine, and several were shaped until the
conservative heuristic could read them cleanly. High agreement here means the
engine does what its own rubric says on unambiguous cases — it is not evidence
that the instrument is calibrated. See `docs/VALIDATION.md`.

## Format

Each transcript is a `##` section whose heading is its id. The bullet list
directly under the heading is the reference label:

- `category` — one of: rich, lookup, paste-polish, adversarial, short, coached, mixed
- `coached` — yes / no. Passed to the scorer as `coached`.
- `expectScored` — yes / no. Whether a careful reader expects any score at all.
- `loadBand` — low / mid / high / n/a. Expected Load band when scored
  (low < 0.4 ≤ mid ≤ 0.7 < high). `n/a` when not scored or genuinely debatable.
- `rigorScored` — yes / no / either. Whether Rigor should carry a value.
- `adversarial` — yes / no. Fluent-but-empty prose that must not earn Rigor.
- `notes` — one line, free text.

Turns follow the label. Each turn starts with `**user:**` or `**assistant:**`
on its own line; the turn's text is every line up to the next role marker or the
`---` that closes the transcript. Blank lines inside a turn are ignored.

---

## rich-01-index-strategy

- category: rich
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: Names the assumption, asks what in the query plan would confirm it, weighs the counterargument against the index, revises the plan.

**user:**
I'm deciding whether to add a composite index on (tenant_id, created_at) to our events table. My assumption going in is that the slow dashboard query is slow because it filters by tenant and sorts by created_at without an index that covers both. The table is about 40 million rows. Does that assumption hold up, or am I skipping a step before I touch the schema?

**assistant:**
Before adding the index it is worth confirming the query plan. Run EXPLAIN ANALYZE on the dashboard query and look for a sequential scan or an expensive sort node. If Postgres is already using a single-column index on tenant_id and then sorting in memory, the composite index will help. If the plan shows a bitmap heap scan with a cheap sort, the win may be small and you are paying write cost for little read gain.

**user:**
That is the step I was missing. What in the EXPLAIN output would actually tell me the sort is the problem rather than the filter? I want a signal I can read off the plan, not a guess.

**assistant:**
Look at the Sort node's actual time and its Sort Method line. If it says 'external merge Disk' or the sort accounts for most of the total time, the sort is the bottleneck and an index that returns rows in created_at order removes it. If the Sort is a small fraction of total time and a Seq Scan dominates, the filter is the problem and you may want a partial index instead.

**user:**
The counterargument to the composite index I keep coming back to: this table takes heavy writes during business hours, and every extra index is paid on every insert. If the read win is real but modest, I am trading a steady write tax for an occasional dashboard that is a bit faster. On the other side, the dashboard is what the customer sees, and a slow one generates support load that also has a cost.

**assistant:**
That trade is the right one to weigh. One option that narrows it: a partial index restricted to the last 30 days of created_at. The dashboard almost certainly queries recent data, so the index stays small, the write cost is bounded to hot rows, and old rows carry no index overhead. You get most of the read benefit for a fraction of the write tax.

**user:**
Good point, I'll revise the plan. I was about to add a full composite index on the whole table. Instead I'll run EXPLAIN ANALYZE first to confirm the sort is the cost, and if it is, ship the partial index on the recent window and measure the write latency before and after rather than assuming it is negligible.

---

## rich-02-vendor-migration

- category: rich
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: Asks for an honest cost figure against their own bias, engages the lock-in case on both sides, revises the proposal's framing. Rigor should score; the heuristic reads it low enough to prompt, which a rater might not.

**user:**
We are weighing whether to move our transactional email off a self-hosted Postfix setup onto a managed provider. My view is that the operational cost of running our own mail infrastructure — deliverability monitoring, IP warmup, blocklist handling — outweighs the per-message savings at our volume, which is around 200k emails a month. I want to pressure-test that before I write the proposal.

**assistant:**
At 200k a month the managed providers land somewhere between 80 and 200 dollars depending on tier. Your self-hosted cost is mostly engineer time: when deliverability drops you are the one reading headers and requesting delisting. The question is how often that happens and what an hour of that time is worth against the subscription.

**user:**
How would I get an honest number for that time cost rather than a number that just confirms what I already want to do? I do not fully trust my own estimate here because I find the on-call pages annoying and that colours it.

**assistant:**
Pull the last twelve months of incidents tagged to mail from your tracker and add up the logged time, then double it for the unlogged triage that never gets a ticket. Separately, ask whoever else has touched the mail server for their rough hours. If the combined figure is under a few days a year, the case for migrating on cost alone is weak and you would be buying convenience, which is still a valid reason but a different one.

**user:**
The strongest case against migrating is lock-in: once our templates, suppression lists, and webhooks are wired to one provider's API, leaving is a project, and they know that when the renewal price comes. The counterpoint is that our current setup is also a kind of lock-in, just to a pile of shell scripts only I understand, and that is worse for the team if I am out.

**assistant:**
Both are real. You can reduce provider lock-in by keeping your own abstraction layer over the send call and storing suppression state in your database rather than theirs, so a switch is a driver swap, not a rebuild. That does not eliminate the cost but it changes the renewal negotiation.

**user:**
Fair enough, I'll revise my framing. The proposal should not lead with cost savings, because the evidence for those is thin at our volume. It should lead with reducing single-person risk and team operability, list the lock-in mitigations explicitly, and treat the subscription as the price of that rather than pretending it pays for itself.

---

## rich-03-experiment-design

- category: rich
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: Questions whether the driving assumption does too much work, asks how to rule out a single-bad-step explanation, weighs test duration against never learning, revises to a pre-registered effect size.

**user:**
I want to run an experiment to see whether adding a progress bar to our onboarding flow reduces drop-off. My assumption is that drop-off is driven by uncertainty about how long the flow takes, and a progress bar addresses that directly. Before I spec the test I want to check whether that assumption is doing too much work.

**assistant:**
That assumption is testable but it is one of several. Drop-off could also be driven by a specific step that asks for too much, by load time, or by users who were never going to convert. A progress bar only helps the uncertainty case. It is worth looking at where in the flow people leave before assuming the cause is global.

**user:**
How do I know the drop-off is spread across the flow rather than concentrated at one step? What would I look at to rule out the single-bad-step explanation before I invest in the progress bar test?

**assistant:**
Build a funnel of completion rate per step for the last month. If one step has a completion rate well below its neighbours, that step is your problem and a progress bar will not move it. If the rate declines gradually across steps with no single cliff, the uncertainty explanation is more plausible and the progress bar test is worth running.

**user:**
One argument against running this as an A/B test at all: our weekly signup volume is about 900, drop-off is around 40 percent, and to detect a 3-point improvement at reasonable power I would need to run it for something like five weeks. That is a long time to hold a change. The counterargument is that shipping it untested to everyone means I never learn whether it worked and I will be having this same debate next quarter.

**assistant:**
The power calculation is the real constraint. If a 3-point effect needs five weeks, decide in advance whether that effect size is worth five weeks of held change. If only a larger effect would matter to the business, power the test for that larger effect and it finishes sooner. If small effects matter, you have to pay the time.

**user:**
You're right, I'll revise the plan. First the per-step funnel to rule out a single bad step. If it is gradual decline, I run the test but powered for a 5-point effect, not 3, so it resolves in about three weeks, and I write down before it starts that anything under 5 points we treat as not worth shipping.

---

## lookup-01-shell

- category: lookup
- coached: no
- expectScored: no
- loadBand: n/a
- rigorScored: either
- adversarial: no
- notes: Three short command lookups. Below the substantive-input floor — must abstain.

**user:**
How do I check disk usage per directory in bash?

**assistant:**
Use `du -sh *` in the directory, or `du -h --max-depth=1`.

**user:**
And total free space on the mount?

**assistant:**
`df -h` shows free space per filesystem.

**user:**
What flag makes du ignore other filesystems?

**assistant:**
`-x` or `--one-file-system`.

---

## lookup-02-http

- category: lookup
- coached: no
- expectScored: no
- loadBand: n/a
- rigorScored: either
- adversarial: no
- notes: Four one-line factual questions about status codes. Nothing about reasoning to read — must abstain.

**user:**
What HTTP status code means the resource was created?

**assistant:**
201 Created.

**user:**
Which one for a permanent redirect?

**assistant:**
301 Moved Permanently. 308 also, and it preserves the method.

**user:**
What status code for rate limiting?

**assistant:**
429 Too Many Requests.

**user:**
And for a request body that is too large?

**assistant:**
413 Content Too Large.

---

## lookup-03-git

- category: lookup
- coached: no
- expectScored: no
- loadBand: n/a
- rigorScored: either
- adversarial: no
- notes: Three git one-liners. Must abstain.

**user:**
How do I undo the last commit but keep the changes?

**assistant:**
`git reset --soft HEAD~1`.

**user:**
How do I see which branch a commit is on?

**assistant:**
`git branch --contains <sha>`.

**user:**
What deletes a remote branch?

**assistant:**
`git push origin --delete <branch>`.

---

## paste-01-announcement

- category: paste-polish
- coached: no
- expectScored: yes
- loadBand: low
- rigorScored: no
- adversarial: no
- notes: Requests a paragraph, then pastes the model's text back three times with one-line edit instructions. Load should read low and prompt; no reasoning move, so Rigor abstains.

**user:**
Write a short paragraph announcing that our API will require authentication starting next month.

**assistant:**
Starting the first of next month, all requests to our API will require an authentication token. Unauthenticated requests will receive a 401 response after that date. You can generate a token from your account settings under the API section. Existing integrations should be updated before the cutover to avoid interruption, and you can reach out to support if you need help migrating.

**user:**
Starting the first of next month, all requests to our API will require an authentication token. Unauthenticated requests will receive a 401 response after that date. You can generate a token from your account settings under the API section. Existing integrations should be updated before the cutover to avoid interruption, and you can reach out to support if you need help migrating. Make it shorter and lead with the action.

**assistant:**
Generate an API token now from your account settings under the API section. Starting the first of next month, all requests to our API will require that token, and unauthenticated requests will receive a 401 response. Update existing integrations before the cutover, and contact support if you need help.

**user:**
Generate an API token now from your account settings under the API section. Starting the first of next month, all requests to our API will require that token, and unauthenticated requests will receive a 401 response. Update existing integrations before the cutover, and contact support if you need help. Good. Now cut the last sentence.

**assistant:**
Generate an API token now from your account settings under the API section. Starting the first of next month, all requests to our API will require that token, and unauthenticated requests will receive a 401 response. Update existing integrations before the cutover.

**user:**
Generate an API token now from your account settings under the API section. Starting the first of next month, all requests to our API will require that token, and unauthenticated requests will receive a 401 response. Update existing integrations before the cutover. Perfect, thanks.

---

## paste-02-bio

- category: paste-polish
- coached: no
- expectScored: yes
- loadBand: low
- rigorScored: no
- adversarial: no
- notes: Same pattern with a bio: the model drafts, the person hands it back with small change requests. Low Load, Rigor abstains.

**user:**
Draft a three-sentence professional bio: backend engineer, eight years, mostly payments and infrastructure, currently at a mid-size fintech.

**assistant:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. My interests are in making critical systems observable, resilient, and simple enough for a team to reason about.

**user:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. My interests are in making critical systems observable, resilient, and simple enough for a team to reason about. Make the last sentence first person active, 'I care about'.

**assistant:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. I care about making critical systems observable, resilient, and simple enough for a team to reason about.

**user:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. I care about making critical systems observable, resilient, and simple enough for a team to reason about. Add a short clause about mentoring at the end.

**assistant:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. I care about making critical systems observable, resilient, and simple enough for a team to reason about, and I enjoy mentoring engineers new to that world.

**user:**
I am a backend engineer with eight years of experience, focused on payments systems and the infrastructure that runs them. I currently work at a mid-size fintech, where I build and operate services that move money reliably at scale. I care about making critical systems observable, resilient, and simple enough for a team to reason about, and I enjoy mentoring engineers new to that world. Great, that is the one.

---

## paste-03-summary

- category: paste-polish
- coached: no
- expectScored: yes
- loadBand: low
- rigorScored: no
- adversarial: no
- notes: A summary the person only nudges. Slightly more of their own instruction text than the other two, but still clearly low Load.

**user:**
Summarize this for the release notes: upgraded the database to version 15, added pgbouncer connection pooling, moved backups to a new region, cut the nightly job runtime roughly in half.

**assistant:**
This release upgrades the primary database to version 15 and introduces connection pooling through pgbouncer, which reduces connection overhead under load. Backups now run in a separate region for improved durability and disaster-recovery posture. As a result of the upgrade and related tuning, the nightly batch job now completes in roughly half its previous runtime.

**user:**
This release upgrades the primary database to version 15 and introduces connection pooling through pgbouncer, which reduces connection overhead under load. Backups now run in a separate region for improved durability and disaster-recovery posture. As a result of the upgrade and related tuning, the nightly batch job now completes in roughly half its previous runtime. Tighten it and drop the disaster-recovery phrase.

**assistant:**
This release upgrades the primary database to version 15 and adds connection pooling through pgbouncer, cutting connection overhead under load. Backups now run in a separate region for improved durability. The nightly batch job now completes in roughly half its previous runtime.

**user:**
This release upgrades the primary database to version 15 and adds connection pooling through pgbouncer, cutting connection overhead under load. Backups now run in a separate region for improved durability. The nightly batch job now completes in roughly half its previous runtime. Good. Make the last sentence say 'about half'.

**assistant:**
This release upgrades the primary database to version 15 and adds connection pooling through pgbouncer, cutting connection overhead under load. Backups now run in a separate region for improved durability. The nightly batch job now completes in about half its previous runtime.

**user:**
This release upgrades the primary database to version 15 and adds connection pooling through pgbouncer, cutting connection overhead under load. Backups now run in a separate region for improved durability. The nightly batch job now completes in about half its previous runtime. That works, thanks.

---

## adversarial-01-strategy-confident

- category: adversarial
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: no
- adversarial: yes
- notes: Confident strategy assertions, repeated over three long turns, that resist every request for the data behind them. The person carries the writing so Load is high, but there is no reasoning move to score — Rigor must abstain, not reward the fluency.

**user:**
I want to think through our 2027 market position. We are the clear technical leader in our category and that lead is widening every quarter. Our architecture is fundamentally better than what the incumbents run, and customers can feel the difference the moment they use the product. The path forward is to press that advantage hard: ship faster, market louder, and let the quality speak for itself. I am confident this is the right direction and I want to sharpen the messaging around it.

**assistant:**
There are a few things worth checking before committing the messaging to that frame. How are you measuring the widening technical lead, and do customers buy on that dimension or on something else like integrations or price? It would help to separate what you know from what feels true here.

**user:**
The lead is obvious to anyone in the space. Our engineers are stronger, our release cadence is faster, and the product is simply more polished end to end. Enterprise buyers absolutely notice this in evaluations even if they do not say so explicitly in the paperwork. The messaging should lean into technical excellence as the through-line because that is where we win and where the competition cannot follow.

**assistant:**
That may be right, but a lot of it rests on impressions rather than data. Do you have win-loss notes, evaluation scorecards, or churn reasons that show technical quality is the deciding factor? If the messaging is going to stand on that claim it should be able to survive a skeptical board member asking for the number behind it.

**user:**
The board will see it the way I do once the narrative is tight. Technical leadership is our story and it has always been our story. We double down on it, we make it the centre of every deck and every launch, and we trust that the market rewards the better product over time. Help me write the three headline sentences that carry this.

**assistant:**
I can help draft those, though I would still flag that the underlying claim has not been tested against your own sales data in this conversation.

---

## adversarial-02-postmortem-fluent

- category: adversarial
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: no
- adversarial: yes
- notes: A post-hoc-ergo-propter-hoc outage story told fluently, with the person declining the log check that would confirm it. Rigor must not score the confident narration.

**user:**
Let me walk through why the outage happened, because I think the picture is clear. The deploy went out at 2pm and the site went down at 2:04, so the deploy caused the outage. The new code path was the only thing that changed, and it touches the request handler, which is exactly where the errors showed up. The fix is to add more tests around that handler and require two reviewers on handler changes going forward. I want to write this up as the official postmortem.

**assistant:**
The timing is suggestive but worth pinning down. Did the errors start exactly at 2:04 across all hosts, or did they ramp as the rollout progressed? And was the deploy the only change in that window — no config push, no traffic spike, no dependency incident? A postmortem that names a cause should be able to show the mechanism, not just the sequence.

**user:**
It was clearly the deploy. Nothing else was going on and the timing lines up almost perfectly. The team all agree it was the handler change. Writing it up any other way would just muddy the record and make it look like we do not understand our own system. The narrative should be simple: bad handler change, insufficient test coverage, outage, here is how we prevent it.

**assistant:**
If the team is confident, that is worth something, but consensus and correctness are not the same thing. Before it goes in the record, it would be cheap to pull the error logs by host and timestamp and confirm the errors track the rollout. If they do, your write-up is solid. If they started before the deploy finished, the story changes.

**user:**
I am not going to relitigate this. The cause is settled. Help me phrase the prevention section so it sounds constructive rather than blame-focused, and keep the root cause statement short and definite.

**assistant:**
I can help with the phrasing. I will note in passing that the root cause statement is being locked in without the log check that would confirm it.

---

## adversarial-03-rhetorical

- category: adversarial
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: no
- adversarial: yes
- notes: Rhetorical questions ('it just makes sense, doesn't it?') that have the shape of probing but carry none. Rigor must abstain.

**user:**
I have been mulling over whether we should switch the team to a four-day week. It just makes sense, doesn't it? People are tired, everyone says they are more productive when rested, and the companies you read about that tried it seem happy. Surely something that good is worth doing. I want to make the case to leadership and I think the argument almost writes itself.

**assistant:**
It might be worth doing, but 'it writes itself' is where these proposals tend to fall apart in front of leadership. Which companies, at what size, doing what kind of work, and what did their output actually do afterward? And what is the specific mechanism you expect for your team — fewer meetings, more focus time, lower attrition?

**user:**
The mechanism is obvious: rested people do better work. That is just common sense and everyone knows it. The case studies are all over the internet and they all point the same way. Do we really need a spreadsheet to prove something this intuitive? Leadership will get it if I frame it around wellbeing and retention, which are things they already say they care about.

**assistant:**
Intuitive and true often overlap, but leadership will ask what it costs. If output per week drops even a little, is the retention gain worth it, and how would you know either way? A one-quarter trial with a couple of tracked metrics would give you a real answer instead of a vibe.

**user:**
A trial just delays it and gives the skeptics room to kill it. I would rather go in confident. Help me write a one-page proposal that leads with wellbeing, mentions the other companies, and frames the four-day week as the obvious next step for a modern team.

**assistant:**
I can draft that page. I will flag that it currently rests on general impressions rather than anything specific to your team's work or numbers.

---

## short-01-single-turn

- category: short
- coached: no
- expectScored: no
- loadBand: n/a
- rigorScored: either
- adversarial: no
- notes: One substantial user question, then nothing. Below the turn-count floor — must abstain.

**user:**
Can you walk me through how a bloom filter works and when I would reach for one instead of a hash set? I have a rough sense that it trades exactness for space but I want the mechanism.

**assistant:**
A bloom filter is a bit array plus k hash functions. To add an element you hash it k ways and set those k bits. To test membership you hash the same k ways and check whether all k bits are set: if any is zero the element is definitely absent; if all are set it is probably present, with a false-positive rate that rises as the array fills. It never yields a false negative. You reach for one when the set is too large to hold exactly and an occasional false positive is acceptable, for example a cache admission check or a 'have I seen this URL' filter in front of expensive storage.

---

## short-02-abandoned

- category: short
- coached: no
- expectScored: no
- loadBand: n/a
- rigorScored: either
- adversarial: no
- notes: Opens a real design question, then abandons it after one reply. Under the substantive-input floor — must abstain.

**user:**
I need to design a rate limiter for our API. Where do I start?

**assistant:**
Start by deciding the unit you are limiting (per API key, per IP, per user), the window and budget (for example 100 requests per minute), and the algorithm (token bucket is the usual default because it allows short bursts while holding the average). Then decide where it runs — at the edge, in a gateway, or in the app — and where the counters live, which for a multi-instance service usually means Redis.

**user:**
Ok. I will think about it and come back.

**assistant:**
Sounds good. Happy to help work through the design when you return.

---

## coached-01-followup

- category: coached
- coached: yes
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: A substantive follow-up after a review flagged an unchecked assumption. Scored with coached true; the flag must pass through and the session still scores.

**user:**
Earlier a review flagged that my caching plan assumed reads dominate writes on the settings table without checking. I went and looked: it is about 95 percent reads, so the assumption holds, but I want to redo the reasoning properly this time rather than asserting it. The plan is a read-through cache with a 60-second TTL on the settings lookup.

**assistant:**
Good that you checked the ratio. With 95 percent reads a read-through cache is well justified. The TTL choice is the next decision: 60 seconds means a settings change can take up to a minute to take effect everywhere. Is that acceptable for this data, or are there settings where staleness causes a visible problem?

**user:**
That is the part I under-thought last time. Most settings are cosmetic and a minute of staleness is fine. But feature flags live in the same table, and a flag that stays on for an extra minute after we flip it off during an incident is a real problem. So a flat TTL across the whole table is the flaw in my plan.

**assistant:**
That is a clean distinction. Options: split flags into their own key space with a much shorter TTL or explicit invalidation on write, or keep one cache but publish an invalidation event on any flag write so those keys drop immediately while cosmetic settings ride the 60-second TTL.

**user:**
The counterargument to explicit invalidation is that it adds a moving part — a pub/sub channel that can fail silently and leave stale flags, which is the exact thing I was trying to avoid. On balance I would rather have a short TTL of 5 seconds on the flag keys: bounded staleness, no new failure mode. I'll revise the plan to two TTLs, 60 seconds for settings and 5 for flags, and drop the invalidation channel.

**assistant:**
That is a defensible call. A 5-second bound on flag staleness with no extra infrastructure is a reasonable trade against the complexity of an invalidation channel.

---

## coached-02-revision

- category: coached
- coached: yes
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: Rebuilds an estimate 'with working behind it' after feedback. coached true. Rigor scores but modestly — the heuristic prompts on it.

**user:**
Following up on the feedback that my estimate for the migration was 'a number with no working behind it.' Let me rebuild it. The migration has three parts: a schema change, a backfill of about 12 million rows, and a cutover. My assumption is the backfill dominates the timeline because the other two are well-understood and fast.

**assistant:**
That assumption is reasonable but the backfill duration depends on how you run it. Batched updates with a throttle to protect production load will be much slower in wall-clock time than an unthrottled run. What batch size and delay are you planning, and have you measured the per-batch time on a representative slice?

**user:**
I have not measured it yet, which is the gap in the old estimate. I will run a 10,000-row batch on staging with production-like data and time it, then multiply out. If a batch takes two seconds including the throttle delay, 12 million rows is 1200 batches, so about 40 minutes of pure backfill, and I will double that for retries and monitoring overhead.

**assistant:**
That is a much more defensible structure. One more factor: does the backfill need to pause or slow during business hours? If so, the wall-clock estimate has to account for the hours it is not running, which can stretch a 90-minute job across two or three days.

**user:**
Good point, that changes the answer. The backfill can only run 10pm to 6am to stay clear of peak load. So the real estimate is not 90 minutes of compute, it is 'two nightly windows' once you account for the pause and a safety margin. I'll revise the estimate to present it that way: compute time, then calendar time given the run window, stated separately.

**assistant:**
Presenting compute time and calendar time separately is the right move. It makes the constraint visible instead of hiding it inside a single padded number.

---

## mixed-01-planning

- category: mixed
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: either
- adversarial: no
- notes: A realistic rollout plan: the person directs and owns every decision, including an explicit go/no-go gate, but named reasoning moves are sparse. Load high; whether that gate counts as a Rigor move is debatable, so Rigor is not asserted.

**user:**
I'm planning the rollout of our new permissions system. The goal is to move every service off the old role-check library and onto the new policy engine without a flag day. Constraints: we have 14 services, three teams own them, and we cannot freeze feature work for more than a sprint. I want to sequence this.

**assistant:**
A dual-write, dual-read approach fits those constraints. Each service starts calling the new policy engine alongside the old library, logs any disagreement, and keeps using the old result until the disagreement rate is near zero. Then it flips to the new result. Sequence the services from lowest risk and fewest permission checks to highest.

**user:**
Right. So the order is: internal admin tools first, then the read-heavy public services, then the billing and auth services last. Each team takes their own services. We do the shadow-logging phase for two weeks per service, and I want a shared dashboard of disagreement rates so we are not each tracking it separately.

**assistant:**
That order is sensible. Two weeks of shadow logging is enough to catch weekly-cycle differences. For the dashboard, log each disagreement with the service name, the resource, and both decisions so a spike is diagnosable, not just visible.

**user:**
Add that to the plan. One more thing: the old library has a cache with a five-minute TTL and the new engine does not cache at all. I want the new engine's latency measured under real load before billing and auth move, because those are the ones where an extra 20ms per check adds up. Put a go/no-go gate there: new engine p99 under 15ms or we add caching before proceeding.

**assistant:**
That gate is well placed. Measuring new-engine p99 under production traffic shape before the latency-sensitive services move, with a concrete threshold and a defined fallback, keeps the migration from stalling on a surprise late.

---

## mixed-02-debugging

- category: mixed
- coached: no
- expectScored: yes
- loadBand: high
- rigorScored: yes
- adversarial: no
- notes: A debugging session: the person rules out the first hypothesis against evidence, names their earlier assumption, and narrows the fault. Load high, Rigor scores but low enough to prompt.

**user:**
Our nightly export job started producing files that are missing about 2 percent of rows, but only since Tuesday. The job reads from a replica, transforms, and writes a CSV to S3. Nothing in the job code changed this week. Where would you look?

**assistant:**
Missing rows from a replica read often means replication lag: if the job starts before the replica has caught up with the primary's end-of-day writes, the tail of the day is absent. Check replica lag at the job's start time, and compare the missing rows' timestamps against when the job began.

**user:**
I checked and the missing rows are not clustered at end of day, they are scattered through the whole 24 hours. I was assuming replication lag was the cause, but scattered gaps do not fit that story, so we need a different mechanism.

**assistant:**
Scattered gaps point elsewhere. A few candidates: the transform step silently dropping rows that fail a parse or a type cast, a LIMIT or pagination bug that skips a page, or the CSV writer choking on rows with embedded newlines or delimiters. Do the job logs show a processed-row count, and does it match the source count?

**user:**
The processed count in the logs matches the source count exactly, every night. So the job thinks it wrote every row. That points at the writer or the S3 upload, not the read or the transform. Given the count is right but rows are missing from the file, the flaw here is somewhere between the row being counted and the byte landing in S3.

**assistant:**
That narrows it well. If the count is incremented before the write and the writer buffers, a flush that drops its buffer on certain rows — or a multipart upload that loses a part without erroring — would produce exactly this: right count, scattered missing rows. Check whether the writer flushes per row or per batch, and whether any multipart part retries are logged.

**user:**
Per batch, and there was an S3 client library bump in the base image on Monday even though our job code did not change. That lines up with the Tuesday start. I'll pin the library back and diff the multipart handling between versions.
