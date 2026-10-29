import { Bar } from '@/components/pipeline/figures/Bar';
import { Figure } from '@/components/pipeline/figures/Figure';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { SCOPE_ACTIONS } from '@/content/scope-verdict';
import type { ThresholdsData } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

import { ActionTag } from '../ClassTag';

const F = SCOPE.steps.thresholds;

const at = (value: number) => `${Math.min(Math.max(value, 0), 1) * 100}%`;

type ThresholdsViewProps = { data: ThresholdsData };

// The scope score on a 0–1 axis cut into the three bands, and P(injection) against its own
// line. Injection is read first: past its line the bands do not matter.
const ThresholdsView = ({ data }: ThresholdsViewProps) => {
  const { block, answer, brief } = data.thresholds;
  const blocked = data.action === 'block';
  const bands = [
    { key: 'redirect' as const, from: 0, to: Math.min(brief, answer) },
    { key: 'answer_briefly' as const, from: Math.min(brief, answer), to: answer },
    { key: 'answer' as const, from: answer, to: 1 },
  ];
  return (
    <div className="space-y-3">
      <Figure
        caption={F.caption}
        alt={F.alt(
          data.scope_score.toFixed(3),
          data.p_injection.toFixed(3),
          SCOPE_ACTIONS[data.action].text,
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{F.axis}</span>
              <span className="voice-data">{data.scope_score.toFixed(3)}</span>
            </div>
            <div className={cn('relative h-7 border border-input', blocked && 'opacity-50')}>
              {bands.map((band) => (
                <div
                  key={band.key}
                  className={cn(
                    'absolute inset-y-0 flex items-center justify-center overflow-hidden border-r border-input last:border-r-0',
                    data.action === band.key && 'bg-accent',
                  )}
                  style={{ left: at(band.from), width: at(band.to - band.from) }}
                >
                  <span className="voice-data truncate px-1 text-[11px] text-muted-foreground">
                    {F.bands[band.key]}
                  </span>
                </div>
              ))}
              <div
                className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 bg-primary"
                style={{ left: at(data.scope_score) }}
              />
            </div>
            <div className="voice-data relative h-4 text-[11px] text-muted-foreground">
              <span className="absolute left-0">0</span>
              {[brief, answer].map((t, i) => (
                <span key={i} className="absolute -translate-x-1/2" style={{ left: at(t) }}>
                  {t.toFixed(2)}
                </span>
              ))}
              <span className="absolute right-0">1</span>
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">{F.injection}</span>
            <span className="voice-data text-xs text-muted-foreground">
              {F.blockAt(block.toFixed(2))}
            </span>
            <Bar
              max={1}
              marks={[block]}
              segments={[
                { key: 'p', value: data.p_injection, tone: blocked ? 'fused' : 'neutral' },
              ]}
            />
            <span className="voice-data">{data.p_injection.toFixed(3)}</span>
          </div>
        </div>
      </Figure>
      {blocked && (
        <Typography variant="small" color="muted">
          {F.blocked}
        </Typography>
      )}
      <p className="text-base">
        <ActionTag action={data.action} size="lg" className="font-semibold" />
      </p>
    </div>
  );
};

export { ThresholdsView };
