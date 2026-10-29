import { SCOPE } from '@/content/scope';
import { SCOPE_ACTIONS } from '@/content/scope-verdict';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';

import type {
  AuditData,
  ContextData,
  Distribution,
  EmbedData,
  FuseData,
  JudgeData,
  KnnData,
  Label,
  MapData,
  RequestData,
  RulesData,
  SkippedData,
  ThresholdsData,
} from './types';

const S = SCOPE.summary;

const top = (d: Distribution): Label =>
  (Object.keys(d) as Label[]).reduce((a, b) => (d[b] > d[a] ? b : a));

// The one-line result each step shows when folded on a phone.
export const scopeSummary = (event: ScopeTraceEvent): string => {
  const data = event.data;
  if (event.status === 'skipped') return (data as SkippedData).reason;
  switch (event.stage) {
    case 'request': {
      const d = data as RequestData;
      return d.error ? d.error.message : S.request(d.chars, d.language);
    }
    case 'context':
      return S.turns((data as ContextData).turns.length);
    case 'rules': {
      const d = data as RulesData;
      return d.abstained ? S.abstained : S.rules(d.hits.length, SCOPE.pct(d.injection_score, 0));
    }
    case 'embed':
      return S.embed((data as EmbedData).dims);
    case 'map': {
      const d = data as MapData;
      return S.map(d.x.toFixed(3), d.y.toFixed(3));
    }
    case 'knn': {
      const d = (data as KnnData).distribution;
      const label = top(d);
      return S.knn(SCOPE.labels[label], SCOPE.pct(d[label], 0));
    }
    case 'judge': {
      const d = data as JudgeData;
      return d.verdict
        ? S.judge(SCOPE.labels[d.verdict.label], d.verdict.confidence.toFixed(2))
        : S.judgeError;
    }
    case 'fuse': {
      const d = data as FuseData;
      return S.fuse(SCOPE.labels[d.label], SCOPE.pct(d.confidence, 0));
    }
    case 'thresholds': {
      const d = data as ThresholdsData;
      return S.thresholds(SCOPE_ACTIONS[d.action].text, d.scope_score.toFixed(2));
    }
    case 'respond':
      return S.respond(SCOPE_ACTIONS[(data as ThresholdsData).action].text);
    default:
      return S.audit((data as AuditData).record.needs_review);
  }
};
