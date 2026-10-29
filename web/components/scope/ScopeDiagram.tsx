import { ChevronRight, Equal } from 'lucide-react';

import type { StepStatus } from '@/components/pipeline/StatusMark';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import { type ScopeAction } from '@/content/scope-verdict';
import { pad2 } from '@/lib/format';
import type { Stage } from '@/lib/generated/scope-trace';
import { cn } from '@/lib/utils';

import { ActionTag } from './ClassTag';
import { ScopeFormulas } from './ScopeFormulas';

const D = SCOPE.diagram;
const ACTIONS: ScopeAction[] = ['answer', 'answer_briefly', 'redirect', 'block'];

const Arrow = () => (
  <ChevronRight aria-hidden className="size-3.5 shrink-0 self-center text-muted-foreground" />
);

type ScopeDiagramProps = {
  statusOf: (stage: Stage) => StepStatus;
  // The action of the run on screen, once it is decided.
  action?: ScopeAction;
  className?: string;
};

// The whole guard on one figure: what was built ahead of time, then the eleven steps every
// message takes, ending in the four actions. It follows the run on screen as it streams.
const ScopeDiagram = ({ statusOf, action, className }: ScopeDiagramProps) => {
  const offline = (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
      {D.offlineSteps.map((text, i) => (
        <li key={text} className="flex items-center gap-1">
          {i > 0 && <Arrow />}
          <span className="rounded-sm border border-dashed px-2.5 py-1 text-xs leading-snug text-muted-foreground">
            {text}
          </span>
        </li>
      ))}
    </ol>
  );
  return (
    <figure
      aria-labelledby="diagram-title"
      className={cn('@container space-y-3 border-y border-dashed py-4', className)}
    >
      <Typography variant="label" as="figcaption" id="diagram-title">
        {D.title}
      </Typography>
      <div className="grid gap-x-4 gap-y-1 @2xl:grid-cols-[9rem_minmax(0,1fr)]">
        <Typography variant="label" color="muted" as="p" className="hidden pt-1.5 lg:block">
          {D.offline}
        </Typography>
        <div className="hidden lg:block">{offline}</div>
        <Collapsible className="@2xl:col-span-2 lg:hidden">
          <CollapsibleTrigger className="group voice-pencil inline-flex min-h-10 cursor-pointer items-center gap-1 text-left text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid">
            <ChevronRight
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-90"
            />
            {D.offline}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1 pb-2">{offline}</CollapsibleContent>
        </Collapsible>

        <Typography variant="label" color="muted" as="p" className="pt-1.5">
          {D.online}
        </Typography>
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
          {SCOPE_STAGE_ORDER.map((stage, i) => {
            const status = statusOf(stage);
            return (
              <li key={stage} className="flex items-center gap-1">
                {i > 0 && <Arrow />}
                <a
                  href={`#step-${stage}`}
                  data-status={status}
                  className={cn(
                    'flex items-baseline gap-1.5 rounded-sm border px-2.5 py-1 text-xs leading-snug hover:bg-accent',
                    status === 'pending' || status === 'skipped'
                      ? 'border-dashed text-muted-foreground'
                      : 'bg-card text-foreground',
                    status === 'running' && 'border-primary text-primary',
                    status === 'error' && 'border-destructive',
                  )}
                >
                  <span className="voice-data text-muted-foreground">{pad2(i + 1)}</span>
                  {SCOPE_STAGES[stage].title}
                </a>
              </li>
            );
          })}
          <li className="flex items-center gap-1">
            <Arrow />
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm border border-foreground/70 px-2.5 py-1 text-xs">
              <Equal aria-hidden className="size-3 text-primary" />
              <span className="sr-only">{D.result}:</span>
              {ACTIONS.map((a) => (
                <ActionTag
                  key={a}
                  action={a}
                  size="sm"
                  className={cn(
                    action && a !== action && 'text-muted-foreground opacity-60',
                    a === action && 'font-semibold',
                  )}
                />
              ))}
            </span>
          </li>
        </ol>
      </div>
      <Typography variant="small" color="muted" className="max-w-[68ch]">
        {D.note}
      </Typography>
      <ScopeFormulas />
    </figure>
  );
};

export { ScopeDiagram };
