# Highnet Safe LLM Tools — Milestones

There is no deadline; each milestone ships when its acceptance criteria pass. M1–M6 built RAG (as highnet-rag); S1–S4 add Scope and the umbrella site. Every milestone ends with:

- CI green, the API deployed to Fly and the web app to Vercel;
- a short demo note in the README changelog;
- for UI work, Impeccable `audit` and `polish` passes with **zero detector findings**.

## M1 · Walking skeleton: one question, fully traced, live

**Demo:** open the Vercel URL on a phone, ask "What is the Norman conquest?" and watch the steps being filled in (embed → vector search → context → prompt → answer with citations), each with its "Why this step?", ms, tokens and cost.

Acceptance criteria:

- [ ] Layout in place: `/web`, `/api`, `/evals`, `/docs`, `Dockerfile`, `fly.toml`, `.env.example` listing every variable, and no hard-coded keys.
- [ ] `highnet-rag ingest` builds `corpus.sqlite` from SQuAD 2.0 dev: load → chunk (`medium` set) → Voyage embed → store (FTS5 table created, sqlite-vec index) → PCA fitted and stored, with chunk metadata (doc, order, char offsets, tokens, x/y).
- [ ] `GET /api/query` streams SSE: one `trace` event per stage (`request`, `embed_query`, `map_project`, `vector`, `select_context`, `prompt`, `generate`, `citations`), then `done`. Stages not built yet emit `skipped` with a reason.
- [ ] A Pydantic `TraceEvent` with the fields from ARCHITECTURE §4; the JSON Schema is exported and the TS types generated.
- [ ] Budget and rate limiting are live from day one: spend ledger, $20 hard stop, 20/min and 200/day per IP, all visible in the `request` stage.
- [ ] The frontend pipeline view renders trace events as live step cards, each with a plain-language "Why this step?", following DESIGN.md (the computation pad) in light and dark themes, mobile-first.
- [ ] shadcn primitives are restyled and renamed per AGENTS.md; `Button` and `Typography` CVA components exist.
- [ ] Tests: pytest (chunking, PCA projection, tracer, SSE endpoint with fake providers, budget stop) and a Vitest smoke test (SSE fixture → every stage renders).
- [ ] GitHub Action: test (100% coverage), then `fly deploy` of the API on push to `main`; the web app deploys through Vercel's GitHub integration.
- [ ] Every step has a collapsible live code excerpt, extracted from the Python source at build time and highlighted with highlight.js.
- [ ] On phones, steps fold to one-line rows so a full run stays short.
- [ ] README: local setup in under 5 commands, plus deploy steps.
- [ ] Impeccable finish: audit and polish, zero detector findings, and DESIGN.md re-documented from the built UI (the seed marker removed).

## M2 · Hybrid retrieval and the settings strip

**Demo:** run the same question in BM25, vector and hybrid modes. The two ranked lists sit side by side, the RRF fusion shows where each chunk came from, and changing the chunk size (small/medium/large) visibly changes what is retrieved.

Acceptance criteria:

- [x] Ingest builds all three chunk sets. FTS5 BM25 search is filtered by chunk set, and `bm25` shows the exact MATCH string.
- [x] `fuse` implements RRF (k = 60) with per-chunk contributions.
- [x] Settings strip: mode, top-k (1–10), chunk size. On phones it folds to a one-line summary (the "drawer"); state is kept in the URL, so traces can be shared by link.
- [x] `RankTable` shows the BM25 and vector columns side by side at ≥ `lg`, and stacked (folded) below that. Rank badges use data colours plus marker shapes.
- [x] Changing any setting and re-running changes the trace (tested).
- [x] The background grid is gone at the owner's request; the pad is plain paper.

## M3 · Visual aids: a picture for every step

**Why:** the numbers are all there after M2, but a newcomer still has to read tables to see what happened. Each step gets one small figure, drawn from this run's own trace, that shows the idea at a glance. The owner asked for this milestone.

**Demo:** run one question and, without reading code or tables, say what each step did: the question turning into a vector, which words BM25 matched and how much each weighed, where the passages fall on a distance line, how the two rankings fed the fused list, how full the context window is, and where the tokens and cents went.

Acceptance criteria:

- [x] Each step has one explanatory figure next to its numbers, built from the trace (no invented values; anything schematic is labelled schematic):
  - `request`: rate-limit and budget meters.
  - `embed_query`: the shown dimensions as a strip of signed values, with the norm.
  - `bm25`: the question with matched terms highlighted and each term's weight (IDF). The trace gains per-term document frequencies.
  - `map_project` keeps its coordinates until the drawn corpus map lands in M4.
  - `vector`: distances on a 0 to 1 number line, with the kept passages marked.
  - `fuse`: stacked contribution bars (BM25 part plus vector part) per fused passage, with the top-k cut.
  - `select_context` and `prompt`: a context-window bar split into system, passages and question tokens, against the model's window and the worst-case cost.
  - `generate` and `citations`: answer sentences linked to the passages they cite; uncited passages shown as unused.
- [x] Figures are SVG or HTML in DESIGN.md's data colours and marker shapes, have a text alternative carrying the same numbers, respect reduced motion, and fold with their step on phones, so a run stays short.
- [x] A one-line "how to read this" caption wherever a figure needs one.
- [x] Tests render every figure from fixture data; coverage stays at 100%; Impeccable finish with zero detector findings.

## M4 · Reranking and the corpus map

**Demo:** turn the reranker on; the rank table settles as rows move into their reranked positions, with the up/down deltas labelled. The 2D map shows the corpus, and the query's point lands among its nearest chunks.

Acceptance criteria:

- [x] The `rerank` stage (Voyage `rerank-2.5-lite`) emits before/after lists with relevance scores and the rank changes. Off by default (owner's choice); a toggle in the settings strip and `rerank=1` in the link switch it on.
- [x] `/api/corpus/map` plus a `CorpusMap` plot: retrieved chunks highlighted, the query projected with the stored PCA, the explained variance shown honestly. Changed from "points coloured by document": 35 articles cannot be told apart by colour, so dots stay graphite and pointing at one lights up its whole article.
- [x] The map has a keyboard-accessible table alternative; phones get the scaled plot (owner's choice).
- [x] Reduced motion: rank changes appear without animation.

## M5 · Agentic retrieval

**Demo:** ask a compound question ("Which came first, the founding of … or …?"). The agent plans, rewrites the question into sub-queries, searches twice, and answers with citations from both articles. Every tool call is a numbered sub-step (3a, 3b, …) nested in one "Search, step by step" sheet (owner's choice).

Acceptance criteria:

- [x] Manual Claude tool-use loop with `search` and `answer` tools. Each search's retrieval stages carry `parent` = their `agent_step` label; the loop is capped by `AGENT_MAX_STEPS`, `AGENT_TOKEN_CAP`, a per-turn output cap, a turn limit and the budget guard, and every cap (and which one stopped the loop) is visible in the trace. The context, prompt and answer stages run as usual on the passages found.
- [x] Agentic mode is disabled in the `degraded` budget tier, with an explanation (the classic pipeline answers instead).
- [x] 10 compound demo questions are written, reviewed by the owner, offered as suggestions in agentic mode, and stored in `evals/golden/compound.jsonl`.
- [x] Tests: the agent loop with a scripted fake Claude (multi-step, max-steps cutoff, token and budget caps, tool errors, failed searches, model failures).

## M6 · Evals dashboard and finish

**Demo:** `/evals` shows recall@k and MRR for each retrieval mode, chunk size and rerank setting, faithfulness, and the abstention rate on unanswerable questions, with the run date and the cost of the eval run. The pipeline page links "how good is this configuration?" to the matching row.

Acceptance criteria:

- [x] Golden sets: `squad_auto` (150, auto-mapped) and `compound` (10) are in; `owner` is left for the owner to write (the dashboard shows it as "not written yet").
- [x] `uv run highnet-rag-evals run` computes the metrics, writes `evals/results/latest.json` and a dated copy, and prints its cost. The Evals workflow runs it against the live corpus.
- [x] The `/evals` page renders only numbers present in the JSON, with methodology notes ("what recall@5 means").
- [x] Full Impeccable finish on every page: critique, audit, polish, a finish-reviewer verdict of `ship`, and DESIGN.md current.
- [x] Accessibility pass: keyboard-only walkthrough, screen-reader announcement check, AA contrast in both themes (axe-core WCAG 2.2 AA: 0 violations on every page, both themes, 390 and 1440; no horizontal scroll at 320).

## S1 · Highnet Safe LLM Tools: one site, two products

**Demo:** open `/` and see both tools introduced by their real step chains; switch between RAG and Scope in the header; an old link such as `/?q=…&mode=hybrid` or `/evals/` lands on the same page under `/rag/`.

Acceptance criteria:

- [x] The visible brand is Highnet Safe LLM Tools (header, landing page, titles and metadata, share cards, JSON-LD, sitemap, README, docs); "the RAG pipeline" in product descriptions.
- [x] RAG moves under `/rag/` (pipeline, corpus, evals, coverage); `web/vercel.json` adds permanent 308 redirects from the old paths, and `/` with a `q` parameter goes to `/rag/` with the query kept.
- [x] A shared landing page; a RAG | Scope switcher in the header; metadata, share cards, sitemap and robots for both products.
- [x] A shared Python package `highnet-core` (providers, pricing, budget, trace, storage base, SSE, PCA); `highnet_rag` keeps its name and `/api/query`.
- [x] No RAG regression: retrieval evals before and after on the same corpus file, within the run-to-run noise of the Voyage API.
- [x] The GitHub repository, the Vercel project and domain, and the Fly app are renamed to `highnet-safe-llm-tools` (owner decision); the README says what the rename touched.

## S2 · Scope: dataset, pipeline and recordings

**Demo:** pick "Write a Fibonacci function in Python" under the career agent: it is redirected; switch the conversation context on ("I have a coding interview tomorrow") and it is answered briefly. Pick the same lasagna question under the career agent and the recipe assistant and get different actions.

Acceptance criteria:

- [x] 1,200 labeled prompts (300 per preset) across in / adjacent / out / injection with hard cases (multilingual, benign injection words, polite and encoded injections, hidden text, extraction, borderlines, context-dependent rows), as JSONL golden files, validated against their preset and labelled Claude-drafted.
- [x] `highnet-scope ingest` embeds them with `voyage-3.5-lite` and fits a PCA per preset into `scope.sqlite`.
- [x] Eleven steps, one trace event each, with status, timing, tokens and cost; skips and failures say why.
- [x] The LLM judge replies in strict JSON validated with Pydantic; an invalid reply fails the step and drops out of the fusion; the message is data inside delimiters.
- [x] About 20 example messages per preset, including every required case, recorded once with the real models, with and without context; settings, toggles and definition edits recompute at no model cost; an edited rubric skips the judge with the stated reason.
- [x] Rate limit live on every replay; answers capped hard in tokens and characters; spend through `pricing.py` and the shared ledger.
- [x] Python tests at 100% line and branch coverage, fake providers only.

## S3 · Scope: the four pages

**Demo:** `/scope/` replays the eleven steps (twelve since S5) with a figure each; `/scope/dataset/` filters the 1,200 prompts; `/scope/evals/` compares the four methods; `/scope/coverage/` shows where the dataset is thin and where the pipeline was wrong.

Acceptance criteria:

- [x] `/scope/`: the walkthrough, a pipeline diagram, the principles (off scope vs injection, warm redirects and false refusals, architecture over filters with the Dual LLM pattern and CaMeL), and the same pipeline as formulas.
- [x] `/scope/dataset/`, `/scope/evals/` and `/scope/coverage/` render only numbers from the committed data and results.
- [x] RAG's first step shows Scope's recorded verdict for its question, linked to the full breakdown; the landing page explains in scope but not in the corpus versus off scope.
- [x] Phone width: steps fold to one line, no horizontal scroll at 320 px; WCAG 2.2 AA in both themes; reduced motion respected.
- [x] Web tests at 100%; `impeccable detect` reports zero findings; the finish review has run.

## S4 · Scope: evals

Acceptance criteria:

- [x] `highnet-scope-evals run` scores rules, kNN (leave-one-out), the judge and the fused pipeline: per-class precision and recall, confusion matrices, false refusal and over-compliance rates, a threshold sweep, cost and latency per method; results in `evals/results/scope/`.
- [ ] Decide whether to change the fusion defaults (open owner item: the judge alone beat the fused default in the first run); measure any change on a held-out split.

## S5 · Scope: a second judge (decision model)

Owner decision (2026-10-29): add `typesafe-ai/jev`, a decision model through Vercel AI Gateway, as a second judge beside Claude Haiku.

Acceptance criteria:

- [x] A traced `decide` step (08) answers one typed `choice` question built from the scope definition and returns a probability per label; a reply without every label fails the step and drops it from the fusion. Skipped, with the reason, when switched off, after an edit, or on budget.
- [x] Fusion takes four signals (default weight 0.4 for the decision model, equal to the judge, untuned); the evals score it as its own method and in the fused pipeline.
- [ ] Every example recorded with the decision model (replayed on visits; no call per visit); evals rerun with the judge's cached calls, so only the decision model's calls are paid (cap $0.50).
- [ ] The step sheet, settings (toggle and weight), fusion, diagram, evals page, RAG's verdict note and the landing page show the second judge; 100% coverage; `impeccable detect` reports zero findings.
