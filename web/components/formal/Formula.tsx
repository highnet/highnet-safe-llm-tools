'use client';

import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FORMAL, KEY, type KeyEntry } from '@/content/formal';
import { type FormulaNode, parseFormula } from '@/lib/formula';
import { cn } from '@/lib/utils';

// How a symbol is drawn: vq is v with a subscript q; everything else as written.
const glyph = (symbol: string): ReactNode =>
  symbol === 'vq' ? (
    <>
      v<sub>q</sub>
    </>
  ) : (
    symbol
  );

type FormulaProps = {
  source: string;
  id: string;
  className?: string;
  // The symbols to explain; the RAG pipeline's by default.
  entries?: Record<string, KeyEntry>;
  hint?: string;
};

// A formula whose symbols explain themselves. Tapping (or hovering) a symbol writes its meaning
// on the line below, in place, so it works the same on a phone as with a mouse.
const Formula = ({ source, id, className, entries = KEY, hint = FORMAL.hint }: FormulaProps) => {
  // A tapped symbol stays pinned; hovering previews another and leaving restores the pin.
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? pinned;
  const definitionId = `${id}-definition`;

  const render = (nodes: FormulaNode[]): ReactNode[] =>
    nodes.map((node, i) => {
      if (node.kind === 'sub' || node.kind === 'sup') {
        const Script = node.kind;
        return <Script key={i}>{render(node.nodes)}</Script>;
      }
      if (node.kind === 'text') return <span key={i}>{node.text}</span>;
      const open = pinned === node.symbol;
      return (
        <Button
          key={i}
          type="button"
          variant="term"
          size="inline"
          aria-expanded={open}
          aria-controls={definitionId}
          aria-label={`${node.symbol}: ${entries[node.symbol].name}`}
          onClick={() => setPinned(node.symbol)}
          onMouseEnter={() => setHovered(node.symbol)}
          className="text-[length:inherit]"
        >
          {glyph(node.symbol)}
        </Button>
      );
    });

  const entry = active ? entries[active] : null;
  return (
    <div className={cn('space-y-1', className)} onMouseLeave={() => setHovered(null)}>
      <p className="voice-data text-sm leading-relaxed break-words">
        {render(parseFormula(source, entries))}
      </p>
      <p id={definitionId} aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
        {entry ? (
          <>
            <span className="voice-data font-semibold text-primary">{glyph(active!)}</span>{' '}
            <span className="font-semibold text-foreground">{entry.name}</span>: {entry.meaning}
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
};

export { Formula, glyph };
