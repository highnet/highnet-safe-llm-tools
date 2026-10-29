import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { publishedScopeResults, datasetHref, methodOf, scopeDetailsUrl } from '@/lib/scope/evals';
import { clearDatasetCache, fetchDataset, fetchScopeConfig } from '@/lib/scope/api';
import {
  convexHull,
  densityGrid,
  insideHull,
  labelWith,
  mapDistance,
  mapScale,
  markerPath,
} from '@/lib/scope/map';
import { scopeSnippets, scopeStatuses } from '@/lib/scope/steps';
import { scopeSummary } from '@/lib/scope/summary';
import {
  cleanEdit,
  defaultScopeSettings,
  parseScopeUrl,
  ragHref,
  runQuery,
  scopeSearch,
} from '@/lib/scope/url-state';
import { SCOPE_STAGE_ORDER } from '@/content/scope-stages';
import { SCOPE } from '@/content/scope';
import { bridgeNote } from '@/components/scope/RagBridge';
import { useScopeStream } from '@/lib/scope/use-scope-stream';
import type { Stage } from '@/lib/generated/scope-trace';

import { recording, scopeConfig, stage, stubScopeFetch } from './scope-fixtures';

const config = scopeConfig();

afterEach(() => vi.unstubAllGlobals());

describe('scope url state', () => {
  it('falls back to the defaults for a bare or broken link', () => {
    // Simple is the default view everywhere; only ?view=steps opens every step.
    const bare = parseScopeUrl('', config);
    expect(bare).toEqual(defaultScopeSettings(config, 'career'));
    expect(bare.view).toBe('simple');
    expect(parseScopeUrl('?preset=rag', config).view).toBe('simple');
    expect(parseScopeUrl('?view=steps', config).view).toBe('steps');
    expect(scopeSearch({ ...defaultScopeSettings(config, 'rag'), view: 'steps' }, config)).toBe(
      '?preset=rag&view=steps',
    );
    const broken = parseScopeUrl(
      '?preset=nope&example=x&k=99&w_rules=2&t_block=abc&edit=nope:in,cv:wrong',
      config,
    );
    expect(broken).toEqual(defaultScopeSettings(config, 'career'));
    expect(parseScopeUrl('?k=1.5', config).k).toBe(config.defaults.k);
  });

  it('reads every setting from a shared link and writes back only the changes', () => {
    const search =
      '?preset=career&example=career-fibonacci&context=0&knn=0&w_judge=0.6&decide=0&w_decide=0.2&t_brief=0.3&k=5&edit=coding_practice:in,cv:in,injection:in';
    const settings = parseScopeUrl(search, config);
    expect(settings).toMatchObject({
      preset: 'career',
      example: 'career-fibonacci',
      context: false,
      signals: { rules: true, knn: false, judge: true, decide: false },
      weights: { rules: 0.25, knn: 0.35, judge: 0.6, decide: 0.2 },
      thresholds: { block: 0.5, answer: 0.7, brief: 0.3 },
      k: 5,
      edit: { coding_practice: 'in' },
    });
    expect(scopeSearch(settings, config)).toBe(
      '?preset=career&example=career-fibonacci&context=0&knn=0&w_judge=0.6&decide=0&w_decide=0.2&t_brief=0.3&k=5&edit=coding_practice%3Ain',
    );
    expect(scopeSearch(defaultScopeSettings(config, 'rag'), config)).toBe('?preset=rag');
    // An example from another preset is dropped.
    expect(parseScopeUrl('?preset=rag&example=career-fibonacci', config).example).toBeNull();
  });

  it('keeps only real moves of editable topics', () => {
    expect(cleanEdit(config, 'career', { cv: 'out', salary: 'in', ghost: 'in' })).toEqual({
      cv: 'out',
    });
    expect(cleanEdit(config, 'missing', { cv: 'out' })).toEqual({});
  });

  it('spells every value out for the API', () => {
    const query = runQuery({
      ...defaultScopeSettings(config),
      example: 'career-salary',
      edit: { cv: 'out' },
    });
    expect(query).toContain('example=career-salary');
    expect(query).toContain('w_knn=0.35');
    expect(query).toContain('t_block=0.5');
    expect(query).toContain('judge=true');
    expect(query).toContain('decide=true');
    expect(query).toContain('w_decide=0.4');
    expect(query).toContain('edit=cv%3Aout');
    expect(runQuery({ ...defaultScopeSettings(config), example: 'x' })).not.toContain('edit');
    expect(ragHref('Who won the 2018 FIFA World Cup?')).toBe(
      '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F',
    );
  });

  it('falls back to the default preset when the config lists none', () => {
    expect(parseScopeUrl('', { ...config, presets: [], examples: [] }).preset).toBe('career');
  });
});

describe('scope map geometry', () => {
  it('scales into a square view with y pointing up', () => {
    const scale = mapScale([
      { x: 0, y: 0 },
      { x: 2, y: 1 },
    ]);
    expect(scale.x(0)).toBeCloseTo(4);
    expect(scale.x(2)).toBeCloseTo(96);
    expect(scale.y(1)).toBeLessThan(scale.y(0));
    expect(mapScale([{ x: 1, y: 1 }]).x(1)).toBe(50);
  });

  it('draws each class with its own shape', () => {
    const paths = (['in', 'adjacent', 'out', 'injection'] as const).map((l) =>
      markerPath(l, 10, 10, 1),
    );
    expect(new Set(paths).size).toBe(4);
    expect(paths[1]).toContain('a1.00');
  });

  it('relabels prompts by the edit and measures map distance', () => {
    const relabel = labelWith({ cv: 'out' });
    expect(relabel({ topic: 'cv', label: 'in' })).toBe('out');
    expect(relabel({ topic: 'salary', label: 'in' })).toBe('in');
    expect(mapDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('finds the hull, what is inside it, and the empty cells', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0.5, y: 0.5 },
    ];
    const hull = convexHull(square);
    expect(hull).toHaveLength(4);
    expect(convexHull(square.slice(0, 2))).toHaveLength(2);
    expect(insideHull(hull, { x: 0.5, y: 0.5 })).toBe(true);
    expect(insideHull(hull, { x: 2, y: 2 })).toBe(false);
    expect(insideHull(hull.slice(0, 2), { x: 0.5, y: 0.5 })).toBe(false);
    const grid = densityGrid(square, 2);
    expect(grid.inside.length).toBe(4);
    expect(grid.empty).toHaveLength(0);
    // A flat set still gets a grid (zero width falls back to one unit per cell).
    expect(
      densityGrid(
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        2,
      ).inside,
    ).toHaveLength(0);
  });
});

describe('scope steps', () => {
  it('marks the first missing step as running while a run streams', () => {
    const { events } = recording('world-cup');
    const statusOf = scopeStatuses(SCOPE_STAGE_ORDER, events.slice(0, 2), 'running');
    expect(statusOf('request')).toBe('ok');
    expect(statusOf('context')).toBe('skipped');
    expect(statusOf('rules')).toBe('running');
    expect(statusOf('embed')).toBe('pending');
    expect(scopeStatuses(SCOPE_STAGE_ORDER, [], 'idle')('request')).toBe('pending');
  });

  it('cancels nothing when no run streams', () => {
    const { result } = renderHook(() => useScopeStream());
    act(() => result.current.cancel());
    expect(result.current.status).toBe('idle');
    expect(result.current.connectionError).toBeNull();
  });

  it('finds each step’s code excerpt', () => {
    expect(scopeSnippets('nothing' as Stage)).toEqual([]);
    expect(scopeSnippets('knn').length).toBeGreaterThan(0);
    expect(scopeSnippets('knn')[0].file).toContain('knn.py');
  });

  it('summarises every step in one line', () => {
    const lines = (name: string) => recording(name).events.map(scopeSummary);
    expect(lines('world-cup')).toEqual([
      SCOPE.summary.request(32, 'en'),
      'This message has no earlier turns.',
      SCOPE.summary.rules(1, '0%'),
      SCOPE.summary.embed(1024),
      'x 0.154, y 0.052',
      'vote: in scope 71%',
      'off scope · confidence 0.95',
      'in scope 51%',
      'Answer briefly · scope 0.54',
      'Answer briefly',
      'flagged for review',
    ]);
    expect(lines('fibonacci-context')[1]).toBe('2 turns');
    expect(lines('invalid-verdict')[6]).toBe(SCOPE.summary.judgeError);
    expect(lines('invalid-verdict')[10]).toBe('no review needed');
    const decide = stage(recording('decide'), 'decide');
    expect(scopeSummary(decide)).toBe(SCOPE.summary.decide('in scope', '0.60'));
    expect(
      scopeSummary({
        ...decide,
        status: 'error',
        data: { error: { type: 'invalid_decision', message: 'No probability.' } },
      }),
    ).toBe(SCOPE.summary.decideError);
    const rules = stage(recording('world-cup'), 'rules');
    expect(scopeSummary({ ...rules, data: { ...rules.data, abstained: true } })).toBe(
      SCOPE.summary.abstained,
    );
    const request = stage(recording('world-cup'), 'request');
    expect(
      scopeSummary({
        ...request,
        status: 'error',
        data: { ...request.data, error: { type: 'too_long', message: 'Too long.' } },
      }),
    ).toBe('Too long.');
  });
});

describe('scope and RAG', () => {
  it('words the recorded World Cup verdict from what the judge said', () => {
    const verdict = {
      example_id: 'rag-world-cup',
      action: 'answer_briefly' as const,
      scope_score: 0.54,
      p_injection: 0,
      label: 'in',
      confidence: 0.5,
      judge: { label: 'out', confidence: 0.95, reason: 'live info' },
      ms: 1,
      cost_usd: 0,
    };
    expect(bridgeNote(undefined)).toBeNull();
    expect(bridgeNote({ ...verdict, judge: null })).toBe(
      SCOPE.bridge.notInCorpus.verdictNoJudge('Answer briefly'),
    );
    expect(bridgeNote({ ...verdict, judge: { ...verdict.judge, label: 'in' } })).toBe(
      SCOPE.bridge.notInCorpus.verdictAgree('Answer briefly', 'in scope'),
    );
    expect(bridgeNote(verdict)).toBe(
      SCOPE.bridge.notInCorpus.verdict('Answer briefly', 'off scope'),
    );
  });
});

describe('scope data', () => {
  beforeEach(() => clearDatasetCache());

  it('fetches the config and reports a failed answer', async () => {
    stubScopeFetch();
    expect((await fetchScopeConfig()).presets).toHaveLength(4);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    await expect(fetchScopeConfig()).rejects.toThrow('The API answered 503.');
  });

  it('loads the dataset once and retries after a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );
    await expect(fetchDataset()).rejects.toThrow('The dataset answered 500.');
    stubScopeFetch();
    const first = fetchDataset();
    expect(fetchDataset()).toBe(first);
    expect(Object.keys((await first).presets)).toEqual(['career', 'recipe', 'bank', 'rag']);
  });

  it('reads the published eval run and links into it', () => {
    expect(publishedScopeResults?.total_usd).toBeGreaterThan(0);
    expect(methodOf(publishedScopeResults!, 'fused')?.method).toBe('fused');
    expect(scopeDetailsUrl('2026-10-29T14:33:22+00:00')).toBe(
      'https://github.com/highnet/highnet-safe-llm-tools/blob/main/evals/results/scope/2026-10-29.details.jsonl',
    );
    expect(datasetHref('career', 'career-0013')).toBe(
      '/scope/dataset/?preset=career&q=career-0013',
    );
  });
});
