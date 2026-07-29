# CLAUDE.md

Guidance for agent sessions in this repository.

## Mission

**Read `BRIEF.md` first — it is the mission and the pre-registration
document for this benchmark.** Run the pilot and STOP at the spend
gate it describes before the full matrix.

## What this is

aeo-bench — a benchmark measuring whether the agent-readiness / AEO
techniques proposed in Cloudflare's "agent readiness" post (llms.txt,
sitemap.xml, markdown content negotiation, .md fallbacks, and
combinations) measurably improve an LLM agent's ability to retrieve
facts from a website, and at what token cost. Sibling in discipline
to barkup-bench (same author, same integrity rules). The "website"
is a deterministic in-process Bun.serve fixture generated from a
committed fact corpus — never a deployed site.

## Hard rules

- **Scientific integrity beats a good story.** Publish what the data
  shows. Prompts, corpora, arms, and gates are pre-registered by
  commit before the first scored run; never tuned after looking at
  scored results. Registration lessons from the sibling repo apply:
  acceptance sets are authored independently of the analyst, and
  no-harm conditions register COMPARATIVELY (arm ≤ contemporaneous
  control) unless the absolute bound is itself the claim.
- **Spend gates:** pilot ≈ a few dollars is fine; a full matrix
  requires Kevin's explicit go-ahead with a cost fence in the brief.
- **Graders get unit tests.** The site generator gets tests too —
  a fixture that drifts under the tasks measures nothing.
- The fictional company is fictional: never reuse a real brand,
  domain, or person. The fixture serves on localhost only.
- `bun test` before every commit. Conventional commits; never
  mention AI assistance in commits. Env: `AI_GATEWAY_API_KEY` in
  `.env.local` via varlock (never commit env files).
