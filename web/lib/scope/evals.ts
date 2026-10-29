import latest from '@/lib/generated/scope-evals-latest.json';
import type { MethodResult, ScopeEvalResults } from '@/lib/generated/scope-evals';
import { REPO_URL } from '@/lib/snippets';

// Scope's published eval run, copied in at build time by `npm run gen:evals` (null before the
// first run). Every number on /scope/evals/ and /scope/coverage/ comes from this file.
export const publishedScopeResults = latest as ScopeEvalResults | null;

export const methodOf = (results: ScopeEvalResults, method: MethodResult['method']) =>
  results.methods.find((m) => m.method === method);

// The per-prompt details file that sits next to latest.json in the repository.
export const scopeDetailsUrl = (startedAt: string) =>
  `${REPO_URL}/blob/main/evals/results/scope/${startedAt.slice(0, 10)}.details.jsonl`;

// The dataset page's link to one prompt (its search box takes the id).
export const datasetHref = (preset: string, id: string) =>
  `/scope/dataset/?preset=${encodeURIComponent(preset)}&q=${encodeURIComponent(id)}`;
