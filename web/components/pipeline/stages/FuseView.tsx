'use client';

import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import type { Bm25Data, FuseData, VectorData } from '@/lib/stage-data';
import { cn } from '@/lib/utils';

import { Bar } from '../figures/Bar';
import { RankBadge } from './RankBadge';
import { RankTable } from './RankTable';

const formatContribution = (value: number | undefined) =>
  value === undefined ? '0' : value.toFixed(4);

type FuseViewProps = { bm25?: Bm25Data; vector?: VectorData };

// The two input rankings side by side from lg (stacked below): the details of the fusion step.
const FuseView = ({ bm25, vector }: FuseViewProps) => {
  const T = COPY.stageText;
  const C = T.columns;
  if (!bm25 || !vector) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="min-w-0 space-y-1">
        <Typography variant="label" color="muted" as="h4">
          {T.inputBm25}
        </Typography>
        <RankTable
          compact
          caption={T.captions.bm25Input}
          series="bm25"
          valueLabel={C.score}
          rows={bm25.results.map((r) => ({ ...r, value: r.score.toFixed(2) }))}
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Typography variant="label" color="muted" as="h4">
          {T.inputVector}
        </Typography>
        <RankTable
          compact
          caption={T.captions.vectorInput}
          series="vector"
          valueLabel={C.distance}
          rows={vector.results.map((r) => ({ ...r, value: r.distance.toFixed(4) }))}
        />
      </div>
    </div>
  );
};

type FusedTableProps = { data: FuseData };

// The fused list with each passage's rank in both inputs and the top-k cut: the step's figure.
// Candidates below the cut stay folded until asked for, to keep the step short.
const FusedTable = ({ data }: FusedTableProps) => {
  const T = COPY.stageText;
  const C = T.columns;
  const [showDropped, setShowDropped] = useState(false);
  const dropped = Math.max(data.results.length - data.kept, 0);
  const rows = showDropped ? data.results : data.results.slice(0, data.kept);
  return (
    <div className="space-y-1">
      <Typography variant="label" color="muted" as="h4">
        {T.fused(data.k)}
      </Typography>
      {/* On the narrowest phones the table scrolls inside its sheet, never the page. */}
      <div
        role="region"
        aria-label={T.fusedCaption}
        tabIndex={0}
        className="relative overflow-x-auto"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{T.fusedCaption}</caption>
          <thead>
            <tr className="voice-data border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="w-9 py-1.5 sm:w-12 pr-2 sm:pr-3 font-medium">
                {C.rank}
              </th>
              <th scope="col" className="py-1.5 pr-2 sm:pr-3 font-medium">
                {C.passage}
              </th>
              <th scope="col" className="py-1.5 pr-2 sm:pr-3 font-medium">
                {C.from}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {C.rrf}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const below = row.rank > data.kept;
              return (
                <Fragment key={row.chunk_id}>
                  <tr
                    className={cn(
                      'border-b border-dashed',
                      below && 'text-muted-foreground',
                      row.rank === data.kept && 'border-b-0',
                    )}
                  >
                    <td className="py-1.5 pr-2 sm:pr-3 sm:py-2">
                      <RankBadge series="fused" rank={row.rank} muted={below} />
                    </td>
                    <td className="py-1.5 pr-2 [overflow-wrap:anywhere] sm:py-2 sm:pr-3">
                      {row.doc_title}{' '}
                      <span className="voice-data block text-xs text-muted-foreground sm:inline">
                        #{row.chunk_id}
                        {below && <span className="sr-only">, {T.droppedNote}</span>}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 sm:pr-3 sm:py-2">
                      <span className="flex flex-col gap-y-1 sm:flex-row sm:gap-x-3">
                        <RankBadge series="bm25" rank={row.from.bm25_rank} muted={below} />
                        <RankBadge series="vector" rank={row.from.vector_rank} muted={below} />
                      </span>
                    </td>
                    <td className="voice-data py-1.5 text-right whitespace-nowrap sm:py-2">
                      {row.score.toFixed(4)}
                      <Bar
                        size="sm"
                        max={2 / (data.k + 1)}
                        className="my-1 ml-auto w-14 sm:w-20"
                        segments={[
                          {
                            key: 'bm25',
                            value: row.contributions.bm25 ?? 0,
                            tone: below ? 'neutral' : 'bm25',
                          },
                          {
                            key: 'vector',
                            value: row.contributions.vector ?? 0,
                            tone: below ? 'neutral' : 'vector',
                          },
                        ]}
                      />
                      <span className="block text-xs whitespace-normal text-muted-foreground">
                        {T.contributions(
                          formatContribution(row.contributions.bm25),
                          formatContribution(row.contributions.vector),
                        )}
                      </span>
                    </td>
                  </tr>
                  {row.rank === data.kept && (
                    <tr>
                      <td colSpan={4} className="border-t border-primary pt-1 pb-1.5">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <Typography
                            variant="marginNote"
                            as="span"
                            aria-hidden
                            className="text-sm"
                          >
                            {T.cut(data.kept)}
                          </Typography>
                          {dropped > 0 && (
                            <Button
                              variant="pencil"
                              size="inline"
                              aria-expanded={showDropped}
                              className="min-h-8 gap-1 text-sm"
                              onClick={() => setShowDropped((open) => !open)}
                            >
                              <ChevronDown
                                aria-hidden
                                className={cn('transition-transform', showDropped && 'rotate-180')}
                              />
                              {showDropped ? T.hideDropped : T.showDropped(dropped)}
                            </Button>
                          )}
                        </span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { FusedTable, FuseView };
