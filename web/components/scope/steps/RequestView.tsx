import { Bar } from '@/components/pipeline/figures/Bar';
import { Figure } from '@/components/pipeline/figures/Figure';
import { Facts } from '@/components/pipeline/stages/Facts';
import { SCOPE } from '@/content/scope';
import type { RequestData } from '@/lib/scope/types';

const F = SCOPE.steps.request;

type RequestViewProps = { data: RequestData };

// The cheap checks: requests against the rate limits, the length against its cap.
const RequestView = ({ data }: RequestViewProps) => {
  const rate = data.rate_limit;
  const usedMinute = rate.limit_minute - rate.remaining_minute;
  const usedDay = rate.limit_day - rate.remaining_day;
  const rows = [
    { label: F.minute, used: usedMinute, max: rate.limit_minute },
    { label: F.day, used: usedDay, max: rate.limit_day },
    { label: F.length, used: data.chars, max: data.max_chars },
  ];
  return (
    <div className="space-y-3">
      <Figure
        caption={F.caption}
        alt={F.alt(
          `${usedMinute} of ${rate.limit_minute}`,
          `${usedDay} of ${rate.limit_day}`,
          `${data.chars} of ${data.max_chars}`,
        )}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <span className="text-muted-foreground">{row.label}</span>
              <Bar
                max={row.max}
                segments={[
                  {
                    key: 'used',
                    value: row.used,
                    tone: row.used > row.max ? 'destructive' : 'pencil',
                  },
                ]}
              />
              <span className="voice-data text-right">
                {row.used}/{row.max}
              </span>
            </div>
          ))}
        </div>
      </Figure>
      <Facts
        facts={[
          { term: F.language, value: F.languageValue(data.language, data.language_words) },
          {
            term: F.models,
            value: [data.models.embed, data.models.judge, data.models.decide]
              .filter((m) => m !== undefined)
              .map((m) => m.model)
              .join(' · '),
          },
        ]}
      />
    </div>
  );
};

export { RequestView };
