---
version: 1
slug: 'web-app-scope-page-tsx'
primary_target: 'web/app/scope/page.tsx'
related_targets: ['web/components/scope', 'web/content/scope.ts', 'web/content/scope-stages.ts']
---

# Surface: Scope pipeline explorer (`/scope/`)

Scope: Sheet 1 of Scope, the product's main surface. Pick a preset and a message, watch the guard work it out in twelve steps (request, context, rules, embed, map, nearest neighbours, LLM judge, decision model, fuse, thresholds, respond, audit) and read the one action it chooses: answer, answer briefly, redirect or block. Visitor mode: **Operate**, with a Read layer (hero definition, principles, "Why this step?" notes).

- Audience and job: developers building LLM agents, then recruiters. The job is to see how a scope guard decides, which signal pulled which way, and what changing a weight, threshold or topic does.
- Action: pick a recorded example → read the replayed steps and the action → change a setting or move a topic in the scope definition (it replays at once). Under the RAG corpus assistant preset, "Scope first, then RAG" replays the World Cup and lasagna questions and links to RAG.
- Proof and content: config and recorded runs from `/api/scope/config` and the Scope trace stream; every score, token and cost comes from the trace. A note-tone notice says the runs are recordings and when they were made, or that the data is illustrative.
- Constraints: static export; SSE stream; mobile-first; WCAG 2.2 AA; settings and example kept in the URL (`?preset=&example=`); classes and actions always as shape plus word.

## Direction contract

THESIS: A message is checked the way a question is answered on the RAG page: worked out on the same computation pad, every signal written down before the action.

OWN-WORLD: As DESIGN.md. Reuses RAG's hero, diagram, step sheets, margin notes, figures and answer line; adds the four class inks (aliases of the data inks) with their shapes.

STORY: The visitor sees three independent signals disagree, watches fusion and two thresholds turn them into one action, and learns that refusing a good message is a failure too.

FIRST VIEWPORT (Every step): The hero: Display headline "Watch an AI agent decide whether a message is in scope, step by step.", the "Scope guard" definition, intro, "Try a message" / "Browse the labeled prompts", and the Scope diagram as the picture on the right; phones stack them. Below: "What we hold to", then "Sheet 1 · <message>", the replay notice, the picker and settings, and the twelve numbered steps.

FORM: engineer's computation pad, as DESIGN.md.

SIMPLE VIEW: For non-experts, and the default (`?view=steps` opens every step). Owner feedback (2026-10-29): "drop downs are bugged" and "too dense, no one will read it", so Simple is one short page: the h1 "Will the assistant answer?", the four products as chips, the messages as picker cards (one per action first, from `SCOPE.featured`, chosen by each message's recorded action under the default settings; the rest behind "More messages (N)"; every card one clean line, markup and line breaks stripped for display), then one card: the message (two lines at most), the action as a large class tag and one plain sentence of why. "See how it decided" switches to every step and scrolls to the working; one muted line says the run is recorded and no AI is called. Who voted, the combined vote, the reply, the replay notice, the hero, the diagram, the bridge, the settings and the principles live in every step only. Every number still comes from the trace; no jargon.

FIRST VIEWPORT (Simple, phone): header with the product switcher and its view toggle, the h1, the product chips, four message cards and the decision (about 660px down on 390×844); the whole page is under two screens with the footer.

## Distilled (owner, 2026-10-29)

Owner feedback: "The whole thing is too dense with information, no one will read it." Direction chosen by the owner, no interview: progressive disclosure, one idea per step or section. Nothing was deleted and every number is still read from the trace or the eval JSON; it moved behind pencil disclosures (`components/ui/Disclosure`, closed by default, `aria-expanded`, never persisted).

- Every step: the same StepSheet rule as RAG (`lib/scope/lead.ts`, words in `content/scope-stages.ts`). Figures by default: rules (injection bar), embed, map, kNN vote, fusion, thresholds; the rest under Details. The rule step's sentence separates attack patterns from scope keywords; the request step names the guessed language.
- Hero intro is one sentence; the replay notice is two. "What we hold to" shows the three claims; reasoning and sources open under "Read the reasoning".
- Simple view unchanged.

