import { Bar } from '@/components/pipeline/figures/Bar';
import { Figure } from '@/components/pipeline/figures/Figure';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { type RulesData, TOPIC_CLASSES } from '@/lib/scope/types';

import { ClassTag } from '../ClassTag';
import { DistributionBar } from '../DistributionBar';

const F = SCOPE.steps.rules;

type RulesViewProps = { data: RulesData };

type RulesFigureProps = { data: RulesData; block: number };

// The injection likelihood the rules add up to, against the block line: the step's figure.
const RulesFigure = ({ data, block }: RulesFigureProps) => {
  return (
    <Figure caption={F.injectionCaption} alt={`${F.injection}: ${SCOPE.pct(data.injection_score)}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
        <span className="col-span-2 text-muted-foreground">{F.injection}</span>
        <Bar
          max={1}
          marks={[block]}
          segments={[{ key: 'p', value: data.injection_score, tone: 'fused' }]}
        />
        <span className="voice-data">{SCOPE.pct(data.injection_score)}</span>
      </div>
    </Figure>
  );
};

// What the rules saw: each injection hit with the view it was found in, the keyword votes from
// the scope definition, and the share they hand to the fusion (or that they abstained).
const RulesView = ({ data }: RulesViewProps) => {
  const attacks = data.hits.filter((h) => h.kind !== 'topic');
  const keywords = data.hits.filter((h) => h.kind === 'topic');
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Typography variant="label" color="muted" as="h4">
          {F.hits}
        </Typography>
        {attacks.length === 0 ? (
          <Typography variant="small" color="muted">
            {F.noInjection}
          </Typography>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="voice-data border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-1 pr-3 font-medium">
                  {F.heads.rule}
                </th>
                <th scope="col" className="py-1 pr-3 font-medium">
                  {F.heads.match}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {F.heads.weight}
                </th>
              </tr>
            </thead>
            <tbody>
              {attacks.map((hit, i) => (
                <tr key={i} className="border-b border-dashed align-baseline last:border-b-0">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                    <span className="voice-data block">{hit.rule}</span>
                    <span className="voice-data text-xs text-muted-foreground">
                      {F.heads.view}: {hit.view}
                    </span>
                  </th>
                  <td className="py-1.5 pr-3 break-all">
                    <code className="voice-data text-xs">{hit.match}</code>
                  </td>
                  <td className="voice-data py-1.5 text-right">{hit.weight.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-1.5">
        <Typography variant="label" color="muted" as="h4">
          {F.votes}
        </Typography>
        <p className="voice-data flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {TOPIC_CLASSES.map((cls) => (
            <span key={cls} className="inline-flex items-center gap-1.5">
              <ClassTag label={cls} />
              <span className="font-semibold">{data.topic_votes[cls]}</span>
            </span>
          ))}
        </p>
        {keywords.length > 0 && (
          <Typography variant="small" color="muted">
            {F.votesNote(keywords.length)}{' '}
            {keywords.map((h) => (
              <code
                key={`${h.topic}:${h.match}`}
                className="voice-data mr-2 text-xs text-foreground"
              >
                “{h.match}”
              </code>
            ))}
          </Typography>
        )}
      </div>

      {data.distribution ? (
        <div className="space-y-1.5">
          <Typography variant="label" color="muted" as="h4">
            {F.distribution}
          </Typography>
          <DistributionBar distribution={data.distribution} />
        </div>
      ) : (
        <Typography variant="small" color="muted">
          {F.abstained}
        </Typography>
      )}
    </div>
  );
};

export { RulesFigure, RulesView };
