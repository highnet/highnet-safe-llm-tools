import { useMemo } from 'react';
import { ArrowRight, ArrowUp } from 'lucide-react';

import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { type Cell, mapScale, markerPath, type Point, VIEW } from '@/lib/scope/map';
import { type DatasetRow, type Label, LABELS } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

import { ClassTag } from './ClassTag';

const FILLS: Record<Label, string> = {
  in: 'fill-class-in',
  adjacent: 'fill-class-adjacent',
  out: 'fill-class-out',
  injection: 'fill-class-injection',
};
const CROSS = 3.5;

type ScopeMapProps = {
  rows: DatasetRow[];
  labelOf: (row: DatasetRow) => Label;
  explained: [number, number];
  alt: string;
  query?: Point;
  // Ringed in graphite (the message's nearest on the map) and in red check (misclassified).
  ringed?: string[];
  missed?: string[];
  sparse?: Cell[];
  size?: 'step' | 'full';
  legend?: { ringed?: string; missed?: string; sparse?: string };
};

// The preset's labeled prompts on its two PCA axes, each drawn by its class's shape and ink.
const ScopeMap = ({
  rows,
  labelOf,
  explained,
  alt,
  query,
  ringed = [],
  missed = [],
  sparse = [],
  size = 'step',
  legend = {},
}: ScopeMapProps) => {
  const scale = useMemo(() => mapScale(query ? [...rows, query] : rows), [rows, query]);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const r = size === 'full' ? 0.9 : 1.15;
  const counts = LABELS.map((label) => ({
    label,
    n: rows.filter((row) => labelOf(row) === label).length,
  }));
  const ring = (ids: string[], className: string, radius: number) =>
    ids
      .map((id) => byId.get(id))
      .filter((row) => row !== undefined)
      .map((row) => (
        <circle
          key={row.id}
          cx={scale.x(row.x)}
          cy={scale.y(row.y)}
          r={radius}
          className={cn('fill-none', className)}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
      ));
  const qx = query ? scale.x(query.x) : 0;
  const qy = query ? scale.y(query.y) : 0;

  return (
    <figure data-slot="scope-map" className="space-y-2">
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative mx-auto aspect-square w-full border-y border-dashed',
          size === 'full' ? 'max-w-3xl' : 'max-w-md',
        )}
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 size-full">
          {sparse.map((c) => (
            <rect
              key={`${c.x0}:${c.y0}`}
              x={scale.x(c.x0)}
              y={scale.y(c.y1)}
              width={scale.x(c.x1) - scale.x(c.x0)}
              height={scale.y(c.y0) - scale.y(c.y1)}
              className="fill-warning/10 stroke-warning"
              strokeDasharray="3 2"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {rows.map((row) => {
            const label = labelOf(row);
            return (
              <path
                key={row.id}
                d={markerPath(label, scale.x(row.x), scale.y(row.y), r)}
                className={cn(FILLS[label], 'opacity-75')}
              />
            );
          })}
          {ring(ringed, 'stroke-foreground', r * 2.4)}
          {ring(missed, 'stroke-destructive', r * 2.1)}
          {query && (
            <g className="stroke-primary" strokeWidth={0.45}>
              <circle cx={qx} cy={qy} r={2.2} className="fill-none" />
              <line x1={qx - CROSS} x2={qx + CROSS} y1={qy} y2={qy} />
              <line x1={qx} x2={qx} y1={qy - CROSS} y2={qy + CROSS} />
            </g>
          )}
        </svg>
        {query && (
          <Typography
            variant="marginNote"
            as="span"
            className={cn(
              'pointer-events-none absolute bg-card/85 px-1 text-sm leading-tight whitespace-nowrap',
              qx > 62 && '-translate-x-full',
              qy < 12 ? 'translate-y-1' : '-translate-y-full',
            )}
            style={{ left: `${qx > 62 ? qx - 3 : qx + 3}%`, top: `${qy < 12 ? qy + 3 : qy - 3}%` }}
          >
            {SCOPE.steps.map.you}
          </Typography>
        )}
      </div>
      <div
        className={cn(
          'mx-auto flex flex-wrap justify-between gap-x-4 gap-y-1',
          size === 'full' ? 'max-w-3xl' : 'max-w-md',
        )}
      >
        <Typography
          variant="label"
          color="muted"
          as="span"
          className="inline-flex items-center gap-1"
        >
          <ArrowRight aria-hidden className="size-3" />
          {SCOPE.steps.map.axis(1, SCOPE.pct(explained[0]))}
        </Typography>
        <Typography
          variant="label"
          color="muted"
          as="span"
          className="inline-flex items-center gap-1"
        >
          <ArrowUp aria-hidden className="size-3" />
          {SCOPE.steps.map.axis(2, SCOPE.pct(explained[1]))}
        </Typography>
      </div>
      <ul
        aria-label={SCOPE.map.legend}
        className={cn(
          'voice-data mx-auto flex flex-wrap gap-x-4 gap-y-1 text-xs',
          size === 'full' ? 'max-w-3xl' : 'max-w-md',
        )}
      >
        {counts.map(({ label, n }) => (
          <li key={label} className="inline-flex items-center gap-1.5">
            <ClassTag label={label} />
            <span className="text-muted-foreground">{n}</span>
          </li>
        ))}
        {legend.ringed && (
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border border-foreground" />
            {legend.ringed}
          </li>
        )}
        {legend.missed && (
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border border-destructive" />
            {legend.missed}
          </li>
        )}
        {legend.sparse && (
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 border border-dashed border-warning bg-warning/10"
            />
            {legend.sparse}
          </li>
        )}
      </ul>
    </figure>
  );
};

export { ScopeMap };
