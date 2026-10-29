import { StepSheet } from '@/components/pipeline/StepSheet';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { scopeSnippets, scopeStatuses } from '@/lib/scope/steps';
import { scopeSummary } from '@/lib/scope/summary';
import type { RunStatus } from '@/lib/use-trace-stream';

import { type ScopeRunContext, ScopeStageBody } from './ScopeStageBody';

type ScopeStepListProps = {
  events: ScopeTraceEvent[];
  runStatus: RunStatus;
  context: ScopeRunContext;
};

// The eleven steps, drawn before the first run and filled in as trace events arrive. Each step
// is the RAG pipeline's own StepSheet: number in the margin, note beside, code underneath.
const ScopeStepList = ({ events, runStatus, context }: ScopeStepListProps) => {
  const byStage = new Map(events.map((e) => [e.stage, e]));
  const statusOf = scopeStatuses(SCOPE_STAGE_ORDER, events, runStatus);
  return (
    <ol
      aria-labelledby="working-title"
      className="relative space-y-2 md:space-y-4 md:before:absolute md:before:inset-y-0 md:before:left-14 md:before:w-px md:before:bg-border lg:before:left-16"
    >
      {SCOPE_STAGE_ORDER.map((stage, index) => {
        const event = byStage.get(stage);
        return (
          <StepSheet
            key={stage}
            anchor={`step-${stage}`}
            number={index + 1}
            copy={SCOPE_STAGES[stage]}
            status={statusOf(stage)}
            summary={event ? scopeSummary(event) : undefined}
            snippets={scopeSnippets(stage)}
            measure={
              event ? { ms: event.ms, tokens: event.tokens, costUsd: event.cost_usd } : undefined
            }
          >
            {event && <ScopeStageBody event={event} context={context} />}
          </StepSheet>
        );
      })}
    </ol>
  );
};

export { ScopeStepList };
