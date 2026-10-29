'use client';

import { useState } from 'react';
import { ChevronDown, Square } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { Example, Preset } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

const P = SCOPE.picker;
const SHOWN = 6;

type ExampleGroupProps = {
  label: string;
  examples: Example[];
  selectedId: string | null;
  disabled: boolean;
  onPick: (example: Example) => void;
};

// Long groups show six and fold the rest; a folded example that is selected keeps it open.
const ExampleGroup = ({ label, examples, selectedId, disabled, onPick }: ExampleGroupProps) => {
  const [showAll, setShowAll] = useState(false);
  const selectedAt = examples.findIndex((e) => e.id === selectedId);
  const long = examples.length > SHOWN + 1;
  const open = !long || showAll || selectedAt >= SHOWN;
  const shown = open ? examples : examples.slice(0, SHOWN);
  return (
    <div className="space-y-1.5">
      <Typography variant="label" color="muted" as="h3">
        {label}
      </Typography>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {shown.map((example) => (
          <li key={example.id}>
            <Button
              type="button"
              variant="quiet"
              aria-pressed={example.id === selectedId}
              disabled={disabled}
              onClick={() => onPick(example)}
              className="h-auto min-h-11 w-full flex-col items-start gap-0.5 py-2 text-left leading-snug font-normal whitespace-normal"
            >
              <span className="line-clamp-3 wrap-anywhere">{example.text}</span>
              {example.context.length > 0 && (
                <span className="voice-data text-xs text-muted-foreground">
                  {P.turns(example.context.length)}
                </span>
              )}
            </Button>
          </li>
        ))}
      </ul>
      {long && selectedAt < SHOWN && (
        <Button
          type="button"
          variant="pencil"
          size="inline"
          aria-expanded={showAll}
          className="min-h-8 gap-1 text-sm"
          onClick={() => setShowAll((value) => !value)}
        >
          <ChevronDown
            aria-hidden
            className={cn('transition-transform', showAll && 'rotate-180')}
          />
          {showAll ? P.fewer : P.more(examples.length - SHOWN)}
        </Button>
      )}
    </div>
  );
};

type ExamplePickerProps = {
  presets: Preset[];
  preset: string;
  examples: Example[];
  selectedId: string | null;
  running: boolean;
  onPreset: (preset: string) => void;
  onPick: (example: Example) => void;
  onStop: () => void;
};

// The four products, then their recorded messages: picking one replays its recorded run.
const ExamplePicker = ({
  presets,
  preset,
  examples,
  selectedId,
  running,
  onPreset,
  onPick,
  onStop,
}: ExamplePickerProps) => {
  // The preset always comes from the config (lib/scope/url-state.ts), so it is always listed.
  const current = presets.find((p) => p.id === preset)!;
  const mine = examples.filter((e) => e.preset === preset);
  const groups = [
    { key: 'rag', items: mine.filter((e) => e.rag_question) },
    { key: 'single', items: mine.filter((e) => !e.rag_question && e.context.length === 0) },
    { key: 'context', items: mine.filter((e) => !e.rag_question && e.context.length > 0) },
  ] as const;
  return (
    <section aria-labelledby="pick-label" className="space-y-4">
      <div className="space-y-1.5">
        <Typography variant="label" color="muted" as="h2" id="preset-label">
          {SCOPE.presets.label}
        </Typography>
        <div role="group" aria-labelledby="preset-label" className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="quiet"
              aria-pressed={p.id === preset}
              disabled={running}
              onClick={() => onPreset(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <Typography variant="small" color="muted" className="max-w-[68ch]">
          {SCOPE.presets.describe(current.product)} {current.description}
        </Typography>
      </div>
      <div className="flex min-h-10 items-center justify-between gap-3">
        <Typography variant="stepHeading" as="h2" id="pick-label" className="text-base">
          {P.title}
        </Typography>
        {running && (
          <Button type="button" variant="quiet" size="sm" onClick={onStop}>
            <Square aria-hidden />
            {SCOPE.stop}
          </Button>
        )}
      </div>
      {mine.length === 0 && (
        <Typography variant="small" color="muted">
          {P.empty}
        </Typography>
      )}
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <ExampleGroup
            key={`${preset}:${g.key}`}
            label={P.groups[g.key]}
            examples={g.items}
            selectedId={selectedId}
            disabled={running}
            onPick={onPick}
          />
        ))}
    </section>
  );
};

export { ExamplePicker };
