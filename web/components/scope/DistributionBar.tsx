import { cva } from 'class-variance-authority';

import { SCOPE } from '@/content/scope';
import { type Distribution, LABELS } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

import { ClassTag } from './ClassTag';

const segmentVariants = cva('h-full shrink-0 border-r border-card last:border-r-0', {
  variants: {
    label: {
      in: 'bg-class-in',
      adjacent: 'bg-class-adjacent',
      out: 'bg-class-out',
      injection: 'bg-class-injection',
    },
  },
});

type DistributionBarProps = {
  distribution: Distribution;
  // Draw the shares as a fraction of this total (a signal's contribution after its weight).
  max?: number;
  showValues?: boolean;
  className?: string;
};

// One signal's share per class as one ruled track, segments in class order. The bar itself is
// hidden from assistive tech; the values beside it carry the same numbers with shape and word.
const DistributionBar = ({
  distribution,
  max = 1,
  showValues = true,
  className,
}: DistributionBarProps) => {
  return (
    <div data-slot="distribution-bar" className={cn('space-y-1', className)}>
      <div aria-hidden className="flex h-3 w-full border border-input bg-muted/60">
        {LABELS.filter((label) => distribution[label] > 0).map((label) => (
          <div
            key={label}
            className={segmentVariants({ label })}
            style={{ width: `${Math.min(distribution[label] / max, 1) * 100}%` }}
          />
        ))}
      </div>
      {showValues && (
        <p className="voice-data flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {LABELS.map((label) => (
            <span key={label} className="inline-flex items-center gap-1">
              <ClassTag label={label} short />
              <span className="text-foreground">{SCOPE.pct(distribution[label])}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

export { DistributionBar };
