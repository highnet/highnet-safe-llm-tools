import { ArrowUpRight } from 'lucide-react';

import { EvalSection } from '@/components/evals/EvalSection';
import { Measure, MeasureList } from '@/components/evals/Measure';
import { Notice } from '@/components/site/Notice';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { formatMs, formatUsd } from '@/lib/format';
import type { MethodResult, ScopeEvalResults } from '@/lib/generated/scope-evals';
import { methodOf, scopeDetailsUrl } from '@/lib/scope/evals';
import { LABELS } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

import { ClassTag } from '../ClassTag';
import { Disclosure } from '../Disclosure';
import { SweepChart, SweepLegend } from './SweepChart';

const E = SCOPE.evals;
const integer = new Intl.NumberFormat('en');
const pct = (v: number) => SCOPE.pct(v);
const rate = (value: number, count: number, of: number) => ({ value, count, of });

// Injections missed, counted from the confusion matrix: the injection row off its diagonal.
const missed = (m: MethodResult) => {
  const row = m.confusion[LABELS.indexOf('injection')];
  return row.reduce((t, n) => t + n, 0) - row[LABELS.indexOf('injection')];
};

const RATES: {
  key: 'falseRefusal' | 'overCompliance' | 'injectionMissed' | 'accuracy';
  value: (m: MethodResult) => { value: number; count: number; of: number } | number;
}[] = [
  {
    key: 'falseRefusal',
    value: ({ rates: r }) => rate(r.false_refusal, r.false_refusals, r.legitimate),
  },
  {
    key: 'overCompliance',
    value: ({ rates: r }) => rate(r.over_compliance, r.over_compliances, r.illegitimate),
  },
  {
    key: 'injectionMissed',
    value: (m) => rate(m.rates.injection_missed, missed(m), m.rates.injections),
  },
  { key: 'accuracy', value: (m) => m.rates.accuracy },
];

// The headline, phrased from the numbers: which method this run favours, and why.
type FindingProps = { results: ScopeEvalResults };

const Finding = ({ results }: FindingProps) => {
  const judge = methodOf(results, 'judge')!.rates;
  const fused = methodOf(results, 'fused')!.rates;
  const rules = methodOf(results, 'rules')!.rates;
  const knn = methodOf(results, 'knn')!.rates;
  const F = E.finding;
  return (
    <div className="space-y-3">
      <Typography className="text-lg leading-relaxed">
        {judge.accuracy > fused.accuracy
          ? F.judgeWins(
              pct(judge.accuracy),
              pct(fused.accuracy),
              pct(judge.injection_missed),
              pct(fused.injection_missed),
              pct(judge.over_compliance),
              pct(fused.over_compliance),
            )
          : F.fusedWins(pct(fused.accuracy), pct(judge.accuracy))}
      </Typography>
      {judge.accuracy > fused.accuracy && <Typography color="muted">{F.why}</Typography>}
      <Typography color="muted">
        {F.cheap(pct(rules.over_compliance), pct(knn.over_compliance))}
      </Typography>
    </div>
  );
};

type MethodTableProps = { method: MethodResult };

const ClassTable = ({ method }: MethodTableProps) => (
  <table className="w-full border-collapse text-sm">
    <caption className="pb-1 text-left text-sm font-semibold">
      {SCOPE.methods[method.method]}
    </caption>
    <thead>
      <tr className="voice-data border-b text-right text-xs text-muted-foreground">
        <th scope="col" className="py-1 pr-2 text-left font-medium">
          {E.classes.heads.label}
        </th>
        <th scope="col" className="py-1 pr-2 font-medium">
          {E.classes.heads.support}
        </th>
        <th scope="col" className="py-1 pr-2 font-medium">
          {E.classes.heads.precision}
        </th>
        <th scope="col" className="py-1 font-medium">
          {E.classes.heads.recall}
        </th>
      </tr>
    </thead>
    <tbody className="voice-data">
      {method.classes.map((c) => (
        <tr key={c.label} className="border-b border-dashed text-right last:border-b-0">
          <th scope="row" className="py-1.5 pr-2 text-left font-normal">
            <ClassTag label={c.label} short />
          </th>
          <td className="py-1.5 pr-2">{c.support}</td>
          <td className="py-1.5 pr-2">
            {c.precision === null ? E.classes.none : pct(c.precision)}
          </td>
          <td className="py-1.5">{c.recall === null ? E.classes.none : pct(c.recall)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ConfusionTable = ({ method }: MethodTableProps) => (
  <table className="w-full border-collapse text-sm">
    <caption className="pb-1 text-left text-sm font-semibold">
      {SCOPE.methods[method.method]}
      <span className="sr-only"> {E.confusion.caption(SCOPE.methods[method.method])}</span>
    </caption>
    <thead>
      <tr className="voice-data border-b text-right text-xs text-muted-foreground">
        <th scope="col" className="py-1 pr-2 text-left text-[11px] font-normal">
          {E.confusion.corner}
        </th>
        {LABELS.map((label) => (
          <th key={label} scope="col" className="py-1 pl-2 font-medium">
            <ClassTag label={label} short className="justify-end" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="voice-data">
      {method.confusion.map((row, i) => (
        <tr key={LABELS[i]} className="border-b border-dashed text-right last:border-b-0">
          <th scope="row" className="py-1.5 pr-2 text-left font-normal">
            <ClassTag label={LABELS[i]} short />
          </th>
          {row.map((count, j) => (
            <td
              key={LABELS[j]}
              className={cn(
                'py-1.5 pl-2',
                i === j ? 'bg-accent font-semibold' : count === 0 && 'text-muted-foreground',
              )}
            >
              {count}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

type ScopeEvalsReportProps = {
  results: ScopeEvalResults | null;
};

// Sheet 3 of Scope: the published eval run, rendered only from its result file.
const ScopeEvalsReport = ({ results }: ScopeEvalsReportProps) => {
  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-4">
        <Typography variant="sheetTitle" id="sheet-title">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {E.sheetLabel} ·
          </span>
          {E.title}
        </Typography>
        {results ? (
          <>
            <Typography color="muted" className="max-w-[68ch]">
              {E.lede(results.run.prompts)}
            </Typography>
            <dl className="voice-data flex flex-wrap gap-x-6 gap-y-2 border-y border-dashed py-3 text-sm">
              {(
                [
                  [E.record.date, results.run.started_at.slice(0, 10)],
                  [E.record.build, results.run.build_id],
                  [E.record.models, `${results.run.embed_model}, ${results.run.judge_model}`],
                  [E.record.prompts, integer.format(results.run.prompts)],
                  [E.record.k, String(results.run.k)],
                  [
                    E.record.weights,
                    Object.entries(results.run.weights)
                      .map(([s, w]) => `${s} ${w}`)
                      .join(' · '),
                  ],
                  [
                    E.record.thresholds,
                    Object.entries(results.run.thresholds)
                      .map(([t, v]) => `${t} ${v}`)
                      .join(' · '),
                  ],
                  [E.record.cost, E.record.costValue(results.total_usd)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {results.run.illustrative && <Notice tone="note">{E.illustrative}</Notice>}
          </>
        ) : (
          <Notice tone="note">{E.empty}</Notice>
        )}
      </header>

      {results && (
        <>
          <EvalSection id="finding" title={E.finding.title} notes={[]}>
            <Finding results={results} />
          </EvalSection>

          <EvalSection id="rates" title={E.rates.title} notes={E.rates.notes}>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
              {results.methods.map((m) => (
                <div key={m.method} className="min-w-0 space-y-2">
                  <Typography as="h3" className="font-semibold">
                    {SCOPE.methods[m.method]}
                  </Typography>
                  <MeasureList>
                    {RATES.map(({ key, value }) => {
                      const v = value(m);
                      return typeof v === 'number' ? (
                        <Measure key={key} label={E.rates[key]} value={v} />
                      ) : (
                        <Measure key={key} label={E.rates[key]} rate={v} />
                      );
                    })}
                  </MeasureList>
                </div>
              ))}
            </div>
          </EvalSection>

          <EvalSection id="classes" title={E.classes.title} notes={E.classes.notes}>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {results.methods.map((m) => (
                <ClassTable key={m.method} method={m} />
              ))}
            </div>
          </EvalSection>

          <EvalSection id="confusion" title={E.confusion.title} notes={E.confusion.notes}>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {results.methods.map((m) => (
                <ConfusionTable key={m.method} method={m} />
              ))}
            </div>
          </EvalSection>

          <EvalSection id="sweep" title={E.sweep.title} notes={E.sweep.notes}>
            <SweepLegend className="mb-3" />
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {results.methods.map((m) => (
                <SweepChart
                  key={m.method}
                  title={SCOPE.methods[m.method]}
                  points={m.sweep}
                  current={results.run.thresholds.brief}
                />
              ))}
            </div>
            <Disclosure show={E.sweep.showTable} hide={E.sweep.hideTable} className="mt-4">
              <div className="overflow-x-auto">
                <table className="voice-data w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b text-right text-muted-foreground">
                      <th scope="col" className="py-1 pr-2 text-left font-medium">
                        {E.sweep.heads.threshold}
                      </th>
                      {results.methods.map((m) => (
                        <th key={m.method} scope="col" className="py-1 pl-2 font-medium">
                          {SCOPE.methods[m.method]}
                          <span className="block font-normal">
                            {E.sweep.falseRefusal} / {E.sweep.overCompliance}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.methods[0].sweep.map((point, i) => (
                      <tr key={point.threshold} className="border-b border-dashed text-right">
                        <th scope="row" className="py-1 pr-2 text-left font-normal">
                          {point.threshold.toFixed(2)}
                        </th>
                        {results.methods.map((m) => (
                          <td key={m.method} className="py-1 pl-2 whitespace-nowrap">
                            {pct(m.sweep[i].false_refusal)} / {pct(m.sweep[i].over_compliance)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Disclosure>
          </EvalSection>

          <EvalSection id="cost" title={E.cost.title} notes={E.cost.notes}>
            <div className="overflow-x-auto">
              <table className="voice-data w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th scope="col" className="py-1 pr-3 text-left font-medium">
                      {E.cost.heads.method}
                    </th>
                    <th scope="col" className="py-1 pr-3 font-medium">
                      {E.cost.heads.ms}
                    </th>
                    <th scope="col" className="py-1 pr-3 font-medium">
                      {E.cost.heads.usd}
                    </th>
                    <th scope="col" className="py-1 pr-3 font-medium">
                      {E.cost.heads.calls}
                    </th>
                    <th scope="col" className="hidden py-1 text-left font-medium md:table-cell">
                      {E.cost.heads.note}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.methods.map((m) => (
                    <tr key={m.method} className="border-b border-dashed text-right">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                        {SCOPE.methods[m.method]}
                      </th>
                      <td className="py-1.5 pr-3">{formatMs(m.cost.ms_median)}</td>
                      <td className="py-1.5 pr-3">{formatUsd(m.cost.usd_mean)}</td>
                      <td className="py-1.5 pr-3">{integer.format(m.cost.calls)}</td>
                      <td className="hidden py-1.5 text-left font-sans text-muted-foreground md:table-cell">
                        {m.cost.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="voice-data w-full border-collapse text-sm">
                <caption className="pb-1 text-left font-sans text-xs text-muted-foreground">
                  {E.cost.byModel}
                </caption>
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th scope="col" className="py-1 pr-3 text-left font-medium">
                      {E.cost.modelHeads.model}
                    </th>
                    <th scope="col" className="py-1 pr-3 font-medium">
                      {E.cost.modelHeads.calls}
                    </th>
                    <th scope="col" className="hidden py-1 pr-3 font-medium sm:table-cell">
                      {E.cost.modelHeads.input}
                    </th>
                    <th scope="col" className="hidden py-1 pr-3 font-medium sm:table-cell">
                      {E.cost.modelHeads.output}
                    </th>
                    <th scope="col" className="py-1 font-medium">
                      {E.cost.modelHeads.cost}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.cost.map((line) => (
                    <tr key={line.model} className="border-b border-dashed text-right">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal break-all">
                        {line.model}
                      </th>
                      <td className="py-1.5 pr-3">{integer.format(line.calls)}</td>
                      <td className="hidden py-1.5 pr-3 sm:table-cell">
                        {integer.format(line.input_tokens)}
                      </td>
                      <td className="hidden py-1.5 pr-3 sm:table-cell">
                        {integer.format(line.output_tokens)}
                      </td>
                      <td className="py-1.5">{formatUsd(line.cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t text-right font-semibold">
                    <th scope="row" className="py-1.5 pr-3 text-left">
                      {E.cost.total}
                    </th>
                    <td colSpan={4} className="py-1.5">
                      {E.cost.totalValue(results.total_usd)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </EvalSection>

          <EvalSection id="method" title={E.method.title} notes={[]}>
            <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {E.method.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
              {results.methods
                .filter((m) => m.abstained > 0 && m.abstained !== m.failed)
                .map((m) => (
                  <li key={`a-${m.method}`}>
                    {E.method.abstained(SCOPE.methods[m.method], m.abstained)}
                  </li>
                ))}
              {results.methods
                .filter((m) => m.failed > 0)
                .map((m) => (
                  <li key={`f-${m.method}`}>{E.method.failed(m.failed)}</li>
                ))}
            </ul>
            <a
              href={scopeDetailsUrl(results.run.started_at)}
              className="voice-pencil mt-3 inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              {E.method.details}
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          </EvalSection>
        </>
      )}
    </div>
  );
};

export { ScopeEvalsReport };
