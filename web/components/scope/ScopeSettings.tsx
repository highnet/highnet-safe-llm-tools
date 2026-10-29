'use client';

import { ChevronDown, Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { SIGNALS, type Thresholds } from '@/lib/scope/types';
import { K_MAX, type ScopeSettings } from '@/lib/scope/url-state';

const S = SCOPE.settings;
const THRESHOLDS: (keyof Thresholds)[] = ['block', 'answer', 'brief'];

type SliderProps = {
  id: string;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
};

// A 0–1 setting in steps of 0.05, its value written beside it in the data voice.
const Slider = ({ id, label, value, disabled, onChange }: SliderProps) => {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <output htmlFor={id} className="voice-data text-sm">
        {value.toFixed(2)}
      </output>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="col-span-2 h-8 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

type ScopeSettingsProps = {
  settings: ScopeSettings;
  changed: boolean;
  disabled: boolean;
  onChange: (settings: ScopeSettings) => void;
  onReset: () => void;
};

// Everything that is recomputed from the recording: which signals run, how they are weighed,
// where the thresholds sit, how many neighbours vote, and whether earlier turns are read.
const ScopeSettingsStrip = ({
  settings,
  changed,
  disabled,
  onChange,
  onReset,
}: ScopeSettingsProps) => {
  const off = SIGNALS.filter((s) => !settings.signals[s]).map((s) => SCOPE.signals[s]);
  const summary = [
    off.length ? S.short.off(off.join(', ')) : null,
    S.short.k(settings.k),
    settings.context ? null : S.short.context,
    changed ? S.short.changed : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Collapsible className="border-y border-dashed">
      <CollapsibleTrigger className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-sm sm:hidden">
        <span>
          <span className="text-muted-foreground">{S.summary} </span>
          <span className="voice-data">{summary}</span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 text-primary transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className="grid gap-x-8 gap-y-5 pb-4 data-[state=closed]:hidden sm:grid-cols-2 sm:py-4 sm:data-[state=closed]:grid lg:grid-cols-4"
      >
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm text-muted-foreground">{S.signals}</legend>
          <div className="flex flex-wrap gap-2">
            {SIGNALS.map((s) => (
              <Button
                key={s}
                type="button"
                variant="quiet"
                size="sm"
                aria-pressed={settings.signals[s]}
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...settings,
                    signals: { ...settings.signals, [s]: !settings.signals[s] },
                  })
                }
              >
                {SCOPE.signals[s]}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5 pt-1">
            <span id="scope-context-label" className="block text-sm text-muted-foreground">
              {S.context}
            </span>
            <SegmentedControl
              name="scope-context"
              labelledBy="scope-context-label"
              size="sm"
              value={settings.context ? 'on' : 'off'}
              disabled={disabled}
              onChange={(value) => onChange({ ...settings, context: value === 'on' })}
              options={[
                { value: 'on', label: S.contextOptions.on },
                { value: 'off', label: S.contextOptions.off },
              ]}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-sm text-muted-foreground">{S.weights}</legend>
          {SIGNALS.map((s) => (
            <Slider
              key={s}
              id={`scope-w-${s}`}
              label={SCOPE.signals[s]}
              value={settings.weights[s]}
              disabled={disabled || !settings.signals[s]}
              onChange={(value) =>
                onChange({ ...settings, weights: { ...settings.weights, [s]: value } })
              }
            />
          ))}
          <Typography variant="small" color="muted" className="text-xs">
            {S.weightsNote}
          </Typography>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-sm text-muted-foreground">{S.thresholds}</legend>
          {THRESHOLDS.map((t) => (
            <Slider
              key={t}
              id={`scope-t-${t}`}
              label={S.thresholdNames[t]}
              value={settings.thresholds[t]}
              disabled={disabled}
              onChange={(value) =>
                onChange({ ...settings, thresholds: { ...settings.thresholds, [t]: value } })
              }
            />
          ))}
        </fieldset>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <span id="scope-k-label" className="block text-sm text-muted-foreground">
              {S.k}
            </span>
            <div role="group" aria-labelledby="scope-k-label" className="flex items-center gap-1">
              <Button
                variant="quiet"
                size="icon"
                aria-label={S.fewer}
                disabled={disabled || !settings.signals.knn || settings.k <= 1}
                onClick={() => onChange({ ...settings, k: settings.k - 1 })}
              >
                <Minus aria-hidden />
              </Button>
              <output aria-live="polite" className="voice-data w-8 text-center text-base">
                {settings.k}
              </output>
              <Button
                variant="quiet"
                size="icon"
                aria-label={S.more}
                disabled={disabled || !settings.signals.knn || settings.k >= K_MAX}
                onClick={() => onChange({ ...settings, k: settings.k + 1 })}
              >
                <Plus aria-hidden />
              </Button>
            </div>
          </div>
          {changed && (
            <Button
              type="button"
              variant="pencil"
              size="inline"
              disabled={disabled}
              className="min-h-8 text-sm"
              onClick={onReset}
            >
              {S.reset}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { ScopeSettingsStrip };
