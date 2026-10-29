import { Bar } from '@/components/pipeline/figures/Bar';
import { Figure } from '@/components/pipeline/figures/Figure';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { KnnData } from '@/lib/scope/types';

import { ClassTag } from '../ClassTag';
import { DistributionBar } from '../DistributionBar';

const F = SCOPE.steps.knn;

type KnnViewProps = { data: KnnData };

// The neighbours that voted, most similar first, and the vote they add up to.
const KnnView = ({ data }: KnnViewProps) => {
  return (
    <div className="space-y-4">
      <Figure
        caption={F.caption(data.k)}
        alt={`${F.vote}: ${Object.entries(data.distribution)
          .map(([label, share]) => `${label} ${SCOPE.pct(share)}`)
          .join(', ')}`}
      >
        <Typography variant="label" color="muted" as="p" className="mb-1">
          {F.vote}
        </Typography>
        <DistributionBar distribution={data.distribution} />
      </Figure>
      {data.relabelled_topics.length > 0 && (
        <Typography variant="marginNote">
          {F.relabelledTopics(data.relabelled_topics.join(', '))}
        </Typography>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="voice-data border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="py-1 pr-3 font-medium">
              {F.heads.prompt}
            </th>
            <th scope="col" className="py-1 pr-3 font-medium">
              {F.heads.label}
            </th>
            <th scope="col" className="w-20 py-1 text-right font-medium sm:w-32">
              {F.heads.similarity}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.neighbours.map((n) => (
            <tr key={n.id} className="border-b border-dashed align-baseline last:border-b-0">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal wrap-anywhere">
                {n.text}
                <span className="voice-data ml-2 text-xs text-muted-foreground">{n.topic}</span>
              </th>
              <td className="voice-data py-1.5 pr-3 text-xs">
                <ClassTag label={n.label} short />
                {n.relabelled && <span className="block text-primary">{F.relabelled}</span>}
              </td>
              <td className="py-1.5 text-right">
                <span className="voice-data block">{n.similarity.toFixed(3)}</span>
                <Bar
                  size="sm"
                  max={1}
                  segments={[{ key: 's', value: Math.max(n.similarity, 0), tone: 'neutral' }]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { KnnView };
