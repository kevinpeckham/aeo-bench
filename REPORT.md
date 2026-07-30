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
