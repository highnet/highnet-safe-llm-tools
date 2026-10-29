import type { ClassLabel } from '@/components/ui/ClassMark';
import type { ScopeAction } from '@/content/scope-verdict';

// The shapes Scope's API sends, mirrored from scope/src/highnet_scope (api.py, pipeline.py).
// The trace's `data` is untyped in the generated schema, so each step's payload is cast here.

export type Label = ClassLabel;
export type TopicClass = 'in' | 'adjacent' | 'out';
export type Signal = 'rules' | 'knn' | 'judge' | 'decide';
export type Distribution = Record<Label, number>;
export type Turn = { role: string; text: string };

export const LABELS: Label[] = ['in', 'adjacent', 'out', 'injection'];
export const SIGNALS: Signal[] = ['rules', 'knn', 'judge', 'decide'];
export const TOPIC_CLASSES: TopicClass[] = ['in', 'adjacent', 'out'];

export type Topic = { id: string; name: string; class: Label; keywords: string[] };

export type Preset = {
  id: string;
  name: string;
  product: string;
  description: string;
  topics: Topic[];
  redirect: string;
  block: string;
  answer_style: string;
};

export type Example = {
  id: string;
  preset: string;
  text: string;
  context: Turn[];
  note: string;
  rag_question: string | null;
};

export type Weights = Record<Signal, number>;
export type Thresholds = { block: number; answer: number; brief: number };

export type ScopeConfig = {
  presets: Preset[];
  examples: Example[];
  defaults: { weights: Weights; thresholds: Thresholds; k: number };
  models: {
    embed: { provider: string; model: string };
    judge: { provider: string; model: string };
    decide: { provider: string; model: string };
  };
  live: boolean;
  illustrative: boolean;
  recorded_at: string | null;
  max_chars: number;
};

type Recorded = { recorded_at: string | null; replayed: boolean };
type StepError = { error?: { type: string; message: string } };

export type RequestData = StepError & {
  preset: string;
  message: string;
  chars: number;
  max_chars: number;
  language: string;
  language_words: number;
  rate_limit: {
    remaining_minute: number;
    remaining_day: number;
    limit_minute: number;
    limit_day: number;
  };
  // Runs recorded before the second judge existed name only the embedder and the judge.
  models: Partial<ScopeConfig['models']> & Pick<ScopeConfig['models'], 'embed' | 'judge'>;
};

export type SkippedData = { reason: string; turns?: Turn[]; relabelled_topics?: string[] };

export type ContextData = { turns: Turn[]; dropped: number; reading: string };

export type RuleHit = {
  rule: string;
  kind: 'injection' | 'channel' | 'topic';
  view: string;
  match: string;
  weight: number;
  label: Label | null;
  topic: string | null;
};

export type RulesData = {
  hits: RuleHit[];
  injection_score: number;
  topic_votes: Record<TopicClass, number>;
  distribution: Distribution | null;
  abstained: boolean;
};

export type EmbedData = Recorded & {
  model: string;
  input: string;
  dims: number;
  vector_preview: number[];
  norm: number;
};

export type MapData = {
  x: number;
  y: number;
  explained_variance: [number, number];
  points: number;
  neighbours_2d: string[];
};

export type Neighbour = {
  id: string;
  text: string;
  topic: string;
  label: Label;
  relabelled: boolean;
  similarity: number;
};

export type KnnData = {
  k: number;
  neighbours: Neighbour[];
  distribution: Distribution;
  relabelled_topics: string[];
};

export type JudgeData = StepError &
  Partial<Recorded> & {
    system: string;
    messages?: { role: string; content: string }[];
    model?: string;
    max_tokens?: number;
    raw?: string;
    verdict?: { label: Label; confidence: number; reason: string };
    distribution?: Distribution;
    reason?: string;
    relabelled_topics?: string[];
  };

// The second judge's one typed question: the scope definition as a criterion per label.
export type DecisionQuestions = {
  label: { type: 'choice'; instructions: string; criteria: Record<Label, string> };
};

export type DecideData = StepError &
  Partial<Recorded> & {
    state?: { message: string; conversation?: Turn[] };
    questions?: DecisionQuestions;
    provider?: string;
    model?: string;
    // The reply as the gateway sent it.
    answers?: { label?: { choice?: string; probabilities?: Partial<Record<Label, number>> } };
    // The gateway's own cost figure for the call, when it reports one (ours is the event's).
    reported_cost_usd?: number | null;
    distribution?: Distribution;
    choice?: Label;
    reason?: string;
    relabelled_topics?: string[];
  };

export type Tradeoff = {
  per_signal: Partial<Record<Signal, { ms: number; cost_usd: number }>>;
  cumulative: { signals: Signal[]; ms: number; cost_usd: number }[];
};

export type FuseData = {
  weights: Weights;
  used_weights: Partial<Weights>;
  // Runs recorded before the second judge existed have no `decide` entry.
  signals: Partial<Record<Signal, Distribution | null>>;
  contributions: Partial<Record<Signal, Distribution>>;
  distribution: Distribution;
  label: Label;
  confidence: number;
  tradeoff: Tradeoff;
};

export type ThresholdsData = {
  thresholds: Thresholds;
  p_injection: number;
  scope_score: number;
  action: ScopeAction;
};

export type RespondData = StepError &
  Partial<Recorded> & {
    action: ScopeAction;
    text?: string;
    max_tokens?: number;
    max_chars?: number;
    model?: string;
    truncated?: boolean;
    handoff?: 'rag';
    rag_question?: string | null;
    brief?: boolean;
  };

export type AuditData = {
  stored: boolean;
  record: {
    run_id: string;
    preset: string;
    message_sha256: string;
    action: ScopeAction;
    label: Label;
    confidence: number;
    scope_score: number;
    signals: Partial<Record<Signal, Label>>;
    rule_hits: string[];
    rubric: string;
    relabelled_topics: string[];
    needs_review: boolean;
  };
  review_reasons: string[];
};

// public/scope/dataset.json: the labeled prompts with their map positions, per preset.
export type DatasetRow = {
  id: string;
  label: Label;
  topic: string;
  text: string;
  context: Turn[];
  tags: string[];
  lang: string;
  x: number;
  y: number;
};

export type Dataset = {
  build: { build_id: string; built_at: string; embed_model: string; prompts: string };
  drafted_by: string;
  presets: Record<string, { explained_variance: [number, number]; rows: DatasetRow[] }>;
};
