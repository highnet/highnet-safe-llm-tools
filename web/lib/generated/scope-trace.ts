/* Generated from scope/src/highnet_scope/trace.py by `npm run gen:types`. Do not edit. */

export type RunId = string;
export type Status = 'ok' | 'error' | 'limited';
export type Ms = number;
export type Tokens = number;
export type CostUsd = number;
export type Stages = number;
export type RunId1 = string;
/**
 * Emission order within the run, starting at 1.
 */
export type Seq = number;
export type Stage =
  | 'request'
  | 'context'
  | 'rules'
  | 'embed'
  | 'map'
  | 'knn'
  | 'judge'
  | 'decide'
  | 'fuse'
  | 'thresholds'
  | 'respond'
  | 'audit';
export type Status1 = 'ok' | 'skipped' | 'error' | 'warning';
/**
 * Parent agent_step id (agentic mode).
 */
export type Parent = string | null;
/**
 * Step number shown on the pad, e.g. '5' or '4b'.
 */
export type Label = string;
/**
 * Wall time of this stage in milliseconds.
 */
export type Ms1 = number;
/**
 * Tokens billed by this stage.
 */
export type Tokens1 = number;
/**
 * Cost of this stage in USD.
 */
export type CostUsd1 = number;

export interface ScopeTraceEvents {
  [k: string]: unknown;
}
/**
 * SSE `event: done` - always the last event of a run.
 *
 * This interface was referenced by `ScopeTraceEvents`'s JSON-Schema
 * via the `definition` "RunDone".
 */
export interface RunDone {
  run_id: RunId;
  status: Status;
  ms: Ms;
  tokens: Tokens;
  cost_usd: CostUsd;
  stages: Stages;
}
/**
 * SSE `event: trace` from `/api/scope/run`.
 *
 * This interface was referenced by `ScopeTraceEvents`'s JSON-Schema
 * via the `definition` "ScopeTraceEvent".
 */
export interface ScopeTraceEvent {
  run_id: RunId1;
  seq: Seq;
  stage: Stage;
  status: Status1;
  parent: Parent;
  label: Label;
  data: Data;
  ms: Ms1;
  tokens: Tokens1;
  cost_usd: CostUsd1;
}
export interface Data {
  [k: string]: unknown;
}
