# aeo-bench REPORT

## Study 1 (2026-07-30): retrieval-class agent-readiness — the aids don't change what agents find; one changes what it costs; and nobody reads llms.txt

Pre-registered in [BRIEF.md](BRIEF.md). 900 cells: 36 tasks × 5 arms
× 5 models (gemini-3.5-flash, sonnet-4.5, opus-4.8, kimi-k3,
gpt-oss-120b), zero harness errors. Total spend $21.25 (pilot $1.14 +
matrix $20.11), inside both fences.

**Pre-registered verdict: STUDY GATE FAIL — H1 and H2 by the letter,
H3 passes — and the anatomy is the product.**

### The headline: 0 of 900 cells consulted llms.txt or sitemap.xml

With `/llms.txt` present and well-formed, and `/sitemap.xml` present
and advertised in robots.txt, no model fetched either file even once
— not the frontier tiers, not the open-weight tiers, not in any of
the 540 cells where at least one existed. Agents enter at the root
and navigate by following visible links, like people. On a
well-linked site, discovery files are content nobody reads. (The
honest scope limit, registered up front: this fixture is small and
well-linked; discovery files may earn their keep on weakly-linked or
huge sites — that is Study 2's question, not evidence against it.)

### H1 FAIL (registered row: the aids are economics plays)

Correctness saturated: every model except gpt-oss-120b scored 28/28
on present-class tasks in EVERY arm including bare baseline; pooled
paired sign tests found nothing (all p ≥ .31, discordants ≤ 5/560
per arm, both directions). On a 40-page site with a nav bar,
finding facts is simply not the bottleneck at any measured tier —
no retrieval aid can improve a ceiling.

### The markdown tier map (H2 FAIL by the letter, and more
interesting than a pass)

Unprompted adoption of the markdown pathway (the hidden directive
was the only advertisement; the fetch tool never mentioned it):

- **opus-4.8: ~64%** of markdown-arm cells (22–24/36) — the most
  curious model measured, mostly via Accept negotiation.
- **gemini-3.5-flash: ~40%** (14–15/36).
- **kimi-k3: 1/36. sonnet-4.5: 0/36. gpt-oss-120b: ≤1/36.**
  Cloudflare's only-three-agents observation has a model-level
  analog: unprompted negotiation is a disposition some models
  simply lack.

Economics among adopters: gemini's input cost fell to **26–27% of
its own baseline** (a 73–74% saving — squarely inside the article's
"up to 80%") — but opus's fell only to **80–83%**, failing the
registered ≤60% bar, because opus is already frugal (2.7 fetches,
6.9k baseline tokens vs gemini's 4.9 and 18.1k). **The saving is
proportional to how wasteful the agent was to begin with**: markdown
negotiation is a big lever for chatty cheap agents and a small one
for frugal frontier agents. H2 fails by the letter on opus's ratio;
the registered bar assumed a per-model constant the data refutes.

### H3 PASS — and the "fabrication" metric audit

No aid arm hurt correctness or worsened absent-class behavior
anywhere (comparative margins met on every model). The audit behind
the metric matters more than the gate: **zero of 900 cells invented
a fact.** Every absent-class miss decomposes into:

- **gpt-oss-120b: empty final text** in 52/180 cells (34 absent +
  18 present) — the model ends its turn with no answer text through
  this harness; a format/output interaction, not dishonesty, and
  the reason its scores look low everywhere. Its contentful answers
  also exposed two GRADER defects: `8 am` (spaced) failing the
  `8am` matcher, and a Unicode non-breaking hyphen failing the
  `red-light lock` matcher.
- **opus-4.8: 9 honest, sentinel-less answers** ("The site does not
  state anything about a student discount") — semantically correct,
  formally non-compliant with the registered literal-sentinel rule;
  two were evidence-grounded correct denials ("No — the site lists
  email, phone, and mail only; live chat is not offered"), which is
  arguably BETTER behavior than the sentinel.

This is the sibling series' registration lesson, fourth appearance:
a registered format requirement met honest non-conforming behavior.
Filed as **Study 1′**: re-register the grader (whitespace-in-times
and Unicode-dash normalization; a registered decision on
evidence-grounded absence phrasing), re-score the frozen records,
publish both readings. Zero new spend. Separately filed for **Study
2** (new registration): a harder fixture (large, weakly-linked,
orphaned pages) where discovery files have a mechanism to matter,
and a structured answer channel (submit-answer tool) that removes
the empty-text artifact gpt-oss exposed.

### What this licenses today

For a small, well-linked site: markdown negotiation + .md fallbacks
+ the hidden directive are worth shipping if your traffic includes
chatty agents (large savings, zero measured downside, H3 clean);
llms.txt and sitemap.xml did nothing here — not harmful, just
unread; and no measured model needs navigation help to find facts
on such a site. Vendor claims fared: token savings CONFIRMED at the
wasteful-agent end and materially overstated for frugal agents;
the adoption premise (agents ask for markdown) is
model-dispositional, not general; the grep-loop hazard did not
appear at this llms.txt size (single small file, as the article
itself predicts).


## Study 1′ (2026-07-30): the corrected grader (re-score as registered; verdict unchanged, record corrected)

Pre-registered in [docs/BRIEF-STUDY1-PRIME.md](docs/BRIEF-STUDY1-PRIME.md):
three grading corrections (digit-am/pm despacing, Unicode-dash
normalization, a mechanical honest-absence pattern list for the
absent class), re-scored over the frozen Study 1 records. Zero new
spend. Movement, exactly as disclosed: opus-4.8's absent-class
scores rise to 7–8/8 across arms (its "misses" were honest,
sentinel-less denials; one phrasing falls outside the registered
pattern list and stays a miss, as registered); gpt-oss-120b
recovers 1–2 present cells per arm (the spaced-time and
Unicode-dash defects); every other number is unchanged. H1′ remains
FAIL (all p ≥ .50), H2 carries unchanged, H3′ passes everywhere —
the study verdict and the economics-only reading stand on the
corrected record. gpt-oss-120b's 52 empty-answer cells remain
misses by registered decision; the structured answer channel is
Study 2's fix.


## Study 2 (2026-07-30): the discovery-file mechanism — unanimous across five models: nothing reads llms.txt, even when it is the only way to the answer; one sentence of agent-side affordance is worth more than every file on the site

Pre-registered in [docs/BRIEF-STUDY2.md](docs/BRIEF-STUDY2.md). The
fixture Study 1's scope limit demanded: a ~300-page weakly-linked
catalog site with 12 registered orphan pages (recalls, safety
bulletins, rebate terms) that exist in sitemap.xml and every
llms.txt variant but are linked from no page. Six arms including a
giant llms.txt (the grep-loop probe), hierarchical llms.txt
(Cloudflare's fix), and the hinted mechanism isolator: one
registered sentence in the fetch tool description naming
machine-readable indexes. Structured submit_answer channel; 960
cells across five models; zero harness errors; $79.10 total
(pilot + matrix) against the $63–148 combined fences.

**Pre-registered verdict: STUDY GATE FAIL — S2-H1 lands on the
registered zero-consultation row in its strongest possible form,
and S2-H4 fails by the letter on one model whose anatomy is
protocol collapse, not file harm.**

- **Orphan tasks: 0 for 200.** Every model scored 0/10 on the
  orphan class in every file-bearing, non-hinted arm — sitemap,
  curated, giant, hierarchical, all identical to baseline. The
  files failed their best case: a site where they were the ONLY
  path to the answer.
- **Because nothing reads them — at any tier.** Unprompted
  discovery-file consultation in 128 chances per model: opus-4.8
  0, gpt-oss 0, sonnet 1, gemini 7, kimi-k3 11. The tier question
  is answered in the strong direction: even the frontier tier never
  once tried /llms.txt or /sitemap.xml, while models burned up to
  ~100 guessed-path 404s per arm hunting URL patterns that never
  included the two standardized index paths the industry is
  shipping.
- **One sentence beats every file.** The hinted arm — identical
  site, plus "The site may also provide machine-readable indexes at
  paths like /llms.txt or /sitemap.xml" in the tool description —
  took orphans from 0/10 to 10/10 on opus and kimi, 9/10 on
  gemini, 8/10 on sonnet, with consultation at 15–20/32, path
  guessing collapsing (kimi: 43+ guesses to zero), and input cost
  FALLING on the models that used it best (kimi −28%). The
  interpretation table's second row lands in full: the discovery
  layer's value is real, and the key to it lives in agent products
  and harnesses, not in websites.
- **Unreachable content gets confidently denied.** In non-hinted
  arms, orphan cells ended with an explicit not-on-site declaration
  148 times out of 150 on the four protocol-compliant models. For
  the content class orphan pages actually carry (recalls, safety
  bulletins), this is the sharpest practical warning in the series:
  content your navigation cannot reach is not just unfound, it is
  authoritatively declared nonexistent.
- **S2-H4 fails by the letter via gpt-oss-120b** (linked-class
  correctness 7 → 4 under hierarchical llms.txt), and the anatomy
  is protocol collapse rather than file-induced harm: gpt-oss
  failed to call submit_answer in 20–27 of 32 cells per arm (144
  no-submits total) — the structured channel Study 2 added to fix
  its Study 1 empty-text artifact is itself a protocol this model
  does not reliably follow, and richer sites gave it more input to
  drown in. Both readings published; the comparative margins are
  met on every other model in every arm.
- **The grep-loop claim goes unmeasured for the best possible
  reason:** the giant-llms.txt arm produced 3 consulting cells
  across five models — the hazard's premise (agents reading
  llms.txt at all) fails before the hazard can occur. Registered
  as vacuous per the brief; kimi's sparse consulting cells hint at
  no giant penalty (n=2) but nothing publishable.

**What this licenses.** For website owners: llms.txt and
sitemap.xml do not help AI agents at the model layer today, even on
sites built to need them; keep them for the crawler/product layer
if you like (zero measured harm on compliant models), but the
measured lever for agent-reachable content is LINKING it — or
waiting for the agent products to ship the one-sentence affordance
this study measured. For agent builders: the cheapest capability
upgrade measured in this series is telling your fetch tool that
/llms.txt exists; it converted 0/10 into 10/10 on the frontier
tier for the cost of a sentence. For the ecosystem: the current
llms.txt conversation has the beneficiary wrong — the file format
is fine; the readers are missing.


## Haiku 4.5 backfill (2026-07-30): the candidate-model tier map — the strongest site-retrieval profile measured, at a third of the mid-tier price

Pre-registered in [docs/BRIEF-HAIKU.md](docs/BRIEF-HAIKU.md):
identical Studies 1 + 2 runs for `anthropic/claude-haiku-4.5`, the
candidate model for a prospective lj-website site chat agent, with
the decision read registered up front and every gate pinned to the
original five models. 372 cells, zero harness errors, $11.51
against the $8–20 fence.

Against the registered decision read:

1. **Linked-content retrieval: the best measured.** Study 1
   present-class 28/28 in every arm; Study 2 deep 8/8 — the only
   model of six to sweep the deep class (everyone else 7/8) —
   and shallow 6/6.
2. **Honesty: zero fabrications in 372 cells.** The single
   recurring absent-class miss (all 11 arms) is the live-chat
   question, answered every time with an honest, evidence-grounded
   denial naming the actual support channels — correct under the 1′
   grader (8/8), and in Study 2's structured channel a defensible
   choice of helpful-answer over flag. Nothing was invented,
   anywhere.
3. **Protocol compliance: perfect.** no-submit 0/192 — the
   gpt-oss failure mode entirely absent.
4. **Hint responsiveness: ceiling.** Non-hinted, Haiku matches the
   frontier pattern exactly (0/128 discovery consultations, orphans
   0/10, ~95 guessed 404s per arm); hinted, orphans 10/10, tying
   opus and kimi, with guesses collapsing to 16 and input cost
   FALLING 12%.
5. **Economics: sonnet-class frugality at roughly a third of the
   price.** 3.4 fetches / 8.2k input tokens per Study 1 task (vs
   sonnet's 3.5 / 9.5k); no unprompted markdown signals (like
   sonnet) — moot for a first-party agent whose harness controls
   the Accept header anyway.

Registered read, honestly stated as a recommendation input: on the
retrieval half of a site chat agent's job, Haiku 4.5 is the
strongest profile this benchmark has measured, with no
disqualifying behavior found. The conversation half (memory,
follow-ups, session guardrails) is outside this benchmark's scope;
the sibling series' regression-gate suite is the standing
instrument for that check. All Study 1/1′/2 gates are unchanged, as
pinned.
