'use client';

import { useMemo, useState } from 'react';

import { Notice } from '@/components/site/Notice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { type Dataset, type Label, LABELS } from '@/lib/scope/types';
import { useDataset } from '@/lib/scope/use-dataset';

import { ClassTag } from '../ClassTag';
import { Turns } from '../steps/ContextView';

const D = SCOPE.dataset;
const PAGE = 40;

type Filters = { preset: string; label: Label | null; q: string; tag: string };

// ?preset=rag&label=out&q=weather&tag=multilingual, so a filtered view can be shared by link.
const readFilters = (search: string, data: Dataset): Filters => {
  const params = new URLSearchParams(search);
  const presets = Object.keys(data.presets);
  const preset = params.get('preset') ?? '';
  const label = params.get('label') as Label | null;
  return {
    preset: presets.includes(preset) ? preset : presets[0],
    label: label && LABELS.includes(label) ? label : null,
    q: params.get('q') ?? '',
    tag: params.get('tag') ?? '',
  };
};

const writeFilters = ({ preset, label, q, tag }: Filters) => {
  const params = new URLSearchParams({ preset });
  if (label) params.set('label', label);
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  window.history.replaceState(null, '', `?${params.toString()}`);
};

type DatasetViewProps = { data: Dataset };

const DatasetView = ({ data }: DatasetViewProps) => {
  const [filters, setFilters] = useState<Filters>(() => readFilters(window.location.search, data));
  const [limit, setLimit] = useState(PAGE);
  const rows = data.presets[filters.preset].rows;
  const presetNames = Object.keys(data.presets);

  const update = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    setLimit(PAGE);
    writeFilters(merged);
  };

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => r.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const query = filters.q.trim().toLowerCase();
  const matching = rows.filter(
    (r) =>
      (!filters.label || r.label === filters.label) &&
      (!filters.tag || r.tags.includes(filters.tag)) &&
      (!query ||
        r.text.toLowerCase().includes(query) ||
        r.topic.toLowerCase().includes(query) ||
        r.id === query),
  );
  const shown = matching.slice(0, limit);

  return (
    <div className="space-y-5">
      <div className="space-y-4 border-y border-dashed py-4">
        <div className="space-y-1.5">
          <Typography variant="label" color="muted" as="p" id="dataset-preset">
            {D.preset}
          </Typography>
          <div role="group" aria-labelledby="dataset-preset" className="flex flex-wrap gap-2">
            {presetNames.map((id) => (
              <Button
                key={id}
                type="button"
                variant="quiet"
                size="sm"
                aria-pressed={id === filters.preset}
                onClick={() => update({ preset: id, tag: '' })}
              >
                {D.presetNames[id as keyof typeof D.presetNames]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Typography variant="label" color="muted" as="p" id="dataset-class">
            {D.classes}
          </Typography>
          <div role="group" aria-labelledby="dataset-class" className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              aria-pressed={filters.label === null}
              onClick={() => update({ label: null })}
            >
              {D.allClasses}
              <span className="voice-data text-muted-foreground">{rows.length}</span>
            </Button>
            {LABELS.map((label) => (
              <Button
                key={label}
                type="button"
                variant="quiet"
                size="sm"
                aria-pressed={filters.label === label}
                onClick={() => update({ label })}
              >
                <ClassTag label={label} />
                <span className="voice-data text-muted-foreground">
                  {rows.filter((r) => r.label === label).length}
                </span>
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="block space-y-1.5">
            <Typography variant="label" color="muted" as="span" className="block">
              {D.search}
            </Typography>
            <Input
              type="search"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <Typography variant="label" color="muted" as="span" className="block">
              {D.tag}
            </Typography>
            <select
              value={filters.tag}
              onChange={(event) => update({ tag: event.target.value })}
              className="h-11 w-full min-w-0 rounded-sm border border-input bg-card px-3 text-base hover:border-foreground/60 focus-visible:border-primary"
            >
              <option value="">{D.allTags}</option>
              {tags.map(([tag, n]) => (
                <option key={tag} value={tag}>
                  {D.tagOption(tag, n)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p aria-live="polite" className="voice-data text-sm text-muted-foreground">
        {D.shown(matching.length, rows.length)}
      </p>

      {matching.length === 0 ? (
        <div className="space-y-2">
          <Typography color="muted">{D.none}</Typography>
          <Button
            variant="pencil"
            size="inline"
            className="min-h-8 text-sm"
            onClick={() => update({ label: null, q: '', tag: '' })}
          >
            {D.clear}
          </Button>
        </div>
      ) : (
        <ol className="divide-y divide-dashed border-y">
          {shown.map((row) => (
            <li key={row.id} id={row.id} className="space-y-2 py-3">
              {row.context.length > 0 && (
                <div className="space-y-1">
                  <Typography variant="label" color="muted" as="p">
                    {D.earlier}
                  </Typography>
                  <Turns turns={row.context} muted />
                </div>
              )}
              <p className="max-w-[68ch] leading-relaxed break-words whitespace-pre-wrap">
                {row.text}
              </p>
              <p className="voice-data flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <ClassTag label={row.label} className="text-foreground" />
                <span>
                  {D.topic} {row.topic}
                </span>
                <span>
                  {D.lang} {row.lang}
                </span>
                {row.tags.map((tag) => (
                  <span key={tag} className="rounded-sm border border-dashed px-1.5">
                    {tag}
                  </span>
                ))}
                <span>{row.id}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
      {matching.length > shown.length && (
        <Button variant="quiet" onClick={() => setLimit((n) => n + PAGE)}>
          {D.showMore(Math.min(PAGE, matching.length - shown.length))}
        </Button>
      )}
    </div>
  );
};

// Sheet 2 of Scope: every labeled prompt, filterable by preset, class, text and tag.
const DatasetBrowser = () => {
  const { state, retry } = useDataset();

  const total =
    state.status === 'ready'
      ? Object.values(state.data.presets).reduce((n, p) => n + p.rows.length, 0)
      : 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-4">
        <Typography variant="sheetTitle" id="sheet-title">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {D.sheetLabel} ·
          </span>
          {D.title}
        </Typography>
        {state.status === 'ready' && (
          <>
            <Typography color="muted" className="max-w-[68ch]">
              {D.lede(total, Object.keys(state.data.presets).length)}
            </Typography>
            <div className="max-w-[68ch] space-y-1">
              <Typography className="font-semibold">{D.provenance}</Typography>
              <Typography variant="small" color="muted">
                {D.provenanceBody}
              </Typography>
              <Typography variant="data" color="muted" as="p" className="text-xs">
                {D.build(
                  state.data.build.build_id,
                  state.data.build.built_at.slice(0, 10),
                  state.data.build.embed_model,
                )}
              </Typography>
            </div>
          </>
        )}
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
      {/* The prompts load in the browser, so the filters can be read from the link at once. */}
      {state.status === 'ready' && <DatasetView data={state.data} />}
    </div>
  );
};

export { DatasetBrowser };
