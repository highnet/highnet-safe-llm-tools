---
version: 1
slug: 'web-app-page-tsx'
primary_target: 'web/app/page.tsx'
related_targets: ['web/components/landing', 'web/components/site', 'web/content/landing.ts']
---

# Surface: Highnet Safe LLM Tools landing (`/`)

Scope: the site's opening page. Says what Highnet Safe LLM Tools is, introduces its two products (RAG and Scope) by their real step chains, shows how they fit together on two recorded questions, and states the argument both tools make. Visitor mode: **Persuade**, with a Read layer (the worked questions).

- Audience and job: developers and recruiters arriving at the root. The job is to understand in one screen that the site is two open lab tools that show every step, then choose one.
- Action: "Open the RAG pipeline" or "Open Scope" (primary buttons); pencil links to each product's evals, to the recorded Scope and RAG runs of the two worked questions, and to Scope's principles.
- Proof and content: the step chains are read from the products' own step lists (`content/stages.ts`, `content/scope-stages.ts`); the Scope verdicts and judge readings are read from `lib/generated/scope-verdicts.json`. Nothing on the page is typed in by hand as a number.
- Constraints: static export; mobile-first; WCAG 2.2 AA; no hero image, eyebrow or metric strip; class marks always beside their word.

## Direction contract

THESIS: The landing page is the cover sheet of the same computation pad: it shows the two products as the calculations they are, not as feature cards.

OWN-WORLD: As DESIGN.md. Reuses the Display headline, raised sheets, numbered step boxes joined by chevrons, the outlined "=" result box and the class marks.

STORY: The visitor reads that both tools write out every step, sees each product's real steps end in its result, then watches one question pass through Scope and RAG in turn and comes away with the argument: off scope and injection are different problems, and false refusals count as failures.

FIRST VIEWPORT: The Display headline "Safe LLM systems, worked out step by step." and the intro paragraph, then the RAG product sheet (name, tagline, lede, pencil takeaway, actions, step chain ending in "= Cited answer").

FORM: engineer's computation pad, as DESIGN.md. Product sheets under solid rules; "How they fit together" as two worked-question sheets on raised paper with numbered lines 01 Scope / 02 RAG / = Outcome; the principles as a solid-ruled list on bare paper.
