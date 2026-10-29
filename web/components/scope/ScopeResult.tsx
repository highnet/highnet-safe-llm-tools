import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { formatMs, formatTokens, formatUsd } from '@/lib/format';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import type { ThresholdsData } from '@/lib/scope/types';

import { ActionTag } from './ClassTag';

const R = SCOPE.result;

type ScopeResultProps = {
  decision: ThresholdsData;
  events: ScopeTraceEvent[];
  done: boolean;
};

// The last line of the calculation: the one action, with the two numbers that chose it.
const ScopeResult = ({ decision, events, done }: ScopeResultProps) => {
  const ms = events.reduce((t, e) => t + e.ms, 0);
  const tokens = events.reduce((t, e) => t + e.tokens, 0);
  const cost = events.reduce((t, e) => t + e.cost_usd, 0);
  return (
    <section
      aria-labelledby="result-title"
      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[3rem_minmax(0,1fr)] md:gap-x-4 lg:grid-cols-[3rem_minmax(0,1fr)_17rem] lg:gap-x-8"
    >
      <span aria-hidden className="voice-data pt-5 text-right text-base text-primary">
        =
      </span>
      <div className="min-w-0 animate-write-in rounded-md border border-foreground/70 bg-card px-4 py-5 md:px-6">
        <Typography variant="label" color="muted" as="h2" id="result-title">
          {R.label}
        </Typography>
        <p className="mt-2 text-xl font-semibold">
          <ActionTag action={decision.action} size="lg" />
        </p>
        <p className="voice-data mt-2 flex flex-wrap gap-x-4 text-sm">
          <span>
            <span className="text-muted-foreground">{R.scope} </span>
            {decision.scope_score.toFixed(3)}
          </span>
          <span>
            <span className="text-muted-foreground">{R.injection} </span>
            {decision.p_injection.toFixed(3)}
          </span>
        </p>
        {done && (
          <p className="voice-data mt-4 border-t border-dashed pt-3 text-xs text-muted-foreground">
            {R.totals} · {formatMs(ms)} · {formatTokens(tokens)} · {formatUsd(cost)} ·{' '}
            {R.steps(events.length)}
          </p>
        )}
      </div>
    </section>
  );
};

export { ScopeResult };
