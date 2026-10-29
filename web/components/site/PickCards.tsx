'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { cn } from '@/lib/utils';

// One choice: its id, the one clean line shown on the card (lib/preview.ts) and an optional
// short note after it.
export type PickItem = { id: string; text: string; note?: string };

// A pressed choice reads by its check and weight as well as by the blue pencil on the wash.
const PRESSED = 'aria-pressed:font-semibold';

type PickCardProps = {
  item: PickItem;
  selected: boolean;
  onPick: (id: string) => void;
};

const PickCard = ({ item, selected, onPick }: PickCardProps) => {
  return (
    <li className="min-w-0">
      <Button
        type="button"
        variant="quiet"
        aria-pressed={selected}
        onClick={() => onPick(item.id)}
        className={cn('h-auto min-h-11 w-full justify-start px-3 py-2 text-left', PRESSED)}
      >
        <span aria-hidden className="flex size-4 items-center justify-center">
          {selected && <Check />}
        </span>
        <span className="min-w-0 flex-1 truncate">{item.text}</span>{' '}
        {item.note && (
          <span className="voice-data shrink-0 text-xs font-normal text-muted-foreground">
            {item.note}
          </span>
        )}
      </Button>
    </li>
  );
};

type PickCardsProps = {
  label: string;
  // The few shown at once, then the rest behind "More".
  featured: PickItem[];
  more: PickItem[];
  selectedId: string | null;
  empty: string;
  moreLabel: (n: number) => string;
  fewerLabel: string;
  onPick: (id: string) => void;
};

// The Simple view's chooser: a short list of tappable cards, each one clean line, and a
// disclosure with the rest in the same style. A selected card that is folded keeps it open.
// Cards stay live while a run plays: a new pick replaces the run on screen.
const PickCards = ({
  label,
  featured,
  more,
  selectedId,
  empty,
  moreLabel,
  fewerLabel,
  onPick,
}: PickCardsProps) => {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const moreId = useId();
  const selectedInMore = more.some((item) => item.id === selectedId);
  const shown = open || selectedInMore;
  const list = (items: PickItem[]) =>
    items.map((item) => (
      <PickCard key={item.id} item={item} selected={item.id === selectedId} onPick={onPick} />
    ));
  return (
    <section aria-labelledby={labelId} className="space-y-2">
      <Typography variant="label" color="muted" as="h2" id={labelId}>
        {label}
      </Typography>
      {featured.length === 0 ? (
        <Typography variant="small" color="muted">
          {empty}
        </Typography>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">{list(featured)}</ul>
      )}
      {more.length > 0 && (
        <>
          <ul id={moreId} hidden={!shown} className="grid gap-2 sm:grid-cols-2">
            {list(more)}
          </ul>
          {!selectedInMore && (
            <Button
              type="button"
              variant="pencil"
              size="inline"
              aria-expanded={shown}
              aria-controls={moreId}
              className="min-h-10 gap-1 text-sm"
              onClick={() => setOpen(!open)}
            >
              <ChevronDown
                aria-hidden
                className={cn('transition-transform', shown && 'rotate-180')}
              />
              {shown ? fewerLabel : moreLabel(more.length)}
            </Button>
          )}
        </>
      )}
    </section>
  );
};

type PickChipsProps = {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
};

// A short row of compact choices (Scope's products). Wraps on narrow phones.
const PickChips = ({ label, options, value, onChange }: PickChipsProps) => {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant="quiet"
          size="sm"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn('gap-1.5 font-normal', PRESSED)}
        >
          {option.id === value && <Check aria-hidden className="size-3.5" />}
          {option.name}
        </Button>
      ))}
    </div>
  );
};

export { PickCards, PickChips };
