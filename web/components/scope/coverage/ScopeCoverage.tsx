'use client';

import { useState } from 'react';

import { Notice } from '@/components/site/Notice';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { ScopeEvalResults } from '@/lib/generated/scope-evals';
import { datasetHref } from '@/lib/scope/evals';
import { densityGrid } from '@/lib/scope/map';
import type { Dataset } from '@/lib/scope/types';
import { useDataset } from '@/lib/scope/use-dataset';

import { ClassTag } from '../ClassTag';
import { Disclosure } from '@/components/ui/Disclosure';
import { ScopeMap } from '../ScopeMap';

const C = SCOPE.coverage;
const D = SCOPE.dataset;
export const GRID = 10;

type CoverageViewProps = { data: Dataset; results: ScopeEvalResults | null };

const CoverageView = ({ data, results }: CoverageViewProps) => {
  const presets = Object.keys(data.presets);
  const [preset, setPreset] = useState(() => {
    const asked = new URLSearchParams(window.location.search).get('preset') ?? '';
    return presets.includes(asked) ? asked : presets[0];
  });
  const set = data.presets[preset];
  const grid = densityGrid(set.rows, GRID);
  const byId = new Map(set.rows.map((r) => [r.id, r]));
  const missed = (results?.misclassified ?? []).filter(
    (m) => m.preset === preset && byId.has(m.id),
  );
  const choose = (id: string) => {
    setPreset(id);
    window.history.replaceState(null, '', `?preset=${id}`);
  };

  return (
    <div className="space-y-5">
      <div role="group" aria-label={D.preset} className="flex flex-wrap gap-2">
        {presets.map((id) => (
          <Button
            key={id}
            type="button"
            variant="quiet"
            size="sm"
            aria-pressed={id === preset}
            onClick={() => choose(id)}
          >
            {D.presetNames[id as keyof typeof D.presetNames]}
          </Button>
        ))}
      </div>

      <ScopeMap
        rows={set.rows}
        labelOf={(row) => row.label}
        explained={set.explained_variance}
        missed={missed.map((m) => m.id)}
        sparse={grid.empty}
        size="full"
        alt={`${C.sparse(grid.empty.length, grid.inside.length, GRID)} ${
          results ? C.missed(missed.length) : C.noResults
        }`}
        legend={{ sparse: C.legend.sparse, missed: results ? C.legend.missed : undefined }}
      />

      <div className="max-w-[68ch] space-y-2">
        <Typography>{C.sparse(grid.empty.length, grid.inside.length, GRID)}</Typography>
      </div>

      <section aria-labelledby="missed-title" className="space-y-2">
        <Typography variant="stepHeading" as="h2" id="missed-title">
          {C.missedTitle}
          {results && (
            <span className="voice-data ml-3 text-sm font-normal text-muted-foreground">
              {C.missed(missed.length)}
            </span>
          )}
        </Typography>
        {!results ? (
          <Typography color="muted">{C.noResults}</Typography>
        ) : missed.length === 0 ? (
          <Typography color="muted">{C.missedNone}</Typography>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="voice-data border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-1 pr-3 font-medium">
                  {C.heads.prompt}
                </th>
                <th scope="col" className="py-1 font-medium">
                  {C.heads.label} → {C.heads.predicted}
                </th>
              </tr>
            </thead>
            <tbody>
              {missed.map((m) => (
                <tr key={m.id} className="border-b border-dashed align-baseline last:border-b-0">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <span className="line-clamp-3 break-words">{byId.get(m.id)!.text}</span>
                    <a
                      href={datasetHref(preset, m.id)}
                      aria-label={`${C.open}: ${m.id}`}
                      className="voice-data text-xs text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    >
                      {m.id}
                    </a>
                  </th>
                  <td className="voice-data py-2 text-xs">
                    <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <ClassTag label={m.label} />
                      <span className="whitespace-nowrap text-muted-foreground">{C.arrow}</span>
                      <ClassTag label={m.predicted} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Disclosure show={C.showCells} hide={C.hideCells}>
        <table className="voice-data w-full border-collapse text-xs">
          <caption className="pb-1 text-left font-sans text-xs text-muted-foreground">
            {C.cellsCaption}
          </caption>
          <thead>
            <tr className="border-b text-right text-muted-foreground">
              <th scope="col" className="py-1 pr-3 text-left font-medium">
                {C.cellHeads.x}
              </th>
              <th scope="col" className="py-1 text-left font-medium">
                {C.cellHeads.y}
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.empty.map((cell) => (
              <tr key={`${cell.x0}:${cell.y0}`} className="border-b border-dashed">
                <td className="py-1 pr-3">
                  {cell.x0.toFixed(3)} – {cell.x1.toFixed(3)}
                </td>
                <td className="py-1">
                  {cell.y0.toFixed(3)} – {cell.y1.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Disclosure>
    </div>
  );
};

type ScopeCoverageProps = { results: ScopeEvalResults | null };

// Sheet 4 of Scope: each preset's map at full size, with its empty cells and its misses.
const ScopeCoverage = ({ results }: ScopeCoverageProps) => {
  const { state, retry } = useDataset();
  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-4">
        <Typography variant="sheetTitle" id="sheet-title">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {C.sheetLabel} ·
          </span>
          {C.title}
        </Typography>
        <Typography color="muted" className="max-w-[68ch]">
          {C.lede}
        </Typography>
        <Disclosure show={C.how} hide={C.how}>
          <Typography variant="small" color="muted" className="max-w-[68ch]">
            {C.caveat}
          </Typography>
        </Disclosure>
      </header>
      {state.status === 'loading' && <Notice tone="note">{D.loading}</Notice>}
      {state.status === 'error' && (
        <Notice tone="error">
          <p>{D.error(state.message)}</p>
          <Button variant="pencil" size="inline" className="mt-1" onClick={retry}>
            {D.retry}
          </Button>
        </Notice>
      )}
      {state.status === 'ready' && <CoverageView data={state.data} results={results} />}
    </div>
  );
};

export { ScopeCoverage };
