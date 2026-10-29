import recorded from '@/lib/generated/scope-verdicts.json';

import type { ScopeAction } from '@/content/scope-verdict';

// The default-settings Scope run of each message under the RAG corpus assistant preset,
// exported from the recordings by `highnet-scope export` (never written by hand).
export type ScopeVerdict = {
  example_id: string;
  action: ScopeAction;
  scope_score: number;
  p_injection: number;
  label: string;
  confidence: number;
  judge: { label: string; confidence: number; reason: string } | null;
  ms: number;
  cost_usd: number;
};

type Recorded = {
  recorded_at: string | null;
  verdicts: Record<string, ScopeVerdict>;
  examples: Record<string, ScopeVerdict>;
};

const data = recorded as Recorded;

export const verdictForQuestion = (questionId: string): ScopeVerdict | undefined =>
  data.verdicts[questionId];

export const verdictForExample = (exampleId: string): ScopeVerdict | undefined =>
  data.examples[exampleId];

// The Scope page's link for one recorded example under the RAG corpus assistant preset.
export const scopeRunHref = (exampleId: string): string =>
  `/scope/?preset=rag&example=${encodeURIComponent(exampleId)}`;
