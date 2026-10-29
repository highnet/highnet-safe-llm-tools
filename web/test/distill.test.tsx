import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StageFigure } from '@/components/pipeline/StageBody';
import { StepList } from '@/components/pipeline/StepList';
import { StepSheet } from '@/components/pipeline/StepSheet';
import { PlannedQueries } from '@/components/pipeline/stages/AgentPlanView';
import { Principles } from '@/components/scope/Principles';
import { COPY } from '@/content/copy';
import { SCOPE } from '@/content/scope';
import { SCOPE_LEADS } from '@/content/scope-stages';
import { AGENT_STAGE_ORDER, STAGE_LEADS, STAGES } from '@/content/stages';
import { scopeLead } from '@/lib/scope/lead';
import { stepLead } from '@/lib/step-lead';

import { ev, openDetails } from './helpers';
import { recording, stage } from './scope-fixtures';

const context = { chunks: new Map(), cited: new Set<number>(), streamedAnswer: '' };

describe('step leads (RAG)', () => {
  it('say in one plain sentence what each step did, from its trace event', () => {
    expect(
      stepLead(
        ev('request', {
          rate_limit: { remaining_minute: 4, limit_minute: 5 },
          budget: { tier: 'normal' },
        }),
      ),
    ).toBe(STAGE_LEADS.request(4, 5, 'normal'));
    expect(stepLead(ev('embed_query', { dims: 1024, model: 'voyage' }))).toBe(
      STAGE_LEADS.embed(1024, 'voyage'),
    );
    expect(
      stepLead(
        ev('map_project', { x: 0, y: 0, explained_variance: [0.1, 0.05], neighbours_2d: [] }),
      ),
    ).toBe(STAGE_LEADS.map('15.0%'));
    const hit = { chunk_id: 1, rank: 1, doc_title: 'Normans' };
    expect(stepLead(ev('bm25', { results: [{ ...hit, score: 2 }] }))).toBe(
      STAGE_LEADS.bm25(1, 'Normans', '2.00'),
    );
    expect(stepLead(ev('bm25', { results: [] }))).toBe(STAGE_LEADS.bm25None);
    expect(stepLead(ev('vector', { results: [{ ...hit, distance: 0.25 }] }))).toBe(
      STAGE_LEADS.vector(1, 'Normans', '0.2500'),
    );
    expect(stepLead(ev('vector', { results: [] }))).toBe(STAGE_LEADS.vectorNone);
    const fused = (from: object) => ({ ...hit, score: 1, from, contributions: {} });
    expect(
      stepLead(
        ev('fuse', {
          kept: 2,
          results: [
            fused({ bm25_rank: 1, vector_rank: 2 }),
            fused({ bm25_rank: null, vector_rank: 1 }),
          ],
        }),
      ),
    ).toBe(STAGE_LEADS.fuse(2, 1, 'Normans'));
    expect(stepLead(ev('fuse', { kept: 5, results: [] }))).toBe(STAGE_LEADS.fuseNone);
    expect(stepLead(ev('select_context', { chunks: [], context_tokens_approx: 0 }))).toBe(
      STAGE_LEADS.context(0, '0'),
    );
    expect(STAGE_LEADS.context(2, '300')).toContain('top 2 passages');
    expect(stepLead(ev('prompt', { input_tokens: 1200, worst_case_cost_usd: 0.01 }))).toBe(
      STAGE_LEADS.prompt('1,200', '$0.01'),
    );
    expect(
      stepLead({
        ...ev('generate', { model: 'haiku', usage: { output_tokens: 60 } }),
        cost_usd: 0.0023,
      }),
    ).toBe(STAGE_LEADS.generate('haiku', '60', '$0.0023'));
    const cites = (n: number, unused: number) =>
      ev('citations', {
        abstained: false,
        citations: Array.from({ length: n }, () => ({})),
        unused_chunk_ids: Array.from({ length: unused }, (_, i) => i),
      });
    expect(stepLead(cites(1, 1))).toBe(STAGE_LEADS.citations(1, 1));
    expect(stepLead(cites(2, 0))).toContain('citations point');
    expect(STAGE_LEADS.citations(2, 0)).toContain('0 sent were');
    expect(stepLead(ev('agent_plan', { queries: ['a'] }))).toBe(STAGE_LEADS.plan(1));
    expect(STAGE_LEADS.plan(2)).toBe('Claude split the question into 2 searches.');
    expect(STAGE_LEADS.searched(1, 3)).toBe('Claude ran 1 search and kept 3 passages.');
    expect(STAGE_LEADS.searched(2, 3)).toContain('2 searches');
    expect(stepLead(ev('agent_step', {}))).toBe('');
  });
});

describe('step leads (Scope)', () => {
  it('name the language, separate attacks from keywords, and read every step', () => {
    const rec = recording('world-cup');
    const request = stage(rec, 'request');
    expect(scopeLead(request)).toBe(SCOPE_LEADS.request(request.data.chars as number, 'English'));
    expect(scopeLead({ ...request, data: { ...request.data, language: 'und' } })).toBe(
      SCOPE_LEADS.requestUnknown(request.data.chars as number),
    );
    const rules = stage(rec, 'rules');
    const hit = (kind: string) => ({ kind, rule: 'r', view: 'raw', match: 'm', weight: 1 });
    const withHits = (hits: object[], abstained = false) =>
      scopeLead({ ...rules, data: { ...rules.data, hits, injection_score: 0.5, abstained } });
    expect(withHits([hit('injection')])).toBe(SCOPE_LEADS.rules(1, '50%'));
    expect(withHits([hit('injection'), hit('channel')])).toContain('2 attack patterns');
    expect(withHits([hit('topic')])).toBe(SCOPE_LEADS.keywords(1));
    expect(SCOPE_LEADS.keywords(2)).toContain('2 scope keywords');
    expect(withHits([], true)).toBe(SCOPE_LEADS.rulesAbstained);
    const context = stage(recording('fibonacci-context'), 'context');
    expect(scopeLead(context)).toMatch(/^Read the message together with \d+ earlier turn/);
    expect(SCOPE_LEADS.context(0)).toContain('no earlier turns');
    expect(SCOPE_LEADS.context(1)).toContain('1 earlier turn.');
    for (const name of ['embed', 'map', 'knn', 'fuse', 'thresholds', 'respond', 'audit'] as const) {
      expect(scopeLead(stage(rec, name)).length).toBeGreaterThan(10);
    }
    const thresholds = stage(rec, 'thresholds');
    expect(
      scopeLead({
        ...thresholds,
        data: {
          ...thresholds.data,
          action: 'block',
          p_injection: 0.9,
          thresholds: { block: 0.5, answer: 0.7, brief: 0.4 },
        },
      }),
    ).toBe(SCOPE_LEADS.blocked('0.90', '0.50'));
    const respond = stage(rec, 'respond');
    expect(scopeLead({ ...respond, data: { action: 'answer', handoff: 'rag' } })).toBe(
      SCOPE_LEADS.handoff('Answer'),
    );
    expect(scopeLead({ ...respond, data: { action: 'redirect' } })).toBe(
      SCOPE_LEADS.respond('Redirect'),
    );
    const audit = stage(rec, 'audit');
    expect(
      scopeLead({
        ...audit,
        data: { record: { needs_review: true }, review_reasons: ['low confidence', 'block'] },
      }),
    ).toBe(SCOPE_LEADS.audit('low confidence, block'));
    expect(scopeLead({ ...audit, data: { record: { needs_review: false } } })).toBe(
      SCOPE_LEADS.auditClean,
    );
    const embed = stage(rec, 'embed');
    expect(
      scopeLead({ ...embed, status: 'error', data: { error: { type: 'x', message: 'down' } } }),
    ).toBe('down');
    expect(
      scopeLead({
        ...request,
        status: 'error',
        data: { ...request.data, error: { type: 'x', message: 'too long' } },
      }),
    ).toBe('too long');
    expect(scopeLead({ ...embed, status: 'skipped', data: { reason: 'off' } })).toBe('off');
    expect(SCOPE.pct(0.5, 0)).toBe('50%');
  });
});

describe('step figures', () => {
  it('draw nothing when the lead says it all', () => {
    const figure = (event: ReturnType<typeof ev>, ctx = context) =>
      render(<StageFigure event={event} context={ctx} />).container;
    expect(figure(ev('request', {}))).toBeEmptyDOMElement();
    expect(figure(ev('bm25', { reason: 'x' }, 'skipped'))).toBeEmptyDOMElement();
    expect(figure(ev('vector', { results: [] }))).toBeEmptyDOMElement();
    expect(figure(ev('rerank', { fallback: 'Kept.' }, 'warning'))).toBeEmptyDOMElement();
    expect(figure(ev('select_context', { chunks: [] }))).toBeEmptyDOMElement();
    expect(
      figure(ev('map_project', { x: 0, y: 0, explained_variance: [0, 0], neighbours_2d: [] })),
    ).toBeEmptyDOMElement();
    expect(
      figure(ev('map_project', { error: { type: 'x', message: 'no map' } }, 'warning'), {
        ...context,
        chunkSet: 'medium',
      } as never),
    ).toBeEmptyDOMElement();
    const cited = ev('citations', {
      abstained: false,
      citations: [{ chunk_id: 1, rank: 1, block: 0, doc_title: 'N', cited_text: 'x' }],
      blocks: [{ text: 'A.', cited: true, citation_ids: [0] }],
      unused_chunk_ids: [],
    });
    expect(figure(cited)).toBeEmptyDOMElement();
    expect(render(<PlannedQueries queries={[]} />).container).toBeEmptyDOMElement();
  });

  it('leave the agent meters out when the plan never reported its caps', () => {
    globalThis.__wide = true;
    const events = [
      ev('request', { reason: 'x' }, 'skipped'),
      { ...ev('agent_step', { tool: 'search', input: { query: 'q' }, found: 2 }), label: '3a' },
    ];
    render(
      <StepList order={AGENT_STAGE_ORDER} events={events} runStatus="finished" context={context} />,
    );
    expect(screen.getByText(STAGE_LEADS.searched(1, 2))).toBeInTheDocument();
    expect(screen.queryByText(COPY.figures.agent.meterCaption)).toBeNull();
  });
});

describe('step details', () => {
  it('open, and write the margin note, when a link points into them', () => {
    globalThis.__wide = true;
    render(
      <ol>
        <StepSheet
          anchor="step-select_context"
          number={8}
          copy={STAGES.select_context}
          status="ok"
          lead="Sent 1 passage."
          snippets={[]}
          opensOn={/^#chunk-\d+$/}
        >
          <p id="chunk-7">passage 7</p>
        </StepSheet>
        <StepSheet anchor="other" number={9} copy={STAGES.prompt} status="ok" snippets={[]} />
      </ol>,
    );
    expect(screen.queryByText('passage 7')).toBeNull();
    act(() => {
      window.location.hash = '#elsewhere';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.queryByText('passage 7')).toBeNull();
    act(() => {
      window.location.hash = '#chunk-7';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByText('passage 7')).toBeInTheDocument();
    expect(screen.getAllByText(STAGES.select_context.why).length).toBeGreaterThan(0);
    // A second sheet without a link to follow only opens by hand.
    expect(screen.getAllByRole('button', { name: COPY.details })).toHaveLength(1);
    openDetails();
    expect(screen.getAllByText(STAGES.prompt.why).length).toBeGreaterThan(0);
    window.location.hash = '';
  });
});

describe('principles', () => {
  it('show the claims, and their reasoning and sources on request', () => {
    render(<Principles />);
    const [first] = SCOPE.principles.items;
    expect(screen.getByText(first.title)).toBeInTheDocument();
    expect(screen.queryByText(first.body)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: SCOPE.principles.more }));
    expect(screen.getByText(first.body)).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: SCOPE.principles.less }));
    expect(screen.queryByText(first.body)).toBeNull();
  });
});
