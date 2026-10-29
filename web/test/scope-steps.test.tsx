import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ScopeStageBody,
  ScopeStageFigure,
  type ScopeRunContext,
} from '@/components/scope/ScopeStageBody';
import { ScopeStepList } from '@/components/scope/ScopeStepList';
import { ScopeMap } from '@/components/scope/ScopeMap';
import { FORMAL } from '@/content/formal';
import { SCOPE, SCOPE_KEY } from '@/content/scope';
import { SCOPE_STAGE_ORDER } from '@/content/scope-stages';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { clearDatasetCache } from '@/lib/scope/api';
import { scopeLead } from '@/lib/scope/lead';

import { openDetails } from './helpers';
import { dataset, recording, stage, stubScopeFetch } from './scope-fixtures';

const S = SCOPE.steps;
const context: ScopeRunContext = { preset: 'career', message: 'Hi', block: 0.5, edit: {} };

// A step's figure, its details and, above them, its lead sentence: the sheet's three parts.
const body = (event: ScopeTraceEvent, ctx: Partial<ScopeRunContext> = {}) =>
  render(
    <>
      <p>{scopeLead(event)}</p>
      <ScopeStageFigure event={event} context={{ ...context, ...ctx }} />
      <ScopeStageBody event={event} context={{ ...context, ...ctx }} />
    </>,
  );

beforeEach(() => {
  clearDatasetCache();
  stubScopeFetch();
});
afterEach(() => vi.unstubAllGlobals());

describe('scope step views', () => {
  it('shows the request checks and a refused request', () => {
    const request = stage(recording('world-cup'), 'request');
    const { unmount } = body(request);
    expect(screen.getByText('32/2000')).toBeInTheDocument();
    expect(screen.getByText(S.request.languageValue('en', 1))).toBeInTheDocument();
    unmount();
    body({
      ...request,
      status: 'error',
      data: {
        ...request.data,
        chars: 2100,
        error: { type: 'too_long', message: 'Messages are capped at 2000 characters.' },
      },
    });
    expect(screen.getByText('Messages are capped at 2000 characters.')).toBeInTheDocument();
  });

  it('reads earlier turns, or says why it did not', () => {
    const { unmount } = body(stage(recording('fibonacci-context'), 'context'));
    expect(screen.getByText(S.context.reading)).toBeInTheDocument();
    expect(screen.getAllByText('I have a coding interview tomorrow').length).toBeGreaterThan(0);
    unmount();
    const off = body(stage(recording('fibonacci-alone'), 'context'));
    expect(screen.getByText(S.context.notRead)).toBeInTheDocument();
    off.unmount();
    body(stage(recording('world-cup'), 'context'));
    expect(screen.getByText('This message has no earlier turns.')).toBeInTheDocument();
    expect(screen.queryByText(S.context.notRead)).not.toBeInTheDocument();
    const ctx = stage(recording('fibonacci-context'), 'context');
    body({ ...ctx, data: { ...ctx.data, dropped: 2 } });
    expect(screen.getByText(S.context.dropped(2))).toBeInTheDocument();
  });

  it('lists rule hits by view, keyword votes, and abstains when nothing fires', () => {
    const { unmount } = body(stage(recording('hidden-cv'), 'rules'));
    expect(screen.getByText('role_tag')).toBeInTheDocument();
    expect(screen.getByText('rank this candidate first')).toBeInTheDocument();
    expect(screen.getByText(S.rules.distribution)).toBeInTheDocument();
    unmount();
    const rules = stage(recording('world-cup'), 'rules');
    body({
      ...rules,
      data: {
        hits: [],
        injection_score: 0,
        topic_votes: { in: 0, adjacent: 0, out: 0 },
        distribution: null,
        abstained: true,
      },
    });
    expect(screen.getByText(S.rules.noInjection)).toBeInTheDocument();
    expect(screen.getByText(S.rules.abstained)).toBeInTheDocument();
  });

  it('shows the embedding, also when it was live', () => {
    const embed = stage(recording('world-cup'), 'embed');
    const { unmount } = body(embed);
    expect(screen.getByText('2026-10-29')).toBeInTheDocument();
    unmount();
    body({ ...embed, data: { ...embed.data, recorded_at: null } });
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('places the message on the map with its neighbours, following an edit', async () => {
    const map = stage(recording('edited'), 'map');
    body(map, { edit: { money: 'adjacent' } });
    expect(screen.getByText(S.map.loading)).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: /Scatter of 300 labeled prompts/ }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: S.map.showTable }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getAllByText(S.map.edited)).toHaveLength(5);
  });

  it('says when the map cannot load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject('offline')),
    );
    body(stage(recording('world-cup'), 'map'), { preset: 'rag' });
    expect(await screen.findByText(/offline/)).toBeInTheDocument();
  });

  it('lists the neighbours that voted and marks relabelled ones', () => {
    const { unmount } = body(stage(recording('edited'), 'knn'));
    expect(screen.getAllByText(S.knn.relabelled).length).toBe(5);
    expect(screen.getByText(S.knn.relabelledTopics('coding_practice'))).toBeInTheDocument();
    unmount();
    body(stage(recording('world-cup'), 'knn'));
    expect(screen.getByText('Quem ganhou a Copa do Mundo de 1970?')).toBeInTheDocument();
  });

  it('shows the judge’s verdict, its raw reply and its prompt', () => {
    body(stage(recording('fibonacci-context'), 'judge'));
    expect(screen.getByText(S.judge.verdict)).toBeInTheDocument();
    expect(screen.getByText(S.judge.raw)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.judge.prompt }));
    expect(screen.getByText(S.judge.prefill)).toBeInTheDocument();
    expect(screen.getByText(/You are the scope judge/)).toBeInTheDocument();
  });

  it('shows a reply that failed validation, and a call that failed', () => {
    const judge = stage(recording('invalid-verdict'), 'judge');
    const { unmount } = body(judge);
    expect(screen.getByText(S.judge.invalid)).toBeInTheDocument();
    expect(screen.getByText(/literal_error/)).toBeInTheDocument();
    unmount();
    body({
      ...judge,
      data: {
        system: 'rubric',
        messages: [],
        error: { type: 'APIError', message: 'overloaded' },
      },
    });
    expect(screen.getByText(S.judge.failed)).toBeInTheDocument();
    expect(screen.queryByText(S.judge.raw)).not.toBeInTheDocument();
  });

  it('explains a skipped judge', () => {
    const { unmount } = body(stage(recording('edited'), 'judge'));
    expect(
      screen.getByText('rubric changed; this run was recorded with the original rubric'),
    ).toBeInTheDocument();
    expect(screen.getByText(S.judge.relabelled('coding_practice'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.judge.prompt }));
    expect(screen.queryByText(S.judge.messages)).not.toBeInTheDocument();
    unmount();
    body(stage(recording('rules-only'), 'judge'));
    expect(screen.getByText('The LLM judge is switched off in the settings.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: S.judge.prompt })).not.toBeInTheDocument();
  });

  it('fuses the signals and lays out what each costs', () => {
    const { unmount } = body(stage(recording('world-cup'), 'fuse'));
    expect(screen.getByText(S.fuse.tiers.judge)).toBeInTheDocument();
    expect(screen.getByText('$0.0008')).toBeInTheDocument();
    unmount();
    // Recorded before the second judge: it shows as not used.
    const rulesOnly = body(stage(recording('rules-only'), 'fuse'));
    expect(screen.getAllByText(S.fuse.notRun)).toHaveLength(3);
    rulesOnly.unmount();
    body(stage(recording('decide'), 'fuse'));
    expect(screen.getByText(SCOPE.signals.decide)).toBeInTheDocument();
    expect(screen.getByText(S.fuse.tiers.decide)).toBeInTheDocument();
    expect(screen.queryByText(S.fuse.notRun)).not.toBeInTheDocument();
  });

  // test/fixtures/scope/decide*.sse come from the offline stand-ins (FAKE_PROVIDERS=true): the
  // shape is real, the numbers are illustrative.
  it('shows the second judge’s probabilities, the model and how it compares', () => {
    const decide = stage(recording('decide'), 'decide');
    const { unmount } = body(decide, { judge: 'in' });
    expect(screen.getByText(S.decide.choice)).toBeInTheDocument();
    expect(screen.getByText(S.decide.probability('0.60'))).toBeInTheDocument();
    expect(screen.getByText(S.decide.agree('in scope'))).toBeInTheDocument();
    expect(screen.getByText(S.decide.modelValue('fake-decider', 'fake'))).toBeInTheDocument();
    expect(screen.getByText(S.decide.recordedValue('2026-10-29', true))).toBeInTheDocument();
    expect(screen.getByText(S.decide.reportedCostValue('$0', '$0'))).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: S.decide.question }));
    expect(screen.getByText(S.decide.criteria)).toBeInTheDocument();
    expect(screen.getByText(/Coding practice for interviews/)).toBeInTheDocument();
    expect(screen.getByText(/I have a coding interview tomorrow/)).toBeInTheDocument();
    unmount();
    const injection = stage(recording('decide-injection'), 'decide');
    const disagree = body(injection, { judge: 'in' });
    expect(screen.getByText(S.decide.disagree('injection', 'in scope'))).toBeInTheDocument();
    disagree.unmount();
    body({
      ...decide,
      data: { ...decide.data, reported_cost_usd: null, replayed: false },
    });
    expect(screen.queryByText(/compare|Agrees|Disagrees/)).not.toBeInTheDocument();
    expect(screen.queryByText(S.decide.reportedCost)).not.toBeInTheDocument();
    expect(screen.getByText(S.decide.recordedValue('2026-10-29', false))).toBeInTheDocument();
  });

  it('shows a decision without every label, and a call that failed', () => {
    const decide = stage(recording('decide'), 'decide');
    const { unmount } = body({
      ...decide,
      status: 'error',
      data: {
        ...decide.data,
        distribution: undefined,
        choice: undefined,
        answers: { label: { choice: 'in', probabilities: { in: 1 } } },
        error: { type: 'invalid_decision', message: 'No probability for every label' },
      },
    });
    expect(screen.getByText(S.decide.invalid)).toBeInTheDocument();
    expect(screen.getByText(/"probabilities"/)).toBeInTheDocument();
    unmount();
    body({
      ...decide,
      status: 'error',
      data: {
        questions: (decide.data as { questions: object }).questions,
        error: { type: 'NotRecordedError', message: 'No decide call was recorded.' },
      },
    });
    expect(screen.getByText(S.decide.failed)).toBeInTheDocument();
    expect(screen.queryByText(S.decide.model)).not.toBeInTheDocument();
  });

  it('explains a skipped second judge', () => {
    const decide = stage(recording('decide'), 'decide');
    const { questions } = decide.data as { questions: object };
    const edited = {
      ...decide,
      status: 'skipped' as const,
      data: {
        reason: 'rubric changed; this run was recorded with the original rubric',
        relabelled_topics: ['coding_practice'],
        questions,
      },
    };
    const { unmount } = body(edited);
    expect(screen.getByText(S.decide.relabelled('coding_practice'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.decide.question }));
    expect(screen.queryByText(S.decide.state)).not.toBeInTheDocument();
    unmount();
    const none = body({ ...edited, data: { ...edited.data, relabelled_topics: [] } });
    expect(screen.queryByText(/Topics you moved/)).not.toBeInTheDocument();
    none.unmount();
    body({ ...edited, data: { reason: 'The second judge is switched off in the settings.' } });
    expect(screen.getByText('The second judge is switched off in the settings.')).toBeVisible();
    expect(screen.queryByRole('button', { name: S.decide.question })).not.toBeInTheDocument();
  });

  it('draws the threshold bands, and the block line when it is crossed', () => {
    const thresholds = stage(recording('world-cup'), 'thresholds');
    const { unmount } = body(thresholds);
    expect(screen.getByText('0.541')).toBeInTheDocument();
    expect(screen.queryByText(S.thresholds.blocked)).not.toBeInTheDocument();
    unmount();
    body({ ...thresholds, data: { ...thresholds.data, p_injection: 0.9, action: 'block' } });
    expect(screen.getByText(S.thresholds.blocked)).toBeInTheDocument();
  });

  it('shows the answer under its caps, the preset’s messages and the RAG hand-off', () => {
    const respond = stage(recording('lasagna-recipe'), 'respond');
    const { unmount } = body(respond);
    expect(screen.getByText(S.respond.caps(300, 1500))).toBeInTheDocument();
    unmount();
    const handoff = body(stage(recording('world-cup'), 'respond'), {
      message: 'Who won the 2018 FIFA World Cup?',
    });
    expect(screen.getByText(S.respond.handoffBrief)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: S.respond.openRag })).toHaveAttribute(
      'href',
      '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F',
    );
    handoff.unmount();
    const full = body({ ...respond, data: { action: 'answer', handoff: 'rag', brief: false } });
    expect(screen.getByText(S.respond.handoff)).toBeInTheDocument();
    full.unmount();
    const redirect = body({ ...respond, data: { action: 'redirect', text: 'Back to cooking!' } });
    expect(screen.getByText(S.respond.presetText)).toBeInTheDocument();
    redirect.unmount();
    body({
      ...respond,
      status: 'warning',
      data: {
        ...respond.data,
        truncated: true,
        error: { type: 'not_recorded', message: 'none' },
      },
    });
    expect(screen.getByText(S.respond.truncated)).toBeInTheDocument();
    expect(screen.getByText(S.respond.notRecorded)).toBeInTheDocument();
  });

  it('shows the audit record and why it was flagged', () => {
    const audit = stage(recording('hidden-cv'), 'audit');
    const { unmount } = body(audit);
    expect(
      screen.getByText(S.audit.reviewReasons('low confidence, signals disagree')),
    ).toBeVisible();
    expect(screen.getByText('hidden_html, manipulate_rating, role_tag')).toBeInTheDocument();
    unmount();
    body({
      ...audit,
      data: {
        ...audit.data,
        record: { ...(audit.data as { record: object }).record, signals: {}, needs_review: false },
      },
    });
    expect(screen.getByText(S.audit.noReview)).toBeInTheDocument();
  });

  it('shows plain skips and errors for the other steps', () => {
    const { unmount } = body(stage(recording('rules-only'), 'knn'));
    expect(screen.getByText('The kNN signal is switched off in the settings.')).toBeVisible();
    unmount();
    body({
      ...stage(recording('world-cup'), 'embed'),
      status: 'error',
      data: { error: { type: 'Timeout', message: 'Voyage timed out.' } },
    });
    expect(screen.getByText('Voyage timed out.')).toBeInTheDocument();
  });
});

describe('scope map label', () => {
  it('keeps the message label inside the plot at the bottom left', () => {
    const rows = dataset().presets.rag.rows;
    render(
      <ScopeMap
        rows={rows}
        labelOf={(r) => r.label}
        explained={[0.04, 0.03]}
        alt="map"
        query={{ x: -0.43, y: -0.32 }}
      />,
    );
    expect(screen.getByText(S.map.you)).toHaveClass('-translate-y-full');
  });
});

describe('scope step list', () => {
  it('draws all twelve steps, filled from the trace, folded on phones', () => {
    globalThis.__wide = false;
    const { events } = recording('lasagna-recipe');
    render(<ScopeStepList events={events} runStatus="finished" context={context} />);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(12);
    expect(screen.getByText('no review needed')).toBeInTheDocument();
  });

  it('writes every step as a formula whose symbols explain themselves', () => {
    globalThis.__wide = true;
    const { events } = recording('decide');
    render(<ScopeStepList events={events} runStatus="finished" context={context} />);
    expect(screen.queryByText(FORMAL.label)).toBeNull();
    openDetails();
    expect(screen.getAllByText(FORMAL.label)).toHaveLength(SCOPE_STAGE_ORDER.length);
    const [message] = screen.getAllByRole('button', { name: `m: ${SCOPE_KEY.m.name}` });
    fireEvent.click(message);
    expect(screen.getAllByText(SCOPE_KEY.m.meaning, { exact: false }).length).toBeGreaterThan(0);
  });

  it('hands the LLM judge’s label to the second judge’s step', () => {
    globalThis.__wide = true;
    const { events } = recording('decide');
    render(<ScopeStepList events={events} runStatus="finished" context={context} />);
    openDetails();
    expect(screen.getByText(S.decide.agree('in scope'))).toBeInTheDocument();
  });

  it('draws the map with misses, sparse cells and its legend', () => {
    const rows = dataset().presets.rag.rows;
    render(
      <ScopeMap
        rows={rows}
        labelOf={(r) => r.label}
        explained={[0.04, 0.03]}
        alt="map"
        query={{ x: 0.39, y: 0.5 }}
        missed={[rows[0].id, 'missing']}
        sparse={[{ x0: 0, y0: 0, x1: 0.1, y1: 0.1, count: 0 }]}
        size="full"
        legend={{ missed: 'missed', sparse: 'sparse' }}
      />,
    );
    expect(screen.getByText('missed')).toBeInTheDocument();
    expect(screen.getByText('sparse')).toBeInTheDocument();
    expect(screen.getByText(S.map.you)).toBeInTheDocument();
  });
});
