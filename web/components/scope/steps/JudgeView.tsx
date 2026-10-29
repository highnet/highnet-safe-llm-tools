import { Bar } from '@/components/pipeline/figures/Bar';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { JudgeData } from '@/lib/scope/types';

import { ClassTag } from '../ClassTag';
import { Disclosure } from '../Disclosure';
import { DistributionBar } from '../DistributionBar';
import { Verbatim } from './Verbatim';

const F = SCOPE.steps.judge;

type JudgeViewProps = { data: JudgeData; status: string };

// What the judge was asked, what it said word for word, and whether that reply validated.
const JudgeView = ({ data, status }: JudgeViewProps) => {
  const prompt = (
    <Disclosure show={F.prompt} hide={F.hidePrompt}>
      <div className="space-y-2">
        <Typography variant="label" color="muted" as="p">
          {F.system}
        </Typography>
        <Verbatim text={data.system} />
        {data.messages && (
          <>
            <Typography variant="label" color="muted" as="p">
              {F.messages}
            </Typography>
            <Verbatim
              text={data.messages.map((m) => `${F.role(m.role)}\n${m.content}`).join('\n\n')}
            />
            <Typography variant="small" color="muted">
              {F.prefill}
            </Typography>
          </>
        )}
      </div>
    </Disclosure>
  );

  if (status === 'skipped') {
    return (
      <div className="space-y-2">
        <Typography variant="small" color="muted">
          {data.reason}
        </Typography>
        {data.relabelled_topics && data.relabelled_topics.length > 0 && (
          <Typography variant="marginNote">
            {F.relabelled(data.relabelled_topics.join(', '))}
          </Typography>
        )}
        {data.system && prompt}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.verdict && data.distribution && (
        <div className="space-y-2">
          <Typography variant="label" color="muted" as="h4">
            {F.verdict}
          </Typography>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ClassTag label={data.verdict.label} size="default" className="font-semibold" />
            <span className="voice-data text-sm">
              {F.confidence} {data.verdict.confidence.toFixed(2)}
            </span>
          </p>
          <Bar
            max={1}
            size="sm"
            segments={[{ key: 'c', value: data.verdict.confidence, tone: 'ink' }]}
          />
          <Typography variant="body" className="voice-pencil">
            “{data.verdict.reason}”
          </Typography>
          <DistributionBar distribution={data.distribution} />
        </div>
      )}
      {data.error && (
        <div className="space-y-1">
          <Typography variant="small" color="destructive">
            {data.error.type === 'invalid_verdict' ? F.invalid : F.failed}
          </Typography>
          <Verbatim text={data.error.message} />
        </div>
      )}
      {data.raw !== undefined && (
        <div className="space-y-1">
          <Typography variant="label" color="muted" as="h4">
            {F.raw}
          </Typography>
          <Verbatim text={data.raw} />
          <Typography variant="data" color="muted" as="p" className="text-xs">
            {F.model(data.model as string, data.max_tokens as number)}
          </Typography>
        </div>
      )}
      {prompt}
    </div>
  );
};

export { JudgeView };
