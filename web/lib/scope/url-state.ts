import {
  type ScopeConfig,
  SIGNALS,
  type Signal,
  type Thresholds,
  TOPIC_CLASSES,
  type TopicClass,
  type Weights,
} from './types';

// Everything a visitor can change lives in the query string, so a run can be shared by link:
// ?preset=career&example=career-fibonacci&context=0&knn=0&w_judge=0.6&t_brief=0.3&k=5
//   &edit=coding_practice:in
// Only values that differ from the defaults are written. Invalid values fall back to them.
// `view` picks the page's layout: `simple` (the plain summary, the default) or `steps` (every
// step, `?view=steps`).
export type ScopeView = 'simple' | 'steps';

export type ScopeSettings = {
  view: ScopeView;
  preset: string;
  example: string | null;
  context: boolean;
  signals: Record<Signal, boolean>;
  weights: Weights;
  thresholds: Thresholds;
  k: number;
  // The visitor's edit of the scope definition: topic id -> its new class.
  edit: Record<string, TopicClass>;
};

// Simple unless the link asks for every step.
export const parseScopeView = (search: string): ScopeView =>
  new URLSearchParams(search).get('view') === 'steps' ? 'steps' : 'simple';

export const DEFAULT_PRESET = 'career';
export const K_MAX = 15;
const THRESHOLD_KEYS: (keyof Thresholds)[] = ['block', 'answer', 'brief'];

export const defaultScopeSettings = (
  config: ScopeConfig,
  preset = DEFAULT_PRESET,
): ScopeSettings => ({
  view: 'simple',
  preset,
  example: null,
  context: true,
  signals: { rules: true, knn: true, judge: true, decide: true },
  weights: { ...config.defaults.weights },
  thresholds: { ...config.defaults.thresholds },
  k: config.defaults.k,
  edit: {},
});

const unit = (raw: string | null, fallback: number) => {
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
};

// Only moves of editable topics to a class they do not already have are kept.
export const cleanEdit = (
  config: ScopeConfig,
  presetId: string,
  edit: Record<string, string>,
): Record<string, TopicClass> => {
  const topics = config.presets.find((p) => p.id === presetId)?.topics ?? [];
  const out: Record<string, TopicClass> = {};
  for (const [topic, cls] of Object.entries(edit)) {
    const original = topics.find((t) => t.id === topic);
    if (!original || original.class === 'injection') continue;
    if (!TOPIC_CLASSES.includes(cls as TopicClass) || original.class === cls) continue;
    out[topic] = cls as TopicClass;
  }
  return out;
};

export const parseScopeUrl = (search: string, config: ScopeConfig): ScopeSettings => {
  const params = new URLSearchParams(search);
  const asked = params.get('preset') ?? '';
  const preset = config.presets.some((p) => p.id === asked)
    ? asked
    : (config.presets[0]?.id ?? DEFAULT_PRESET);
  const fallback = defaultScopeSettings(config, preset);
  const example = params.get('example');
  const k = Number(params.get('k'));
  const edit = Object.fromEntries(
    (params.get('edit') ?? '')
      .split(',')
      .filter(Boolean)
      .map((part) => part.split(':') as [string, string]),
  );
  return {
    view: parseScopeView(search),
    preset,
    example: config.examples.some((e) => e.id === example && e.preset === preset) ? example : null,
    context: params.get('context') !== '0',
    signals: Object.fromEntries(SIGNALS.map((s) => [s, params.get(s) !== '0'])) as Record<
      Signal,
      boolean
    >,
    weights: Object.fromEntries(
      SIGNALS.map((s) => [s, unit(params.get(`w_${s}`), fallback.weights[s])]),
    ) as Weights,
    thresholds: Object.fromEntries(
      THRESHOLD_KEYS.map((t) => [t, unit(params.get(`t_${t}`), fallback.thresholds[t])]),
    ) as Thresholds,
    k: Number.isInteger(k) && k >= 1 && k <= K_MAX ? k : fallback.k,
    edit: cleanEdit(config, preset, edit),
  };
};

export const editParam = (edit: Record<string, TopicClass>) =>
  Object.entries(edit)
    .map(([topic, cls]) => `${topic}:${cls}`)
    .join(',');

// The page's own link: the defaults are left out so shared links stay short.
export const scopeSearch = (settings: ScopeSettings, config: ScopeConfig): string => {
  const fallback = defaultScopeSettings(config, settings.preset);
  const params = new URLSearchParams({ preset: settings.preset });
  if (settings.view === 'steps') params.set('view', 'steps');
  if (settings.example) params.set('example', settings.example);
  if (!settings.context) params.set('context', '0');
  for (const s of SIGNALS) {
    if (!settings.signals[s]) params.set(s, '0');
    if (settings.weights[s] !== fallback.weights[s])
      params.set(`w_${s}`, String(settings.weights[s]));
  }
  for (const t of THRESHOLD_KEYS) {
    if (settings.thresholds[t] !== fallback.thresholds[t]) {
      params.set(`t_${t}`, String(settings.thresholds[t]));
    }
  }
  if (settings.k !== fallback.k) params.set('k', String(settings.k));
  const edit = editParam(settings.edit);
  if (edit) params.set('edit', edit);
  return `?${params.toString()}`;
};

// Only the view changes: the rest of the link stays exactly as it was.
export const writeScopeView = (view: ScopeView) => {
  const params = new URLSearchParams(window.location.search);
  if (view === 'steps') params.set('view', 'steps');
  else params.delete('view');
  const search = params.toString();
  window.history.replaceState(
    null,
    '',
    (search ? `?${search}` : window.location.pathname) + window.location.hash,
  );
};

export const writeScopeUrl = (settings: ScopeSettings, config: ScopeConfig) => {
  window.history.replaceState(null, '', scopeSearch(settings, config) + window.location.hash);
};

// The API's query for one replay (see scope/src/highnet_scope/api.py): every value explicit.
export const runQuery = (settings: ScopeSettings & { example: string }): string => {
  const params = new URLSearchParams({
    preset: settings.preset,
    example: settings.example,
    context: String(settings.context),
    k: String(settings.k),
  });
  for (const s of SIGNALS) {
    params.set(s, String(settings.signals[s]));
    params.set(`w_${s}`, String(settings.weights[s]));
  }
  for (const t of THRESHOLD_KEYS) params.set(`t_${t}`, String(settings.thresholds[t]));
  const edit = editParam(settings.edit);
  if (edit) params.set('edit', edit);
  return params.toString();
};

// The RAG pipeline's own link for a question (its ?q= parameter, see lib/url-state.ts).
export const ragHref = (question: string) => `/rag/?q=${encodeURIComponent(question)}`;
