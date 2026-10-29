import { Figure } from '@/components/pipeline/figures/Figure';
import { Facts } from '@/components/pipeline/stages/Facts';
import { SCOPE } from '@/content/scope';
import type { EmbedData } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

const F = SCOPE.steps.embed;

type EmbedViewProps = { data: EmbedData };

// The first coordinates of the message vector as bars above and below a zero line.
const EmbedView = ({ data }: EmbedViewProps) => {
  const values = data.vector_preview;
  const scale = Math.max(...values.map(Math.abs), 1e-9);
  return (
    <div className="space-y-3">
      <Figure
        caption={F.caption(values.length, data.dims)}
        alt={F.alt(values.map((v) => v.toFixed(4)).join(', '))}
      >
        <div className="flex h-16 items-stretch gap-1.5 border-y border-dashed py-1">
          {values.map((value, i) => (
            <div key={i} className="relative flex-1">
              <div className="absolute inset-x-0 top-1/2 h-px bg-input" />
              <div
                className={cn(
                  'absolute inset-x-1 bg-chart-1',
                  value >= 0 ? 'bottom-1/2' : 'top-1/2',
                )}
                style={{ height: `${(Math.abs(value) / scale) * 50}%` }}
              />
            </div>
          ))}
        </div>
      </Figure>
      <Facts
        facts={[
          { term: F.model, value: `${data.model} · ${SCOPE.summary.embed(data.dims)}` },
          { term: F.norm, value: data.norm.toFixed(4) },
          { term: F.recorded, value: data.recorded_at ? data.recorded_at.slice(0, 10) : '–' },
          { term: F.input, value: data.input, mono: false },
        ]}
      />
    </div>
  );
};

export { EmbedView };
