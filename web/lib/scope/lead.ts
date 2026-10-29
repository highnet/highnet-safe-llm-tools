import { SCOPE } from '@/content/scope';
import { SCOPE_LEADS as L } from '@/content/scope-stages';
import { SCOPE_ACTIONS } from '@/content/scope-verdict';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';

import { topLabel } from './summary';
import type {
  AuditData,
  ContextData,
  DecideData,
  EmbedData,
  FuseData,
  JudgeData,
  KnnData,
  MapData,
  RequestData,
  RespondData,
  RulesData,
  SkippedData,
  ThresholdsData,
} from './types';

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' });

// The one plain sentence a Scope step opens with: what happened in this run, from its event.
export const scopeLead = (event: ScopeTraceEvent): string => {
  const data = event.data;
  if (event.status === 'skipped') return (data as SkippedData).reason;
  const error = (data as { error?: { message: string } }).error;
  switch (event.stage) {
    case 'request': {
      const d = data as RequestData;
      if (error) return error.message;
      // "und" is the guesser's answer when no language's common words appear.
      return d.language === 'und'
        ? L.requestUnknown(d.chars)
        : L.request(d.chars, LANGUAGES.of(d.language) as string);
    }
    case 'context':
      return L.context((data as ContextData).turns.length);
    case 'judge': {
      const d = data as JudgeData;
      return d.verdict
        ? L.judge(SCOPE.labels[d.verdict.label], d.verdict.confidence.toFixed(2))
        : L.judgeError;
    }
    case 'decide': {
      const d = data as DecideData;
      return d.distribution && d.choice
        ? L.decide(SCOPE.labels[d.choice], d.distribution[d.choice].toFixed(2))
        : L.decideError;
    }
    default:
      break;
  }
  if (event.status === 'error') return (error as { message: string }).message;
  switch (event.stage) {
    case 'rules': {
      const d = data as RulesData;
      const attacks = d.hits.filter((h) => h.kind !== 'topic').length;
      if (attacks > 0) return L.rules(attacks, SCOPE.pct(d.injection_score, 0));
      return d.abstained ? L.rulesAbstained : L.keywords(d.hits.length);
    }
    case 'embed': {
      const d = data as EmbedData;
      return L.embed(d.dims, d.model);
    }
    case 'map':
      return L.map((data as MapData).points);
    case 'knn': {
      const d = data as KnnData;
      const label = topLabel(d.distribution);
      return L.knn(d.k, SCOPE.labels[label], SCOPE.pct(d.distribution[label], 0));
    }
    case 'fuse': {
      const d = data as FuseData;
      return L.fuse(SCOPE.labels[d.label], SCOPE.pct(d.confidence, 0));
    }
    case 'thresholds': {
      const d = data as ThresholdsData;
      return d.action === 'block'
        ? L.blocked(d.p_injection.toFixed(2), d.thresholds.block.toFixed(2))
        : L.thresholds(d.scope_score.toFixed(2), SCOPE_ACTIONS[d.action].text);
    }
    case 'respond': {
      const d = data as RespondData;
      const action = SCOPE_ACTIONS[d.action].text;
      return d.handoff === 'rag' ? L.handoff(action) : L.respond(action);
    }
    default: {
      const d = data as AuditData;
      return d.record.needs_review ? L.audit(d.review_reasons.join(', ')) : L.auditClean;
    }
  }
};
