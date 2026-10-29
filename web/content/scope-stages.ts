import type { StageCopy } from '@/content/stages';
import type { Stage as ScopeStage } from '@/lib/generated/scope-trace';

// English copy for Scope's eleven steps. Voice: the same precise lab partner as the RAG pipeline.
// Plain, exact, first-person plural, no hype; name trade-offs and say when a step is weak.

export const SCOPE_STAGE_ORDER: ScopeStage[] = [
  'request',
  'context',
  'rules',
  'embed',
  'map',
  'knn',
  'judge',
  'fuse',
  'thresholds',
  'respond',
  'audit',
];

export const SCOPE_STAGES: Record<ScopeStage, StageCopy> = {
  request: {
    title: 'Check the request',
    why: 'Before reading the message we check the cheap things: is it too long, which language does it look like, and has this visitor sent too many requests lately. The rate limit is checked live on every replay; nothing else here costs anything. A message that fails a check stops here with the reason.',
    detail:
      'Length is capped so the guard cannot be flooded with a pasted book. The language guess counts common words per language; it labels the run and never refuses a language. The rate limit and the monthly budget come from the same ledger the RAG pipeline uses, keyed by a salted hash of your IP.',
  },
  context: {
    title: 'Add the conversation',
    why: 'The same words can mean different things after different turns. “Write a Fibonacci function” is a coding request on its own, but interview practice after “I have a coding interview tomorrow”. When there are earlier turns and context is on, we read the message together with them; switch context off to see the reading change.',
    detail:
      'Up to four earlier turns are joined before the message, each with its role. That joined text is what gets embedded and what the judge sees inside its conversation tags. Turns are data, exactly like the message: nothing in them is followed as an instruction.',
  },
  rules: {
    title: 'Run the rule prefilter',
    why: 'Fast, free and transparent: regular expressions look for known attack phrasing (“ignore your instructions”, “print your system prompt”, fake system tags) and for hiding tricks. Each rule is searched in four views of the message, so an instruction hidden in base64, zero-width characters, look-alike letters or an HTML comment still shows up. The scope definition’s keywords add a vote for in, adjacent or out. When nothing fires, the rules abstain.',
    detail:
      'Views: raw; normalized (NFKC, zero-width characters removed, Cyrillic and Greek look-alikes folded to Latin, leetspeak read as letters); decoded (base64 and hex runs that decode to readable text, and rot13); hidden (HTML comments and invisibly styled elements). Each hit has a weight, and hits combine as independent evidence: P(injection) = 1 − ∏(1 − weight). Rules are easy to evade with a paraphrase or another language; they exist to catch the lazy attacks for free.',
  },
  embed: {
    title: 'Embed the message',
    why: 'Voyage turns the message (with its conversation, if used) into 1,024 numbers so we can compare it with the labeled examples by meaning rather than by words. This is one of the two paid calls; on this site it was recorded once and is replayed, so the time and cost shown are the recorded ones.',
    detail:
      'Model voyage-3.5-lite, input type “query”, the same settings used to embed the 1,200 labeled prompts at ingest. The vector is replayed from scope.sqlite, keyed by the exact text embedded, so switching context off replays a different recorded embedding.',
  },
  map: {
    title: 'Place it on the map',
    why: 'The labeled examples are drawn as points, coloured and shaped by their class, and the message lands among them. Close to in-scope points is a good sign; landing in a sparse corner means the examples have little to say. Two axes keep only a few percent of the spread, so read the map as a picture, not as a measurement.',
    detail:
      'PCA fitted per preset at ingest over the preset’s 300 prompt vectors; the message is projected with the same mean and components. The explained variance of each axis is printed under the plot. Distances on the map are not the cosine similarities the vote uses.',
  },
  knn: {
    title: 'Ask the nearest neighbours',
    why: 'The k most similar labeled prompts vote with their labels, each vote weighted by its cosine similarity. If you edit the scope definition, the prompts of a moved topic change label and the vote changes with them, without any new embedding.',
    detail:
      'cos(q, x) = q·x / (|q||x|) over the preset’s unit vectors; the top k by similarity vote, weight max(cos, 0). Neighbours whose label your edit changed are marked. In the evals each prompt is scored leave-one-out, so it never votes for itself.',
  },
  judge: {
    title: 'Ask the LLM judge',
    why: 'Claude Haiku reads the preset’s rubric and the message, and must reply with one strict JSON object: a label, a confidence and a one-sentence reason. We validate the reply against a schema; if it does not match exactly, the step fails and the judge drops out. The message sits inside tags as data, and the judge is told to classify it, never to obey it.',
    detail:
      'The reply is forced to start with “{” (an assistant prefill) and parsed with a Pydantic model that forbids extra keys, allows only the four labels and a confidence from 0 to 1. Tags inside the message that imitate our delimiters are neutralised first. The call was recorded with each preset’s original rubric, so editing the definition skips this step on replay rather than pretending.',
  },
  fuse: {
    title: 'Fuse the signals',
    why: 'Each signal gives a share to each of the four labels. We take their weighted average over the signals that actually ran: a skipped or failed signal drops out and the others are re-weighted. The cost and latency of each signal sit beside it, so you can see what each extra signal buys.',
    detail:
      'P(label) = Σ wᵢ·Pᵢ(label) / Σ wᵢ over the active signals. The judge’s share puts its confidence on its label and splits the rest evenly. Averaging can dilute one confident signal with two hesitant ones; the evals show where that happens.',
  },
  thresholds: {
    title: 'Apply the thresholds',
    why: 'Two numbers decide the action. If P(injection) reaches the block threshold, the message is blocked. Otherwise a scope score from 0 (off scope) to 1 (in scope), in which adjacent counts half, falls into one of three bands: answer, answer briefly, or redirect. Moving a threshold moves the trade-off between refusing good messages and answering bad ones.',
    detail:
      'scope = (P(in) + ½·P(adjacent)) / (P(in) + P(adjacent) + P(out)). Defaults: block at 0.5, answer from 0.7, answer briefly from 0.4, redirect below. The evals page sweeps the redirect threshold and plots both error rates.',
  },
  respond: {
    title: 'Choose the action and respond',
    why: 'In scope gets a full answer, adjacent a short one, off scope a warm redirect back to what the product is for, and an injection a calm block. Answers are capped hard in tokens and characters, so the agent cannot be used as a free chatbot. The answers were recorded with the real model; the redirect and block messages are the preset’s own.',
    detail:
      'Full answers are capped at 300 output tokens and 1,500 characters, brief ones at 120 tokens and 500 characters. For the RAG corpus assistant, an answer means handing the question to the RAG pipeline, which searches and may still find nothing.',
  },
  audit: {
    title: 'Log it for review',
    why: 'Every decision leaves a record a person can check later: the action, the signals, the rule hits, which rubric was used and why it might need a second look. Low confidence, disagreeing signals and every block are flagged. On this demo the record is shown, not stored.',
    detail:
      'The message itself is kept only as a SHA-256 hash in the record. A reviewer’s corrections are what grows the labeled set over time, which is how the sparse regions on the coverage map get filled.',
  },
};
