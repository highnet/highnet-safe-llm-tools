import type { StageCopy } from '@/content/stages';
import type { Stage as ScopeStage } from '@/lib/generated/scope-trace';

// English copy for Scope's twelve steps. Voice: the same precise lab partner as the RAG pipeline.
// Plain, exact, first-person plural, no hype; name trade-offs and say when a step is weak.

export const SCOPE_STAGE_ORDER: ScopeStage[] = [
  'request',
  'context',
  'rules',
  'embed',
  'map',
  'knn',
  'judge',
  'decide',
  'fuse',
  'thresholds',
  'respond',
  'audit',
];

export const SCOPE_STAGES: Record<ScopeStage, StageCopy> = {
  request: {
    title: 'Check the request',
    why: 'First the cheap checks: the message’s length, its language, and how many requests this visitor sent lately. A message that fails one stops here with the reason.',
    detail:
      'The language guess counts common words; it labels the run and never refuses a language. The rate limit and budget share the RAG pipeline’s ledger, keyed by a salted hash of your IP.',
  },
  context: {
    title: 'Add the conversation',
    why: 'The same words mean different things after different turns, so we read the message together with up to four earlier ones. Switch context off to see the reading change.',
    detail:
      'The joined text is what gets embedded and what the judges see. Turns are data, exactly like the message: nothing in them is followed as an instruction.',
  },
  rules: {
    title: 'Run the rule prefilter',
    why: 'Fast, free regular expressions look for known attack phrasing and hiding tricks, and the scope definition’s keywords add a vote. When nothing fires, the rules abstain.',
    detail:
      'Each rule is searched in four views: raw, normalized (look-alike letters, zero-width characters, leetspeak), decoded (base64, hex, rot13) and hidden (HTML comments). Hits combine as P(injection) = 1 − ∏(1 − weight); a paraphrase evades them.',
  },
  embed: {
    title: 'Embed the message',
    why: 'Voyage turns the message into 1,024 numbers so we can compare it with the labeled examples by meaning. The call was recorded once and is replayed.',
    detail:
      'Model voyage-3.5-lite, input type “query”, as at ingest. The vector is replayed from scope.sqlite, keyed by the exact text embedded, so context off replays a different embedding.',
  },
  map: {
    title: 'Place it on the map',
    why: 'The labeled examples are drawn by class, and the message lands among them. Two axes keep only a few percent of the spread, so read it as a picture.',
    detail:
      'PCA fitted per preset at ingest over its 300 prompt vectors; the message is projected the same way. Map distances are not the cosine similarities the vote uses.',
  },
  knn: {
    title: 'Ask the nearest neighbours',
    why: 'The k most similar labeled prompts vote with their labels, weighted by similarity. Edit the scope definition and the vote changes, with no new embedding.',
    detail:
      'Weight max(cos, 0) over the preset’s unit vectors. In the evals each prompt is scored leave-one-out, so it never votes for itself.',
  },
  judge: {
    title: 'Ask the LLM judge',
    why: 'Claude Haiku reads the rubric and the message and must reply with one strict JSON object: label, confidence, reason. A reply that fails validation drops the judge out.',
    detail:
      'The message sits inside tags as data, and look-alike tags are neutralised first. The call was recorded with each preset’s original rubric, so editing the definition skips this step on replay.',
  },
  decide: {
    title: 'Ask a second judge',
    why: 'A decision model answers one typed question and returns a probability for every label, so there is no JSON to validate. The probabilities go straight into the fusion.',
    detail:
      'One criterion per label, built from the preset’s topics; a reply missing a label fails the step. Like the first judge, editing the definition skips it on replay.',
  },
  fuse: {
    title: 'Fuse the signals',
    why: 'We take the weighted average of the signals that ran; a skipped or failed one drops out. Each signal’s cost and time sit beside it.',
    detail:
      'P(label) = Σ wᵢ·Pᵢ(label) / Σ wᵢ over the active signals. Averaging can dilute one confident signal with two hesitant ones; the evals show where.',
  },
  thresholds: {
    title: 'Apply the thresholds',
    why: 'If P(injection) reaches the block line, the message is blocked. Otherwise a scope score from 0 to 1 falls into answer, answer briefly or redirect.',
    detail:
      'scope = (P(in) + ½·P(adjacent)) / (P(in) + P(adjacent) + P(out)). Defaults: block at 0.5, answer from 0.7, answer briefly from 0.4.',
  },
  respond: {
    title: 'Choose the action and respond',
    why: 'In scope gets a full answer, adjacent a short one, off scope a warm redirect and an injection a calm block. Answers are capped hard so the agent is no free chatbot.',
    detail:
      'Full answers: 300 tokens and 1,500 characters; brief ones: 120 and 500. For the RAG corpus assistant, an answer hands the question to the RAG pipeline.',
  },
  audit: {
    title: 'Log it for review',
    why: 'Every decision leaves a record a person can check. Low confidence, disagreeing signals and every block are flagged; here it is shown, not stored.',
    detail:
      'The message is kept only as a SHA-256 hash. A reviewer’s corrections grow the labeled set where the coverage map is thin.',
  },
};

// One plain sentence per step: what happened in this run. Every value is passed in from the
// trace (see lib/scope/lead.ts); a skipped step shows its own reason instead.
export const SCOPE_LEADS = {
  request: (chars: number, language: string) =>
    `Checks passed: ${chars.toLocaleString('en')} characters, most likely in ${language}.`,
  requestUnknown: (chars: number) =>
    `Checks passed: ${chars.toLocaleString('en')} characters, in a language we could not guess.`,
  context: (n: number) =>
    n === 0
      ? 'There are no earlier turns, so the message is read alone.'
      : `Read the message together with ${n} earlier ${n === 1 ? 'turn' : 'turns'}.`,
  rulesAbstained: 'No rule fired, so the rules abstain.',
  rules: (attacks: number, p: string) =>
    `${attacks} attack ${attacks === 1 ? 'pattern' : 'patterns'} found; the rules put the chance of an injection at ${p}.`,
  keywords: (n: number) =>
    `No attack pattern found; ${n} scope ${n === 1 ? 'keyword' : 'keywords'} matched.`,
  embed: (dims: number, model: string) =>
    `Turned the message into ${dims.toLocaleString('en')} numbers with ${model}.`,
  map: (points: number) =>
    `The message lands among this preset’s ${points.toLocaleString('en')} labeled prompts.`,
  knn: (k: number, label: string, share: string) =>
    `The ${k} most similar labeled prompts vote ${label} (${share}).`,
  judge: (label: string, confidence: string) =>
    `The LLM judge says ${label}, with confidence ${confidence}.`,
  judgeError: 'The judge’s reply failed validation, so it drops out.',
  decide: (label: string, p: string) => `The second judge says ${label}, with probability ${p}.`,
  decideError: 'The second judge gave no usable reply, so it drops out.',
  fuse: (label: string, share: string) => `Together the signals say ${label} (${share}).`,
  blocked: (p: string, block: string) =>
    `The chance of an injection, ${p}, reaches the block line at ${block}: block.`,
  thresholds: (score: string, action: string) =>
    `The scope score ${score} falls in the “${action}” band.`,
  respond: (action: string) => `Action: ${action}.`,
  handoff: (action: string) => `Action: ${action}. The question goes on to the RAG pipeline.`,
  audit: (reasons: string) => `Logged and flagged for review: ${reasons}.`,
  auditClean: 'Logged; nothing in this decision needs a second look.',
};
