'use client';

import { Facts } from '@/components/pipeline/stages/Facts';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { labelWith, mapDistance } from '@/lib/scope/map';
import type { Label, MapData } from '@/lib/scope/types';
import { useDataset } from '@/lib/scope/use-dataset';

import { ClassTag } from '../ClassTag';
import { Disclosure } from '../Disclosure';
import { ScopeMap } from '../ScopeMap';

const F = SCOPE.steps.map;

type MapViewProps = {
  data: MapData;
  preset: string;
  edit: Record<string, Label>;
};

// The message among the preset's labeled prompts, with its five nearest on the map ringed.
// Labels follow the visitor's edit, so a moved topic changes shape here as it does in the vote.
const MapView = ({ data, preset, edit }: MapViewProps) => {
  const { state } = useDataset();
  const query = { x: data.x, y: data.y };
  const kept = SCOPE.pct(data.explained_variance[0] + data.explained_variance[1]);
  const facts = (
    <Facts
      facts={[
        { term: F.position, value: SCOPE.summary.map(data.x.toFixed(3), data.y.toFixed(3)) },
        { term: F.points, value: data.points },
      ]}
    />
  );
  if (state.status === 'loading') {
    return (
      <div className="space-y-3">
        {facts}
        <Typography variant="small" color="muted">
          {F.loading}
        </Typography>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="space-y-3">
        {facts}
        <Typography variant="small" color="warning">
          {F.failed} {state.message}
        </Typography>
      </div>
    );
  }
  const set = state.data.presets[preset];
  const labelOf = labelWith(edit);
  const near = data.neighbours_2d
    .map((id) => set.rows.find((row) => row.id === id))
    .filter((row) => row !== undefined);
  return (
    <div className="space-y-3">
      {facts}
      <ScopeMap
        rows={set.rows}
        labelOf={labelOf}
        explained={data.explained_variance}
        query={query}
        ringed={data.neighbours_2d}
        alt={F.alt(set.rows.length, data.x.toFixed(3), data.y.toFixed(3))}
        legend={{ ringed: F.nearest }}
      />
      <Typography variant="small" color="muted" className="max-w-[68ch]">
        {F.caption(kept)}
      </Typography>
      <Disclosure show={F.showTable} hide={F.hideTable}>
        <table className="w-full border-collapse text-sm">
          <caption className="pb-1 text-left text-xs text-muted-foreground">{F.nearest}</caption>
          <thead>
            <tr className="voice-data border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="py-1 pr-3 font-medium">
                {F.heads.prompt}
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                {F.heads.label}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {F.heads.distance}
              </th>
            </tr>
          </thead>
          <tbody>
            {near.map((row) => (
              <tr key={row.id} className="border-b border-dashed align-baseline last:border-b-0">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal break-words">
                  {row.text}
                  <span className="voice-data ml-2 text-xs text-muted-foreground">{row.id}</span>
                </th>
                <td className="voice-data py-1.5 pr-3 text-xs">
                  <ClassTag label={labelOf(row)} short />
                  {labelOf(row) !== row.label && (
                    <span className="block text-muted-foreground">{F.edited}</span>
                  )}
                </td>
                <td className="voice-data py-1.5 text-right">
                  {mapDistance(row, query).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Disclosure>
    </div>
  );
};

export { MapView };
