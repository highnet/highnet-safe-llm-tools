import { Notice } from '@/components/site/Notice';
import { Typography } from '@/components/ui/Typography';
import { EVALS } from '@/content/evals';
import type { HighnetRagEvalResults } from '@/lib/generated/evals';

import { AnswersSection } from './AnswersSection';
import { CompoundSection } from './CompoundSection';
import { ReportFolds } from './ReportFolds';
import { RetrievalSection } from './RetrievalSection';
import { RunCostSection, RunDetailsSection } from './RunCostSection';

// The headline, phrased from the numbers: graded answers when the run has them, otherwise the
// spread of recall@5 over every search setting, with the weakest one named.
const finding = (results: HighnetRagEvalResults) => {
  const yes = results.answers?.answerable;
  if (yes) {
    return EVALS.findingAnswers(
      EVALS.percent(yes.evidence_in_context.value),
      EVALS.percent(yes.correct.value),
      yes.questions,
    );
  }
  const { configs, questions } = results.retrieval;
  const recall = (i: number) => configs[i].recall['5'];
  const order = configs.map((_, i) => i).sort((a, b) => recall(a) - recall(b));
  const weakest = configs[order[0]];
  return EVALS.findingRetrieval(
    EVALS.percent(recall(order[0])),
    EVALS.percent(recall(order[order.length - 1])),
    questions,
    EVALS.retrieval.configName(weakest.mode, weakest.chunk_set, weakest.rerank),
  );
};

type EvalsReportProps = {
  results: HighnetRagEvalResults | null;
};

// Sheet 2: the offline eval run, rendered only from evals/results/latest.json. The headline and
// the retrieval comparison come first; answers, two-part questions, cost and the run record fold.
const EvalsReport = ({ results }: EvalsReportProps) => {
  const compound = results?.golden.find((set) => set.name === 'compound')?.questions ?? 0;
  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-4">
        <Typography variant="sheetTitle" id="sheet-title">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {EVALS.sheetLabel} ·
          </span>
          {EVALS.title}
        </Typography>
        {results ? (
          <>
            <Typography className="max-w-[68ch] text-lg">{finding(results)}</Typography>
            {results.run.illustrative && <Notice tone="note">{EVALS.illustrative}</Notice>}
          </>
        ) : (
          <Notice tone="note">
            <p className="font-semibold">{EVALS.empty.title}</p>
            <p>{EVALS.empty.body}</p>
          </Notice>
        )}
      </header>

      {results && (
        <>
          <RetrievalSection retrieval={results.retrieval} />
          <ReportFolds
            label={EVALS.foldsLabel}
            folds={[
              {
                key: 'answers',
                label: EVALS.folds.answers,
                content: <AnswersSection answers={results.answers ?? null} />,
              },
              {
                key: 'compound',
                label: EVALS.folds.compound,
                content: (
                  <CompoundSection compound={results.compound ?? null} questions={compound} />
                ),
              },
              {
                key: 'cost',
                label: EVALS.folds.cost,
                content: <RunCostSection results={results} />,
              },
              {
                key: 'run',
                label: EVALS.folds.run,
                content: <RunDetailsSection results={results} />,
              },
            ]}
          />
        </>
      )}
    </div>
  );
};

export { EvalsReport };
