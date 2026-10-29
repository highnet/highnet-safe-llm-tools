import { readFileSync } from 'node:fs';
import path from 'node:path';

import { ImageResponse } from 'next/og';

// The share cards (/og.png, /rag/og.png, /scope/og.png) are drawn at build time, so they read the
// light pad's colours straight from globals.css (the single home of the design tokens).
const css = readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
// Recursive's static instances (the card renderer cannot read variable fonts): the prose voice
// and the data voice (MONO 1), at 400 and 700. SIL Open Font License, see assets/fonts/OFL.txt.
const font = (file: string) => readFileSync(path.join(process.cwd(), 'assets/fonts', file));
const FONTS = [
  { name: 'Recursive', data: font('recursive-sans-400.ttf'), weight: 400 as const },
  { name: 'Recursive', data: font('recursive-sans-700.ttf'), weight: 700 as const },
  { name: 'Recursive Mono', data: font('recursive-mono-400.ttf'), weight: 400 as const },
  { name: 'Recursive Mono', data: font('recursive-mono-700.ttf'), weight: 700 as const },
].map((f) => ({ ...f, style: 'normal' as const }));
const MONO = 'Recursive Mono';
export const SHARE_SIZE = { width: 1200, height: 630 };

export const token = (name: string): string =>
  css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1];

type ShareCardOptions = {
  // The line in the data voice at the top: the site, or the site and the product.
  name: string;
  headline: string;
  // The real steps, numbered, joined by chevrons.
  steps: readonly string[];
  // The last box, outlined like the answer sheet and marked with a blue-pencil "=".
  result: string;
  // Smaller step labels when there are many of them.
  compact?: boolean;
};

// One card: the name, the headline and the pipeline's real steps ending in its result.
export const shareCard = ({ name, headline, steps, result, compact }: ShareCardOptions) => {
  const [paper, raised, rule, ink, muted, pencil] = [
    'paper',
    'paper-raised',
    'rule',
    'graphite',
    'graphite-muted',
    'blue-pencil',
  ].map(token);
  const chevron = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
  const box = { display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 12px' };
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: paper,
        color: ink,
        fontFamily: 'Recursive',
      }}
    >
      <div style={{ display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 30 }}>{name}</div>
      <div
        style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.06, maxWidth: 1056 }}
      >
        {headline}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          fontSize: compact ? 19 : 21,
        }}
      >
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && chevron}
            <div
              style={{ ...box, border: `1px solid ${rule}`, borderRadius: 3, background: raised }}
            >
              <span style={{ fontFamily: MONO, color: muted, fontSize: compact ? 17 : 19 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {chevron}
          <div
            style={{
              ...box,
              alignItems: 'center',
              border: `1px solid ${ink}`,
              borderRadius: 3,
              fontWeight: 700,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={pencil}
              strokeWidth="2.5"
            >
              <path d="M5 9h14M5 15h14" />
            </svg>
            <span>{result}</span>
          </div>
        </div>
      </div>
    </div>,
    { ...SHARE_SIZE, fonts: FONTS },
  );
};
