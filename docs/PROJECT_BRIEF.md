# Highnet Safe LLM Tools — Project Brief

Status: **decided** (Phase 1 discovery, 2026-09-28; Scope and the rebrand added by the owner, 2026-10-29). Changes to anything here need the owner's approval.

Highnet Safe LLM Tools is a web app with two teaching tools that make every step of an LLM system visible and explorable:

- **RAG** answers questions with Retrieval-Augmented Generation. Visitors see _how_ RAG works, _why_ each step exists, and _what_ it is (and isn't) good for.
- **Scope** shows an AI agent deciding whether a message is in scope, step by step: rules, a nearest-neighbour vote, an LLM judge, fusion and thresholds, ending in answer, answer briefly, redirect or block.

The site was called highnet-rag until 2026-10-29; the RAG decisions below were made under that name.

Product context for design lives in [`PRODUCT.md`](../PRODUCT.md), the visual system in [`DESIGN.md`](../DESIGN.md), the system design in [`ARCHITECTURE.md`](ARCHITECTURE.md), and the plan in [`MILESTONES.md`](MILESTONES.md).

## Decisions

### Goals & audience

| #   | Question                         | Decision                                                                                                                                      |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Audience, ranked                 | 1. **Developers learning RAG** · 2. Recruiters / hiring managers · 3. Non-technical visitors · 4. The owner                                   |
| 2   | The one takeaway after 5 minutes | **Retrieval quality decides the answer.** RAG is search + a prompt, and you can see exactly which chunks the model was given.                 |
| 3   | Kind of project                  | **Portfolio piece + learning lab.** Public use is welcome, but there is no product commitment (no SLA, no accounts).                          |
| 4   | Explanation depth                | **Intermediate.** Basic programming and ML vocabulary is assumed. Each stage has a short "Why this step?" plus an expandable technical layer. |
| 5   | Languages                        | **English only in v1.** UI strings live in one message catalogue so DE/ES can be added later.                                                 |

### Corpus & pipeline

| #   | Question                            | Decision                                                                                                                                                                                                      |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Corpus                              | **SQuAD 2.0 dev set**: its 35 Wikipedia articles (~1.2k paragraphs), CC BY-SA 4.0, attributed in the app.                                                                                                     |
| 7   | Uploads                             | **Curated corpus only.** No visitor uploads.                                                                                                                                                                  |
| 8   | Size / formats / languages          | **Small, English only.** The source is JSON; about 1.2k paragraphs become roughly 2–6k chunks per chunk size.                                                                                                 |
| 9   | Visible stages (all required in v1) | Query embedding placed on the **2D PCA map** · **BM25 vs vector** side by side, plus the fused list · **rerank before/after** · the **exact prompt** with tokens and cost · a **cited answer**                |
| 10  | Visitor controls                    | **top-k** · **retrieval mode** (BM25 / vector / hybrid RRF) · **reranker on/off** · **chunk size** (picked from sizes pre-built at ingest) · plus **agentic mode** (see 12). The model is chosen server-side. |

### Teaching features

| #   | Question                        | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Reranker                        | **Voyage `rerank-2.5-lite`.** Voyage also supplies embeddings (`voyage-3.5-lite`), so there is one extra API key.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 12  | Agentic retrieval               | **Full agentic mode in v1**: query rewriting plus multi-step search as a Claude tool-use loop, and every tool call is its own trace stage. SQuAD questions are single-hop, so we add **about 10 compound, cross-article demo questions** where multi-step search clearly helps. They also go into the eval set.                                                                                                                                                                                                                        |
| 13  | RAG off-vs-on / failure gallery | **Neither in v1.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 14  | Eval dashboard                  | **Public dashboard** showing recall@k and MRR (per retrieval mode × chunk size × rerank), faithfulness (Claude as judge), and the abstention rate on unanswerable questions. **Golden set:** about 150 SQuAD dev questions mapped to chunks automatically, **about 20 written by the owner**, and the ~10 compound questions. Evals run offline in `/evals`, which publishes a static JSON the site renders.                                                                                                                           |
| 15  | Live queries & rate limits      | **Changed by the owner (2026-09-28): pre-recorded questions only; extended to Scope (2026-10-29).** Scope works the same way: visitors pick from about 20 example messages per preset, each recorded once with the real models (Voyage embedding, Claude Haiku judge, the answers), with and without its conversation context; weights, thresholds, signal toggles, context, preset and edits to the scope definition are recomputed from the recorded output at no model cost (an edited rubric skips the judge and says why). The per-IP request check runs live on both products. For RAG: Visitors pick from 15 questions (5 single-article, 10 compound); each was recorded once with the real models at every setting (mode × top-k 3/5/10 × chunk size × reranker, plus agentic mode for the compound ones), and the page replays the recorded trace. No model is called per visit. The request step is still checked live (20 per minute, 200 per day per IP) and says when the run was recorded. `LIVE_QUERIES=true` restores free-text live questions. |

### Design & scope

| #   | Question                          | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | Design direction                  | **Calm lab notebook**, rendered as an _engineer's computation pad_ (chosen in the Impeccable direction round, seed `cfb983fc`). See `DESIGN.md`.                                                                                                                                                                                                                                                                                                                                                      |
| 17  | Relation to highnet.at            | **Independent.** Only a text link back.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 18  | Layout / theme / motion           | **Mobile-first**, **light and dark** themes (follows the system setting, with a toggle), **subtle** motion that respects `prefers-reduced-motion`.                                                                                                                                                                                                                                                                                                                                                    |
| 19  | Budget                            | **$20/month for Claude + Voyage combined, with a hard stop.** The app tracks spend per call in SQLite. At **80%**, agentic mode and the demo model are switched off and a banner explains why. At **100%**, live queries stop until the next month (UTC), and the explorer says so plainly. Matching spend limits are also set in the Anthropic and Voyage consoles. Eval runs are paid by the owner locally and are not counted against the visitor budget. Their cost is reported with the results. |
| 20  | Timeline / out of scope / licence | **No deadline**: milestones ship when ready. **In scope since 2026-10-29: Scope**, a second product (see the Scope section below). **Out of scope:** accounts/auth, uploads, saved history, i18n, other corpora, RAG off-vs-on, failure gallery, Postgres, multiple regions, local ML models (the storage interface stays, so pgvector can be added later), free-text Scope messages on the public site (`SCOPE_LIVE=true` exists for local use). **Licence: MIT**; the corpus keeps CC BY-SA 4.0; Scope's labeled prompts are Claude-drafted and MIT like the code.                                                                                                                                                                                |

### Product and voice (Impeccable init)

- Name: **Highnet Safe LLM Tools** (title case; owner decision 2026-10-29), with two products, **RAG** and **Scope**. Product descriptions say "the RAG pipeline", not "the highnet-rag pipeline".
- Voice: a **precise lab partner**. Plain, exact, first-person plural, no hype. It names trade-offs and says when a step failed. Numbers beat adjectives.
- Accessibility: **WCAG 2.2 AA**.

## Fixed stack

Changing any of this needs the owner's approval.

- **Frontend:** Next.js App Router + TypeScript as a static export (`output: 'export'`), Tailwind CSS v4, shadcn/ui primitives restyled to DESIGN.md. Impeccable is the design authority; default shadcn styling never ships.
- **Backend:** Python, FastAPI, Pydantic, managed with uv. The API allows the web origins by CORS (see Hosting).
- **LLM:** Claude via the Anthropic Python SDK. Model names come from env vars:
  - cheap model for live traffic and development: default `claude-haiku-4-5`;
  - stronger model for demos: default `claude-opus-5`;
  - judge model for evals: default `claude-sonnet-5`.
- **Embeddings:** API only (Voyage). The 2D map uses PCA in numpy, fitted at ingest time.
- **Storage:** SQLite on a Fly volume, with sqlite-vec for vectors and FTS5 for BM25, behind a storage interface.
- **Streaming:** SSE with one trace event per pipeline stage.
- **Hosting (changed by the owner, 2026-09-28):**
  - The **web app** (static export) is deployed on **Vercel**.
  - The **API** stays on **Fly.io**: one app in region `fra`, shared-cpu-1x (512MB), scaled to zero, secrets via `fly secrets`, SSE unbuffered.
  - Two origins, so the API allows the Vercel production domain and preview deployments by CORS. This replaces the original single-origin setup.
- **Ingestion** runs locally, and the built SQLite file is uploaded to the volume.
- **Code layout (2026-10-29):** a uv workspace with a shared package `highnet-core` (providers, pricing, budget, trace, storage base, SSE), the RAG API `highnet-rag` (package `highnet_rag`, unchanged name and endpoints), Scope `highnet-scope` (package `highnet_scope`, its own `scope.sqlite`), and the evals. One FastAPI app on one Fly machine serves both products; one budget ledger covers both.
- **Names (owner decision 2026-10-29):** the GitHub repository is `highnet/highnet-safe-llm-tools`, the Vercel project and domain `highnet-safe-llm-tools` (`highnet-safe-llm-tools.vercel.app`, the old `highnet-rag.vercel.app` redirects), and the Fly app `highnet-safe-llm-tools`. The Python packages keep their names.

## Tooling (Phase 0)

- Conventions from `highnet/config`: AGENTS.md, CLAUDE.md, Prettier, EditorConfig, ESLint and tsconfig (added in `/web`), `.nvmrc` (Node 22.22.2).
- Python: Ruff (lint + format, line length 100) and pyright (basic).
- shadcn components are renamed to PascalCase and rewritten to the AGENTS.md rules.
- graphify is optional tooling, with its hooks enabled.
- Impeccable skill, agents and design-detector hooks are installed in `.claude/`.

## Additional owner decisions (2026-09-28)

- **Deploy target:** web on Vercel, API on Fly (see Hosting).
- **Mobile:** avoid very long pages. On phones each step folds to one line (title, key value, status) and expands on tap.
- **Live code:** every step has a collapsible code excerpt highlighted with highlight.js. The source files are the single source of truth: excerpts are extracted from marked regions at build time and never copied by hand.
- **Coverage:** 100% line and branch coverage for the Python packages and the web app, enforced in CI.
- **Conventions:** the Python conventions are also added to `highnet/config` for future projects.

## Scope (owner decisions, 2026-10-29)

| #   | Question            | Decision |
| --- | ------------------- | -------- |
| S1  | Concept             | A product agent guards its scope. A message (optionally with earlier turns) runs through 11 traced steps and ends in **answer** (in scope), **answer briefly** (adjacent), **redirect** (off scope: a warm pivot back, never a cold refusal) or **block** (prompt injection or abuse). |
| S2  | Presets             | Four, each with an editable scope definition (topics in / adjacent / out, with examples): **career agent** (default), **recipe assistant**, **bank support bot**, **RAG corpus assistant** (its scope is defined by the 35 SQuAD articles; a factual question outside them is in scope, and RAG then abstains). |
| S3  | Dataset             | About 300 labeled prompts per preset (1,200), drafted by Claude across in / adjacent / out / injection with hard edge cases, stored as JSONL golden files and labelled as Claude-drafted on the site. Embedded with `voyage-3.5-lite`; a PCA per preset is fitted at ingest. |
| S4  | Pipeline            | Request check · conversation context · rule prefilter · embed · map · kNN vote · LLM judge (Claude Haiku, strict JSON validated with Pydantic; the message is data inside delimiters and never followed) · weighted fusion · thresholds · action and response (hard length caps) · audit record. |
| S5  | Recorded runs only  | See #15. |
| S6  | Evals               | Rules, kNN (leave-one-out), the judge and the fused pipeline over the labeled set: per-class precision and recall, confusion matrices, false refusal and over-compliance rates, a threshold sweep, cost and latency per method. Results in `evals/results/scope/`. |
| S7  | Principles shown    | Off scope and prompt injection are different problems (product design vs security); redirect warmly and measure false refusals as seriously as attacks that get through; filters alone fail against adaptive attackers, so real safety comes from architecture (least privilege, documents as data, untrusted content kept away from tools: the Dual LLM pattern and CaMeL). |

## Open items (not blocking milestone 1)

- The owner writes about 20 golden questions before milestone 6.
- Confirm Voyage and Claude prices at build time; they live in one pricing table, overridable by env var.
- Settle the phone form of the 2D map (scaled plot or table first) during milestone 4.
- Scope's default fusion weights and thresholds were fixed before the first eval run and not tuned on it. In that run the judge alone beats the fused default (the average dilutes the judge's confident injection calls). Whether to change the defaults, or fuse injection by maximum instead of by average, is the owner's call; any change should be measured on a held-out split.
