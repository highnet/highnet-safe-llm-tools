import { STAGE_LEADS as L } from '@/content/stages';
import { formatUsd } from '@/lib/format';
import type { TraceEvent } from '@/lib/generated/trace';
import type {
  Bm25Data,
  CitationsData,
  ContextData,
  EmbedData,
  ErrorData,
  FuseData,
  GenerateData,
  MapData,
  PromptData,
  RequestData,
  RerankData,
  SkippedData,
  VectorData,
} from '@/lib/stage-data';

// The one plain sentence a step sheet opens with: what happened in this run, from its trace event.
export const stepLead = (event: TraceEvent): string => {
  const data = event.data;
  if (event.status === 'skipped') return (data as SkippedData).reason;
  if (event.status === 'error' && 'error' in data) return (data as ErrorData).error.message;
  switch (event.stage) {
    case 'request': {
      const d = data as RequestData;
      return L.request(d.rate_limit.remaining_minute, d.rate_limit.limit_minute, d.budget.tier);
    }
    case 'embed_query': {
      const d = data as EmbedData;
      return L.embed(d.dims, d.model);
    }
    case 'map_project': {
      const d = data as MapData;
      if (d.error) return d.error.message;
      const [pc1, pc2] = d.explained_variance;
      return L.map(`${((pc1 + pc2) * 100).toFixed(1)}%`);
    }
    case 'bm25': {
      const { results } = data as Bm25Data;
      const top = results[0];
      return top ? L.bm25(results.length, top.doc_title, top.score.toFixed(2)) : L.bm25None;
    }
    case 'vector': {
      const { results } = data as VectorData;
      const top = results[0];
      return top ? L.vector(results.length, top.doc_title, top.distance.toFixed(4)) : L.vectorNone;
    }
    case 'fuse': {
      const d = data as FuseData;
      const kept = d.results.slice(0, d.kept);
      const both = kept.filter((r) => r.from.bm25_rank !== null && r.from.vector_rank !== null);
      return kept.length ? L.fuse(kept.length, both.length, kept[0].doc_title) : L.fuseNone;
    }
    case 'rerank': {
      const d = data as RerankData;
      if (d.fallback) return d.fallback;
      const kept = d.results.slice(0, d.kept);
      const moved = kept.filter((r) => r.before_rank !== r.rank).length;
      return L.rerank(kept.length, moved, kept[0]?.doc_title ?? '');
    }
    case 'select_context': {
      const d = data as ContextData;
      return L.context(d.chunks.length, d.context_tokens_approx.toLocaleString('en'));
    }
    case 'prompt': {
      const d = data as PromptData;
      return L.prompt(d.input_tokens.toLocaleString('en'), formatUsd(d.worst_case_cost_usd));
    }
    case 'generate': {
      const d = data as GenerateData;
      return L.generate(
        d.model,
        d.usage.output_tokens.toLocaleString('en'),
        formatUsd(event.cost_usd),
      );
    }
    case 'citations': {
      const d = data as CitationsData;
      if (d.abstained) return L.abstained;
      if (d.citations.length === 0) return L.noCitations;
      return L.citations(d.citations.length, d.unused_chunk_ids.length);
    }
    case 'agent_plan':
      return L.plan((data as { queries: string[] }).queries.length);
    default:
      return '';
  }
};
