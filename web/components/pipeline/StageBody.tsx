import type { TraceEvent } from '@/lib/generated/trace';
import type {
  Bm25Data,
  CitationsData,
  ContextChunk,
  ContextData,
  EmbedData,
  FuseData,
  GenerateData,
  MapData,
  PromptData,
  RerankData,
  RequestData,
  VectorData,
} from '@/lib/stage-data';

import { Bm25Figure } from './figures/Bm25Figure';
import { CitationGrid } from './figures/CitationGrid';
import { ContextFigure } from './figures/ContextFigure';
import { CorpusMap } from './figures/CorpusMap';
import { CostFigure } from './figures/CostFigure';
import { DistanceFigure } from './figures/DistanceFigure';
import { EmbedFigure } from './figures/EmbedFigure';
import { WindowFigure } from './figures/WindowFigure';
import { AgentPlanView, type AgentPlanData, PlannedQueries } from './stages/AgentPlanView';
import { Bm25View } from './stages/Bm25View';
import { CitationsView } from './stages/CitationsView';
import { ContextView } from './stages/ContextView';
import { EmbedView } from './stages/EmbedView';
import { FusedTable, FuseView } from './stages/FuseView';
import { GenerateView } from './stages/GenerateView';
import { MapView } from './stages/MapView';
import { PromptView } from './stages/PromptView';
import { RequestView } from './stages/RequestView';
import { RerankTable, RerankView } from './stages/RerankView';
import { VectorView } from './stages/VectorView';

export type RunContext = {
  chunks: Map<number, ContextChunk>;
  cited: Set<number>;
  streamedAnswer: string;
  bm25?: Bm25Data;
  vector?: VectorData;
  chunkSet?: string;
  // The recorded question being replayed, if any: its Scope verdict shows in the request step.
  questionId?: string;
};

type StageBodyProps = {
  event: TraceEvent;
  context: RunContext;
};

// The one figure a step shows before its Details are opened: its most telling picture of this
// run, or nothing when the lead sentence says it all. Payloads are cast from `event.data`.
const StageFigure = ({ event, context }: StageBodyProps) => {
  if (event.status === 'skipped' || event.status === 'error') return null;
  const data = event.data;
  switch (event.stage) {
    case 'embed_query':
      return <EmbedFigure data={data as EmbedData} />;
    case 'map_project': {
      const d = data as MapData;
      if (d.error || !context.chunkSet) return null;
      return (
        <CorpusMap
          key={context.chunkSet}
          chunkSet={context.chunkSet}
          query={{ x: d.x, y: d.y }}
          explained={d.explained_variance}
          neighbours={d.neighbours_2d}
          retrieved={[...context.chunks.values()]}
        />
      );
    }
    case 'bm25':
      return <Bm25Figure data={data as Bm25Data} />;
    case 'vector': {
      const d = data as VectorData;
      return d.results.length > 0 ? <DistanceFigure data={d} /> : null;
    }
    case 'agent_plan':
      return <PlannedQueries queries={(data as AgentPlanData).queries} />;
    case 'fuse':
      return <FusedTable data={data as FuseData} />;
    case 'rerank': {
      const d = data as RerankData;
      return d.fallback ? null : <RerankTable data={d} />;
    }
    case 'select_context': {
      const d = data as ContextData;
      return d.chunks.length > 0 ? <ContextFigure data={d} cited={context.cited} /> : null;
    }
    case 'prompt':
      return <WindowFigure data={data as PromptData} />;
    case 'generate':
      return <CostFigure data={data as GenerateData} />;
    case 'citations': {
      const d = data as CitationsData;
      const passages = context.chunks.size;
      return d.citations.length > 0 && passages > 0 ? (
        <CitationGrid data={d} passages={passages} />
      ) : null;
    }
    default:
      return null;
  }
};

// Everything else a step recorded, behind its Details toggle. A skipped step's reason and a
// failed step's error are its lead sentence, so they are not repeated here.
const StageBody = ({ event, context }: StageBodyProps) => {
  const data = event.data;
  if (event.status === 'skipped') return null;
  if (event.status === 'error' && event.stage !== 'request' && event.stage !== 'prompt') {
    return null;
  }
  switch (event.stage) {
    case 'request':
      return <RequestView data={data as RequestData} questionId={context.questionId} />;
    case 'embed_query':
      return <EmbedView data={data as EmbedData} />;
    case 'map_project':
      return <MapView data={data as MapData} />;
    case 'bm25':
      return <Bm25View data={data as Bm25Data} />;
    case 'vector':
      return <VectorView data={data as VectorData} />;
    case 'agent_plan':
      return <AgentPlanView data={data as AgentPlanData} />;
    case 'rerank':
      return <RerankView data={data as RerankData} />;
    case 'fuse':
      return <FuseView bm25={context.bm25} vector={context.vector} />;
    case 'select_context':
      return <ContextView data={data as ContextData} cited={context.cited} />;
    case 'prompt':
      return <PromptView data={data as PromptData} />;
    case 'generate':
      return (
        <GenerateView
          data={data as GenerateData}
          streamed={context.streamedAnswer}
          streaming={false}
        />
      );
    case 'citations':
      return <CitationsView data={data as CitationsData} />;
    default:
      return null;
  }
};

export { StageBody, StageFigure };
