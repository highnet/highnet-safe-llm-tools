import type { StepStatus } from '@/components/pipeline/StatusMark';
import type { ScopeTraceEvent, Stage } from '@/lib/generated/scope-trace';
import generated from '@/lib/generated/snippets.json';
import type { Snippet } from '@/lib/snippets';
import type { RunStatus } from '@/lib/use-trace-stream';

// Each step's state from the trace so far: its event's status, "running" for the first step
// still missing while the run streams, "pending" otherwise (as on the RAG pipeline).
export const scopeStatuses = (order: Stage[], events: ScopeTraceEvent[], runStatus: RunStatus) => {
  const byStage = new Map(events.map((e) => [e.stage, e]));
  const firstMissing = order.find((stage) => !byStage.has(stage));
  return (stage: Stage): StepStatus => {
    const event = byStage.get(stage);
    if (event) return event.status;
    return runStatus === 'running' && stage === firstMissing ? 'running' : 'pending';
  };
};

const SNIPPETS = generated as Record<string, Snippet[] | undefined>;

// Scope's excerpts are keyed `scope/<stage>` in the generated file (scripts/gen-snippets.mjs).
export const scopeSnippets = (stage: Stage): Snippet[] => SNIPPETS[`scope/${stage}`] ?? [];
