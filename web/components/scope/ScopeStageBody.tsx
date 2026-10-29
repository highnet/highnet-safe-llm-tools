import { Typography } from '@/components/ui/Typography';
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
  SkippedData,
  ThresholdsData,
} from '@/lib/scope/types';

import { AuditView } from './steps/AuditView';
import { ContextView } from './steps/ContextView';
import { DecideView } from './steps/DecideView';
import { EmbedView } from './steps/EmbedView';
import { FuseView } from './steps/FuseView';
import { JudgeView } from './steps/JudgeView';
import { KnnView } from './steps/KnnView';
import { MapView } from './steps/MapView';
import { RequestView } from './steps/RequestView';
import { RespondView } from './steps/RespondView';
import { RulesView } from './steps/RulesView';
import { ThresholdsView } from './steps/ThresholdsView';

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

// Each step's payload is cast from `event.data`; the shapes are in lib/scope/types.ts.
const ScopeStageBody = ({ event, context }: ScopeStageBodyProps) => {
  const data = event.data;
  const { stage, status } = event;
  // Context and both judges explain their own skips (the turns not read, the rubric changed).
  if (status === 'skipped' && stage !== 'context' && stage !== 'judge' && stage !== 'decide') {
    return (
      <Typography variant="small" color="muted">
        {(data as SkippedData).reason}
      </Typography>
    );
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
  if (status === 'error') {
    return (
      <Typography color="destructive">
        {(data as { error: { message: string } }).error.message}
      </Typography>
    );
  }
  switch (stage) {
    case 'rules':
      return <RulesView data={data as RulesData} block={context.block} />;
    case 'embed':
      return <EmbedView data={data as EmbedData} />;
    case 'map':
      return <MapView data={data as MapData} preset={context.preset} edit={context.edit} />;
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

export { ScopeStageBody };
