import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { Example, Preset } from '@/lib/scope/types';

const P = SCOPE.picker;
const C = SCOPE.compact;
const SELECT =
  'h-11 w-full min-w-0 rounded-sm border border-input bg-card px-3 text-base text-foreground hover:border-foreground/60 focus-visible:border-primary';

type CompactPickerProps = {
  presets: Preset[];
  preset: string;
  examples: Example[];
  selectedId: string | null;
  onPreset: (preset: string) => void;
  onPick: (example: Example) => void;
};

// The Simple view's chooser: the product and the message as two native selects, so the result
// sits right below them. Every recorded message is there; the full list of buttons is in the
// every-step view.
const CompactPicker = ({
  presets,
  preset,
  examples,
  selectedId,
  onPreset,
  onPick,
}: CompactPickerProps) => {
  const mine = examples.filter((e) => e.preset === preset);
  const groups = [
    { key: 'rag', items: mine.filter((e) => e.rag_question) },
    { key: 'single', items: mine.filter((e) => !e.rag_question && e.context.length === 0) },
    { key: 'context', items: mine.filter((e) => !e.rag_question && e.context.length > 0) },
  ] as const;
  return (
    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <label className="block min-w-0 space-y-1.5">
        <Typography variant="label" color="muted" as="span" className="block">
          {SCOPE.presets.label}
        </Typography>
        <select
          value={preset}
          onChange={(event) => onPreset(event.target.value)}
          className={SELECT}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0 space-y-1.5">
        <Typography variant="label" color="muted" as="span" className="block">
          {C.message}
        </Typography>
        <select
          value={selectedId ?? ''}
          disabled={mine.length === 0}
          onChange={(event) => onPick(mine.find((e) => e.id === event.target.value)!)}
          className={SELECT}
        >
          {selectedId === null && (
            <option value="" disabled>
              {mine.length === 0 ? P.empty : P.title}
            </option>
          )}
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <optgroup key={g.key} label={P.groups[g.key]}>
                {g.items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.context.length > 0 ? C.withTurns(e.text, P.turns(e.context.length)) : e.text}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </label>
    </div>
  );
};

export { CompactPicker };
