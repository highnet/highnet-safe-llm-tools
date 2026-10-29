import { Facts, type Fact } from '@/components/pipeline/stages/Facts';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { formatUsd } from '@/lib/format';
import { type DecideData, type Label, LABELS } from '@/lib/scope/types';

import { ClassTag } from '../ClassTag';
import { Disclosure } from '@/components/ui/Disclosure';
import { DistributionBar } from '../DistributionBar';
import { Verbatim } from './Verbatim';

const F = SCOPE.steps.decide;

type DecideViewProps = {
  data: DecideData;
  status: string;
  // This step's own priced cost (the event's), set beside the gateway's figure.
  costUsd: number;
  // What the LLM judge chose in the same run, when it ran and validated.
  judge?: Label;
};

// The second judge: one typed question, a probability for every label, no reply to parse.
const DecideView = ({ data, status, costUsd, judge }: DecideViewProps) => {
  const questions = data.questions;
  const question = questions && (
    <Disclosure show={F.question} hide={F.hideQuestion}>
      <div className="space-y-2">
        <Typography variant="label" color="muted" as="p">
          {F.instructions}
        </Typography>
        <Typography variant="small">{questions.label.instructions}</Typography>
        <Typography variant="label" color="muted" as="p">
          {F.criteria}
        </Typography>
        <ul className="divide-y divide-dashed border-y border-dashed text-sm">
          {LABELS.map((label) => (
            <li
              key={label}
              className="grid gap-x-3 gap-y-0.5 py-1.5 sm:grid-cols-[7rem_minmax(0,1fr)]"
            >
              <ClassTag label={label} className="self-start" />
              <span className="break-words text-muted-foreground">
                {questions.label.criteria[label]}
              </span>
            </li>
          ))}
        </ul>
        {data.state && (
          <>
            <Typography variant="label" color="muted" as="p">
              {F.state}
            </Typography>
            <Verbatim text={JSON.stringify(data.state, null, 2)} />
          </>
        )}
      </div>
    </Disclosure>
  );

  if (status === 'skipped') {
    return (
      <div className="space-y-2">
        {data.relabelled_topics && data.relabelled_topics.length > 0 && (
          <Typography variant="marginNote">
            {F.relabelled(data.relabelled_topics.join(', '))}
          </Typography>
        )}
        {question}
      </div>
    );
  }

  const facts: Fact[] = [];
  if (data.model) {
    facts.push({ term: F.model, value: F.modelValue(data.model, data.provider as string) });
  }
  if (data.recorded_at) {
    facts.push({
      term: F.recorded,
      value: F.recordedValue(data.recorded_at.slice(0, 10), data.replayed === true),
    });
  }
  if (data.reported_cost_usd !== undefined && data.reported_cost_usd !== null) {
    facts.push({
      term: F.reportedCost,
      value: F.reportedCostValue(formatUsd(data.reported_cost_usd), formatUsd(costUsd)),
    });
  }

  return (
    <div className="space-y-4">
      {data.distribution && data.choice && (
        <div className="space-y-2">
          <Typography variant="label" color="muted" as="h4">
            {F.choice}
          </Typography>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ClassTag label={data.choice} size="default" className="font-semibold" />
            <span className="voice-data text-sm">
              {F.probability(data.distribution[data.choice].toFixed(2))}
            </span>
          </p>
          <DistributionBar distribution={data.distribution} />
          {judge && (
            <Typography variant="small" color="muted">
              {judge === data.choice
                ? F.agree(SCOPE.labels[judge])
                : F.disagree(SCOPE.labels[data.choice], SCOPE.labels[judge])}
            </Typography>
          )}
        </div>
      )}
      {data.error && (
        <div className="space-y-1">
          <Typography variant="small" color="destructive">
            {data.error.type === 'invalid_decision' ? F.invalid : F.failed}
          </Typography>
          <Verbatim text={data.error.message} />
          {data.answers && <Verbatim text={JSON.stringify(data.answers, null, 2)} />}
        </div>
      )}
      {facts.length > 0 && <Facts facts={facts} />}
      {question}
    </div>
  );
};

export { DecideView };
