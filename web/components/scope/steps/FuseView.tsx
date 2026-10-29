import { Figure } from '@/components/pipeline/figures/Figure';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { formatMs, formatUsd } from '@/lib/format';
import { type FuseData, SIGNALS } from '@/lib/scope/types';

import { ClassTag } from '../ClassTag';
import { DistributionBar } from '../DistributionBar';

const F = SCOPE.steps.fuse;

type FuseViewProps = { data: FuseData };

// Each signal's share per class with its weight, the thin bar under it what it adds to the
// fusion, then the fused distribution and what each signal cost in this run.
const FuseView = ({ data }: FuseViewProps) => {
  const alt = SIGNALS.map((s) => {
    const used = data.used_weights[s];
    return used === undefined
      ? `${SCOPE.signals[s]}: ${F.notRun}`
      : `${SCOPE.signals[s]}: ${F.heads.used} ${used.toFixed(2)}`;
  }).join('; ');
  return (
    <div className="space-y-4">
      <Figure caption={F.caption} alt={`${alt}. ${F.fused}: ${SCOPE.labels[data.label]}`}>
        <ul className="space-y-3">
          {SIGNALS.map((s) => {
            const shares = data.signals[s];
            const used = data.used_weights[s];
            const contribution = data.contributions[s];
            return (
              <li key={s} className="grid gap-x-4 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <Typography variant="small" as="span" className="font-semibold sm:block">
                    {SCOPE.signals[s]}
                  </Typography>
                  <Typography variant="data" color="muted" as="span" className="text-xs sm:block">
                    {used === undefined
                      ? F.notRun
                      : `${F.heads.weight} ${data.weights[s].toFixed(2)} → ${used.toFixed(2)}`}
                  </Typography>
                </div>
                {shares && contribution ? (
                  <div className="space-y-1">
                    <DistributionBar distribution={shares} />
                    <DistributionBar
                      distribution={contribution}
                      showValues={false}
                      className="opacity-70"
                    />
                  </div>
                ) : (
                  <div aria-hidden className="h-3 self-center border border-dashed" />
                )}
              </li>
            );
          })}
          <li className="grid gap-x-4 gap-y-1 border-t border-dashed pt-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <div className="flex items-baseline justify-between gap-2 sm:block">
              <Typography variant="small" as="span" className="font-semibold sm:block">
                {F.fused}
              </Typography>
              <ClassTag label={data.label} className="text-xs sm:flex" />
            </div>
            <DistributionBar distribution={data.distribution} />
          </li>
        </ul>
      </Figure>
      <div className="space-y-1">
        <Typography variant="label" color="muted" as="h4">
          {F.tradeoff}
        </Typography>
        <dl className="voice-data grid max-w-sm grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 gap-y-0.5 text-sm">
          {data.tradeoff.cumulative.map((tier) => (
            <div key={tier.signals.join('+')} className="contents">
              <dt className="text-muted-foreground">
                {F.tiers[tier.signals.at(-1) as keyof typeof F.tiers]}
              </dt>
              <dd className="text-right">{formatMs(tier.ms)}</dd>
              <dd className="text-right">{formatUsd(tier.cost_usd)}</dd>
            </div>
          ))}
        </dl>
        <Typography variant="small" color="muted">
          {F.tradeoffNote}
        </Typography>
      </div>
    </div>
  );
};

export { FuseView };
