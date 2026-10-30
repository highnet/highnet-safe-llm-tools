import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { oneLine } from '@/lib/preview';
import type { ContextData, RequestData, ThresholdsData } from '@/lib/scope/types';
import type { RunStatus } from '@/lib/use-trace-stream';

import { ActionTag } from './ClassTag';

const S = SCOPE.simple;

type ScopeSimpleProps = {
  events: ScopeTraceEvent[];
  runStatus: RunStatus;
  onShowSteps: () => void;
};

// The Simple view's one card: the message, the action the guard chose and one plain sentence of
// why, read only from the run's trace. Everything else is one click away, in every step.
const ScopeSimple = ({ events, runStatus, onShowSteps }: ScopeSimpleProps) => {
  const byStage = new Map(events.map((e) => [e.stage, e]));
  const request = byStage.get('request')?.data as RequestData | undefined;
  const context = byStage.get('context');
  const decision = byStage.get('thresholds')?.data as ThresholdsData | undefined;
  const running = runStatus === 'running';

  if (!request) {
    return <Typography color="muted">{running ? S.deciding : S.empty}</Typography>;
  }

  const turns = context?.status === 'ok' ? (context.data as ContextData).turns.length : 0;

  return (
    <div className="space-y-2">
      <div className="max-w-3xl min-w-0 space-y-3 rounded-md border border-foreground/70 bg-card px-4 py-4 md:px-6 md:py-5">
        <div className="space-y-0.5">
          <Typography className="line-clamp-2 break-words">
            <span className="sr-only">{S.message}: </span>
            {oneLine(request.message, 240)}
          </Typography>
          {turns > 0 && (
            <Typography variant="small" color="muted">
              {S.earlier(SCOPE.pick.turns(turns))}
            </Typography>
          )}
        </div>
        <div aria-live="polite" className="space-y-1 border-t border-dashed pt-3">
          {request.error ? (
            <Typography variant="small" color="destructive">
              {request.error.message}
            </Typography>
          ) : decision ? (
            <>
              <p className="text-2xl font-semibold">
                <ActionTag action={decision.action} size="lg" />
              </p>
              <Typography className="text-lg text-pretty">{S.outcomes[decision.action]}</Typography>
            </>
          ) : (
            <Typography color="muted">{running ? S.deciding : S.stopped}</Typography>
          )}
        </div>
      </div>
      <Button
        variant="pencil"
        size="inline"
        className="min-h-10 gap-1 text-sm"
        onClick={onShowSteps}
      >
        {S.every}
        <ArrowRight aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
};

export { ScopeSimple };
