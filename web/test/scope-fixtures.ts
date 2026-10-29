import { readFileSync } from 'node:fs';
import path from 'node:path';

import { vi } from 'vitest';

import type { RunDone, ScopeTraceEvent } from '@/lib/generated/scope-trace';
import type { Dataset, ScopeConfig } from '@/lib/scope/types';

// Real captures from the Scope API (test/fixtures/scope) and the shipped dataset.
const dir = path.join(__dirname, 'fixtures/scope');

export const scopeConfig = (): ScopeConfig =>
  JSON.parse(readFileSync(path.join(dir, 'config.json'), 'utf8'));

export const dataset = (): Dataset =>
  JSON.parse(readFileSync(path.join(__dirname, '../public/scope/dataset.json'), 'utf8'));

export type Recorded = { events: ScopeTraceEvent[]; done: RunDone };

export const recording = (name: string): Recorded => {
  const events: ScopeTraceEvent[] = [];
  let done: RunDone | null = null;
  for (const block of readFileSync(path.join(dir, `${name}.sse`), 'utf8').split('\n\n')) {
    const lines = block.split('\n');
    const kind = lines.find((l) => l.startsWith('event: '))?.slice(7);
    const data = lines.find((l) => l.startsWith('data: '))?.slice(6);
    if (!kind || !data) continue;
    if (kind === 'trace') events.push(JSON.parse(data));
    if (kind === 'done') done = JSON.parse(data);
  }
  return { events, done: done! };
};

export const stage = (rec: Recorded, name: ScopeTraceEvent['stage']) =>
  rec.events.find((e) => e.stage === name)!;

// fetch answering the Scope config and the dataset by URL; anything else is a 404.
export const stubScopeFetch = (config: unknown = scopeConfig(), data: unknown = dataset()) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/api/scope/config')) return new Response(JSON.stringify(config));
      if (url.endsWith('/scope/dataset.json')) return new Response(JSON.stringify(data));
      return new Response('', { status: 404 });
    }),
  );
