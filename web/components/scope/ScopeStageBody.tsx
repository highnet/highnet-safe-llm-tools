import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import type {
  AuditData,
  ContextData,
  DecideData,
  EmbedData,
  FuseData,
  JudgeData,
  KnnData,
  Label,
  MapData,
  RequestData,
  RespondData,
  RulesData,
  ThresholdsData,
} from '@/lib/scope/types';

import { AuditView } from './steps/AuditView';
import { ContextView } from './steps/ContextView';
import { DecideView } from './steps/DecideView';
import { EmbedFigure, EmbedView } from './steps/EmbedView';
import { FuseFigure, FuseView } from './steps/FuseView';
import { JudgeView } from './steps/JudgeView';
import { KnnFigure, KnnView } from './steps/KnnView';
import { MapFigure, MapView } from './steps/MapView';
import { RequestView } from './steps/RequestView';
import { RespondView } from './steps/RespondView';
import { RulesFigure, RulesView } from './steps/RulesView';
import { ThresholdsFigure, ThresholdsView } from './steps/ThresholdsView';

export type ScopeRunContext = {
  preset: string;
  message: string;
  block: number;
  edit: Record<string, Label>;
  // The LLM judge's validated label in this run, for the second judge to compare with.
  judge?: Label;
};

type ScopeStageBodyProps = {
  event: ScopeTraceEvent;
  context: ScopeRunContext;
};

// The one figure a step shows before its Details are opened, or nothing when the lead sentence
// says it all. Each step's payload is cast from `event.data`; the shapes are in lib/scope/types.ts.
const ScopeStageFigure = ({ event, context }: ScopeStageBodyProps) => {
  if (event.status === 'skipped' || event.status === 'error') return null;
  const data = event.data;
  switch (event.stage) {
    case 'rules':
      return <RulesFigure data={data as RulesData} block={context.block} />;
    case 'embed':
      return <EmbedFigure data={data as EmbedData} />;
    case 'map':
      return <MapFigure data={data as MapData} preset={context.preset} edit={context.edit} />;
    case 'knn':
      return <KnnFigure data={data as KnnData} />;
    case 'fuse':
      return <FuseFigure data={data as FuseData} />;
    case 'thresholds':
      return <ThresholdsFigure data={data as ThresholdsData} />;
    default:
      return null;
  }
};

// Everything else a step recorded, behind its Details toggle. A skipped step's reason and a
// failed step's error are its lead sentence, so they are not repeated here.
const ScopeStageBody = ({ event, context }: ScopeStageBodyProps) => {
  const data = event.data;
  const { stage, status } = event;
  // Context and both judges show more on a skip (the turns not read, the rubric they were asked).
  if (status === 'skipped' && stage !== 'context' && stage !== 'judge' && stage !== 'decide') {
    return null;
  }
  switch (stage) {
    case 'request':
      return <RequestView data={data as RequestData} />;
    case 'context':
      return <ContextView data={data as ContextData} skipped={status === 'skipped'} />;
    case 'judge':
      return <JudgeView data={data as JudgeData} status={status} />;
    case 'decide':
      return (
        <DecideView
          data={data as DecideData}
          status={status}
          costUsd={event.cost_usd}
          judge={context.judge}
        />
      );
    default:
      break;
  }
  if (status === 'error') return null;
  switch (stage) {
    case 'rules':
      return <RulesView data={data as RulesData} />;
    case 'embed':
      return <EmbedView data={data as EmbedData} />;
    case 'map':
      return <MapView data={data as MapData} />;
    case 'knn':
      return <KnnView data={data as KnnData} />;
    case 'fuse':
      return <FuseView data={data as FuseData} />;
    case 'thresholds':
      return <ThresholdsView data={data as ThresholdsData} />;
    case 'respond':
      return <RespondView data={data as RespondData} message={context.message} />;
    default:
      return <AuditView data={data as AuditData} />;
  }
};

export { ScopeStageBody, ScopeStageFigure };
