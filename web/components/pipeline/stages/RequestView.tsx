import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import type { RequestData } from '@/lib/stage-data';

import { RequestFigure } from '../figures/RequestFigure';
import { Facts } from './Facts';
import { ScopeVerdictNote } from './ScopeVerdictNote';

type RequestViewProps = { data: RequestData; questionId?: string };

const RequestView = ({ data, questionId }: RequestViewProps) => {
  const { budget } = data;
  return (
    <div className="space-y-3">
      {data.recording && (
        <Typography variant="small" color="muted">
          {COPY.replay.recorded(data.recording.recorded_at.slice(0, 10))} {data.recording.note}
        </Typography>
      )}
      <RequestFigure data={data} />
      {questionId && !data.error && <ScopeVerdictNote questionId={questionId} />}
      <Facts
        facts={[
          { term: 'Budget tier', value: budget.tier },
          {
            term: 'Models',
            value: `${data.models.embed.model} → ${data.models.answer.model}`,
          },
        ]}
      />
    </div>
  );
};

export { RequestView };
