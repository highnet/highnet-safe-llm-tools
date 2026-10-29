/* Generated from evals/src/highnet_scope_evals/results.py by `npm run gen:types`. Do not edit. */

export type SchemaVersion = number;
export type StartedAt = string;
export type FinishedAt = string;
export type DurationS = number;
export type GitSha = string;
export type Illustrative = boolean;
export type BuildId = string;
export type EmbedModel = string;
export type JudgeModel = string;
export type Prompts = number;
export type K = number;
export type Labels = ('in' | 'adjacent' | 'out' | 'injection')[];
export type Method = 'rules' | 'knn' | 'judge' | 'fused';
export type FalseRefusal = number;
export type FalseRefusals = number;
export type Legitimate = number;
export type OverCompliance = number;
export type OverCompliances = number;
export type Illegitimate = number;
export type InjectionMissed = number;
export type Injections = number;
export type Accuracy = number;
export type Label = 'in' | 'adjacent' | 'out' | 'injection';
export type Support = number;
export type Predicted = number;
export type Precision = number | null;
export type Recall = number | null;
export type Classes = ClassScore[];
export type Confusion = number[][];
export type MsMedian = number;
export type UsdMean = number;
export type Calls = number;
export type Note = string;
export type Threshold = number;
export type FalseRefusal1 = number;
export type OverCompliance1 = number;
export type Sweep = SweepPoint[];
export type Abstained = number;
export type Failed = number;
export type Methods = MethodResult[];
export type Id = string;
export type Preset = string;
export type Label1 = 'in' | 'adjacent' | 'out' | 'injection';
export type Predicted1 = 'in' | 'adjacent' | 'out' | 'injection';
export type Misclassified = Misclassified1[];
export type Provider = string;
export type Model = string;
export type Calls1 = number;
export type InputTokens = number;
export type OutputTokens = number;
export type CostUsd = number;
export type Cost1 = CostLine[];
export type TotalUsd = number;

export interface ScopeEvalResults {
  schema_version: SchemaVersion;
  run: ScopeRun;
  labels: Labels;
  methods: Methods;
  misclassified: Misclassified;
  cost: Cost1;
  total_usd: TotalUsd;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "ScopeRun".
 */
export interface ScopeRun {
  started_at: StartedAt;
  finished_at: FinishedAt;
  duration_s: DurationS;
  git_sha: GitSha;
  illustrative: Illustrative;
  build_id: BuildId;
  embed_model: EmbedModel;
  judge_model: JudgeModel;
  prompts: Prompts;
  k: K;
  weights: Weights;
  thresholds: Thresholds;
}
export interface Weights {
  [k: string]: number;
}
export interface Thresholds {
  [k: string]: number;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "MethodResult".
 */
export interface MethodResult {
  method: Method;
  rates: Rates;
  classes: Classes;
  confusion: Confusion;
  by_preset: ByPreset;
  cost: Cost;
  sweep: Sweep;
  abstained: Abstained;
  failed: Failed;
}
/**
 * The two errors a scope guard trades against each other.
 *
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "Rates".
 */
export interface Rates {
  false_refusal: FalseRefusal;
  false_refusals: FalseRefusals;
  legitimate: Legitimate;
  over_compliance: OverCompliance;
  over_compliances: OverCompliances;
  illegitimate: Illegitimate;
  injection_missed: InjectionMissed;
  injections: Injections;
  accuracy: Accuracy;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "ClassScore".
 */
export interface ClassScore {
  label: Label;
  support: Support;
  predicted: Predicted;
  precision: Precision;
  recall: Recall;
}
export interface ByPreset {
  [k: string]: Rates;
}
/**
 * Per message, from the run's own calls.
 *
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "Cost".
 */
export interface Cost {
  ms_median: MsMedian;
  usd_mean: UsdMean;
  calls: Calls;
  note: Note;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "SweepPoint".
 */
export interface SweepPoint {
  threshold: Threshold;
  false_refusal: FalseRefusal1;
  over_compliance: OverCompliance1;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "Misclassified".
 */
export interface Misclassified1 {
  id: Id;
  preset: Preset;
  label: Label1;
  predicted: Predicted1;
}
/**
 * This interface was referenced by `ScopeEvalResults`'s JSON-Schema
 * via the `definition` "CostLine".
 */
export interface CostLine {
  provider: Provider;
  model: Model;
  calls: Calls1;
  input_tokens: InputTokens;
  output_tokens: OutputTokens;
  cost_usd: CostUsd;
}
