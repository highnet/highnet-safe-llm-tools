import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { SweepPoint } from '@/lib/generated/scope-evals';

const E = SCOPE.evals.sweep;
const W = 100;
const H = 60;

type SweepChartProps = {
  title: string;
  points: SweepPoint[];
  // The threshold the run used, drawn as a rule.
  current: number;
};

const line = (points: SweepPoint[], key: 'false_refusal' | 'over_compliance') =>
  points
    .map(
      (p, i) => `${i ? 'L' : 'M'}${(p.threshold * W).toFixed(2)} ${((1 - p[key]) * H).toFixed(2)}`,
    )
    .join('');

// Both errors as the redirect threshold moves from 0 to 1, for one method: false refusal in
// graphite, over-compliance in dashed blue pencil, the default as a muted rule.
const SweepChart = ({ title, points, current }: SweepChartProps) => {
  return (
    <figure className="min-w-0 space-y-1">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-1">
        <div className="voice-data flex flex-col justify-between py-0.5 text-right text-[11px] text-muted-foreground">
          <span>100%</span>
          <span>0%</span>
        </div>
        <div
          role="img"
          aria-label={E.alt(title)}
          className="relative aspect-[5/3] border-b border-l"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <line
              x1={current * W}
              x2={current * W}
              y1={0}
              y2={H}
              className="stroke-border"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line(points, 'false_refusal')}
              className="fill-none stroke-foreground"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line(points, 'over_compliance')}
              className="fill-none stroke-primary"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <span />
        <div className="voice-data flex justify-between text-[11px] text-muted-foreground">
          <span>0</span>
          <span>{E.defaultAt(current.toFixed(2))}</span>
          <span>1</span>
        </div>
      </div>
    </figure>
  );
};

type SweepLegendProps = { className?: string };

const SweepLegend = ({ className }: SweepLegendProps) => (
  <Typography variant="small" color="muted" as="p" className={className}>
    <span className="mr-4 inline-flex items-center gap-1.5">
      <svg aria-hidden viewBox="0 0 20 4" className="h-1 w-5">
        <line x1={0} x2={20} y1={2} y2={2} className="stroke-foreground" strokeWidth={2} />
      </svg>
      {E.falseRefusal}
    </span>
    <span className="mr-4 inline-flex items-center gap-1.5">
      <svg aria-hidden viewBox="0 0 20 4" className="h-1 w-5">
        <line
          x1={0}
          x2={20}
          y1={2}
          y2={2}
          className="stroke-primary"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      </svg>
      {E.overCompliance}
    </span>
    <span className="voice-data text-xs">{E.axis}</span>
  </Typography>
);

export { SweepChart, SweepLegend };
