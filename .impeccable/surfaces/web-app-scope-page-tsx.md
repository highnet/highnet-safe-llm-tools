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

SIMPLE VIEW: For non-experts, and the default (`?view=steps` opens every step; with no message linked the first example plays). The switch lives in the header: the Scope segment of the product switcher carries "Simple · Every step" as a nested radiogroup ("Scope view"), so it is the first control on a phone. Simple puts the result near the top: a plain h1 question and one-sentence intro, the product and message as two native selects, then the plain-words sheet with "What the assistant does" first (on a 390×844 phone it starts about 540px down), then the message, who voted (checklist, similar messages, AI judge, decision model, each with its lean and how sure), the combined vote and the reply, with "Show every step" and "Change the settings" one click away. The replay notice, the hero, the diagram (desktop only) and the principles follow below. Every number still comes from the trace; no jargon.

FIRST VIEWPORT (Simple, phone): header with the product switcher and its view toggle, the plain question, the two selects, and the outcome.
