import type { KeyEntry } from '@/content/formal';

// English copy for the Scope pages (/scope/, /scope/dataset/, /scope/evals/, /scope/coverage/).
// Voice: the same precise lab partner as the RAG pipeline. Plain, exact, first-person plural,
// numbers beat adjectives, no hype. Every number shown is passed in from a trace or a result file.

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en')} ${n === 1 ? one : many}`;

export const SCOPE = {
  pct,
  plural,
  labels: {
    in: 'in scope',
    adjacent: 'adjacent',
    out: 'off scope',
    injection: 'injection',
  },
  labelsShort: { in: 'in', adjacent: 'adj.', out: 'out', injection: 'inj.' },
  signals: { rules: 'Rules', knn: 'kNN', judge: 'LLM judge', decide: 'Decision model' },
  methods: {
    rules: 'Rules',
    knn: 'kNN',
    judge: 'LLM judge',
    decide: 'Decision model (Jev)',
    fused: 'Fused',
  },
  // The same methods inside a sentence.
  methodsInProse: {
    rules: 'the rules',
    knn: 'kNN',
    judge: 'the LLM judge',
    decide: 'the decision model',
    fused: 'the fused pipeline',
  },

  hero: {
    title: 'Watch an AI agent decide whether a message is in scope, step by step.',
    term: 'Scope guard',
    expansion: 'the check before an agent answers',
    definition:
      'A product agent is built for one job. A scope guard reads each message first and picks one of four actions: answer it, answer it briefly, redirect it warmly back to the job, or block it when it tries to take over the agent.',
    intro:
      'We run each message through twelve steps: cheap rules, a nearest-neighbour vote over 1,200 labeled prompts, an LLM judge and a second judge, a decision model, fused into one decision you can see the arithmetic of. The runs were recorded once; every setting you change is recomputed from them at no cost.',
    action: 'Try a message',
    dataset: 'Browse the labeled prompts',
  },

  diagram: {
    title: 'The whole guard on one page',
    offline: 'Built once, ahead of time',
    offlineSteps: [
      '1,200 labeled prompts',
      'embedded by Voyage',
      'map fitted (PCA)',
      'stored in SQLite',
    ],
    online: 'Every message',
    result: 'One action',
    note: 'Rules, kNN, the LLM judge and the decision model are four independent signals; each can be switched off below. Fusion averages the ones that ran, and two thresholds turn the average into one of the four actions.',
  },

  principles: {
    title: 'What we hold to',
    items: [
      {
        title: 'Off scope and prompt injection are different problems.',
        body: 'A message about lasagna sent to a career agent is a product question: the visitor is not attacking anything, the product just is not for that. A message that tells the agent to ignore its instructions is a security question. We score them as separate classes and answer them differently.',
      },
      {
        title: 'Redirect warmly instead of refusing.',
        body: 'An off-scope visitor gets a friendly pointer back to what the product does, not a wall. And a guard that refuses good messages is failing too, so we measure false refusals as seriously as attacks that get through: the evals put both rates side by side.',
      },
      {
        title: 'Filters alone fail against adaptive attackers.',
        body: 'Every check on this page can be paraphrased around by someone who keeps trying. Real safety comes from the architecture around the model: least privilege for its tools, documents treated as data and never as instructions, and untrusted content kept apart from anything that can act.',
        links: [
          {
            href: 'https://simonwillison.net/2023/Apr/25/dual-llm-pattern/',
            text: 'Simon Willison: the Dual LLM pattern',
          },
          {
            href: 'https://arxiv.org/abs/2503.18813',
            text: 'Google DeepMind: CaMeL, defeating prompt injections by design',
          },
        ],
      },
    ],
  },

  sheetLabel: 'Sheet 1',
  emptyTitle: 'Pick a message to check',
  starting: 'Starting the API… the first request can take a few seconds.',
  offline: 'We could not reach the API.',
  retry: 'Try again',
  stop: 'Stop',
  replayNotice: (date: string) =>
    `These runs were recorded on ${date} with the real models. Picking a message replays its run; every setting below is recomputed from that recording, so nothing is spent and no model is called.`,
  replayUndated:
    'These runs are recordings: picking a message replays its run and nothing is spent.',
  illustrative:
    'Illustrative data: this server runs with stand-in models, so labels, scores and costs are not real.',
  streamErrors: {
    closed: 'The connection to the API closed before the run finished.',
    stopped: 'You stopped this run.',
  },

  presets: {
    label: 'Product',
    describe: (product: string) => `Guarding ${product}.`,
  },

  picker: {
    title: 'Pick a message',
    groups: {
      rag: 'Questions the RAG pipeline recorded',
      context: 'With earlier turns',
      single: 'One message',
    },
    more: (n: number) => `${n} more`,
    fewer: 'Show fewer',
    turns: (n: number) => `after ${plural(n, 'earlier turn')}`,
    empty: 'This preset has no recorded messages.',
  },

  settings: {
    summary: 'Settings',
    signals: 'Signals',
    weights: 'Fusion weights',
    weightsNote: 'Relative: they are rescaled over the signals that run.',
    thresholds: 'Thresholds',
    k: 'Neighbours (k)',
    fewer: 'Fewer neighbours',
    more: 'More neighbours',
    context: 'Earlier turns',
    contextOptions: { on: 'read', off: 'ignore' },
    thresholdNames: {
      block: 'Block at P(injection) ≥',
      answer: 'Answer at scope ≥',
      brief: 'Answer briefly at scope ≥',
    },
    reset: 'Reset settings',
    short: {
      off: (names: string) => `${names} off`,
      k: (k: number) => `k=${k}`,
      context: 'no context',
      changed: 'tuned',
    },
  },

  editor: {
    title: 'Scope definition',
    summary: (inScope: number, adjacent: number, out: number) =>
      `${inScope} in · ${adjacent} adjacent · ${out} off scope · injection fixed`,
    moved: (n: number) => `${plural(n, 'topic')} moved`,
    open: 'Edit the scope definition',
    close: 'Close the editor',
    intro:
      'Move a topic to another class and its labeled prompts change label with it: the kNN vote and the keyword rules follow at once. Both judges were recorded with the original definition, so after any change their steps are skipped rather than guessed.',
    topic: 'Topic',
    keywords: 'Keywords',
    injection: 'Prompt injection is not a scope decision; it stays fixed.',
    reset: 'Reset to the original',
    judgeSkipped: 'Both judges will be skipped: their recordings used the original definition.',
    changedFrom: (label: string) => `was ${label}`,
  },

  bridge: {
    title: 'Scope first, then RAG',
    intro:
      'This preset guards the RAG pipeline’s question box. Two different reasons a question may not get a full answer:',
    notInCorpus: {
      title: 'Let through, but not in the corpus.',
      body: 'An encyclopedia question about something outside the 35 articles is still the kind this assistant is for, so the guard should let it through; then retrieval finds nothing relevant and RAG says so instead of making something up.',
      link: 'See RAG abstain on it',
      verdict: (action: string, judge: string) =>
        `In the recorded run Scope chose “${action}”. The judge labelled it ${judge}; the rules and the neighbours carried it through.`,
      verdictAgree: (action: string, judge: string) =>
        `In the recorded run Scope chose “${action}”, and the judge labelled it ${judge}.`,
      verdictNoJudge: (action: string) => `In the recorded run Scope chose “${action}”.`,
      replay: 'Replay it here',
    },
    offScope: {
      title: 'Off scope.',
      body: 'A recipe request is not an encyclopedia question at all, so Scope redirects it before any search runs.',
      replay: 'Replay it here',
    },
  },

  // The switch between the plain summary and the full working (?view=simple).
  view: {
    label: 'Show',
    simple: 'Simple',
    steps: 'Every step',
  },

  // The Simple view: the same run in plain words, for readers who do not want the working.
  // No jargon here: no kNN, fusion or distribution; the advisors have everyday names.
  simple: {
    title: 'In short',
    intro: 'The same run in plain words: what came in, who voted, and what the assistant does.',
    empty: 'Pick a message above to see what the assistant decides.',
    deciding: 'Working it out…',
    message: 'The message',
    earlier: 'Said earlier in the conversation',
    outcome: 'What the assistant does',
    outcomes: {
      answer: 'This is what the assistant is for, so it answers.',
      answer_briefly: 'This is close to what the assistant is for, so it answers in a few lines.',
      redirect: 'Not what this assistant is for, so it points you back, politely.',
      block: 'This looks like an attempt to trick the assistant, so it refuses.',
    },
    // The four classes as an everyday word, beside the same shapes the full view uses.
    labels: {
      in: 'in scope',
      adjacent: 'close to scope',
      out: 'off scope',
      injection: 'a trick',
    },
    voters: 'Who voted',
    votersNote:
      'Four advisors read the message on their own. Each leans one way, some more sure than others.',
    advisors: {
      rules: 'The checklist',
      knn: 'Similar messages',
      judge: 'The AI judge',
      decide: 'The decision model',
    },
    advisorHelp: {
      rules: 'looks for known tricks and topic words',
      knn: 'the labelled example messages that read most alike',
      judge: 'an AI model that reads what this assistant is for',
      decide: 'a second AI model that gives odds for each answer',
    },
    sure: (pct: string) => `${pct} sure`,
    notRun: {
      off: 'Didn’t vote: switched off in the settings.',
      edited:
        'Didn’t vote: you changed what the assistant is for, and its recording used the original.',
      abstained: 'Didn’t vote: nothing on its list matched.',
      other: 'Didn’t vote on this message.',
      notRecorded: 'Left out: there is no recording of it for this message yet.',
      failed: 'Left out: it ran into a problem on this message.',
      waiting: 'Waiting…',
    },
    combinedTitle: 'Combined',
    combined: (votes: string, pct: string) =>
      `Weighing ${votes} together gives this lean, ${pct} sure. Then the assistant checks how far the combined vote leans towards what it is for: far enough for a full answer, partly for a short one, too little for a redirect. A strong lean towards a trick blocks the message.`,
    votes: (n: number) => plural(n, 'vote'),
    reply: 'What it says back',
    handoff:
      'It hands the question to the RAG pipeline, which looks for the answer in its 35 articles.',
    handoffBrief:
      'It hands the question to the RAG pipeline for a short answer from its 35 articles.',
    openRag: 'Ask the RAG pipeline',
    noReply: 'There is no recorded reply for these settings.',
    every: 'Show every step',
    settings: 'Change the settings',
    settingsNote: 'Settings and the scope definition live in the every-step view.',
    stopped: 'The run stopped before the assistant decided.',
  },

  workingLabel: 'The working',
  workingNote: (n: number) => `${n} steps, top to bottom`,
  announce: (label: string, title: string, status: string, ms: string) =>
    `Step ${label}, ${title}: ${status}, ${ms}.`,

  result: {
    label: 'The decision',
    scope: 'scope score',
    injection: 'P(injection)',
    totals: 'Recorded totals',
    steps: (n: number) => `${n} steps`,
  },

  summary: {
    request: (chars: number, language: string) => `${chars} chars · ${language}`,
    turns: (n: number) => plural(n, 'turn'),
    rules: (hits: number, p: string) => `${plural(hits, 'hit')} · P(injection) ${p}`,
    abstained: 'no rule fired: abstained',
    embed: (dims: number) => `${dims.toLocaleString('en')} dimensions`,
    map: (x: string, y: string) => `x ${x}, y ${y}`,
    knn: (label: string, share: string) => `vote: ${label} ${share}`,
    judge: (label: string, confidence: string) => `${label} · confidence ${confidence}`,
    judgeError: 'reply failed validation',
    decide: (label: string, p: string) => `${label} · p ${p}`,
    decideError: 'no usable reply: dropped out',
    fuse: (label: string, share: string) => `${label} ${share}`,
    thresholds: (action: string, score: string) => `${action} · scope ${score}`,
    respond: (action: string) => action,
    audit: (review: boolean) => (review ? 'flagged for review' : 'no review needed'),
  },

  steps: {
    request: {
      minute: 'This minute',
      day: 'Today',
      length: 'Length',
      language: 'Language guess',
      languageValue: (lang: string, words: number) =>
        `${lang} (${plural(words, 'common word')} matched)`,
      models: 'Models',
      caption:
        'Requests used against the rate limits, and the message’s length against its cap. The language guess only labels the run.',
      alt: (minute: string, day: string, chars: string) =>
        `Requests this minute: ${minute}. Today: ${day}. Length: ${chars} characters.`,
    },
    context: {
      notRead: 'Not read in this run:',
      dropped: (n: number) => `${plural(n, 'older turn')} dropped (only the last four are read).`,
      reading: 'What the next steps read',
    },
    rules: {
      injection: 'P(injection) from the rules',
      injectionCaption:
        'Hits combine as independent evidence: P = 1 − ∏(1 − weight). The tick marks the block threshold.',
      hits: 'Rule hits',
      heads: { rule: 'Rule', view: 'View', match: 'Match', weight: 'Weight' },
      noInjection: 'No injection rule fired in any of the four views.',
      votes: 'Keyword votes',
      votesNote: (n: number) => `${plural(n, 'keyword')} from the scope definition matched.`,
      abstained:
        'No rule and no keyword fired, so the rules abstain: they add nothing to the fusion.',
      distribution: 'The rules’ share per class',
    },
    embed: {
      caption: (shown: number, dims: number) =>
        `The first ${shown} of the message’s ${dims.toLocaleString('en')} coordinates. Up is positive, down is negative.`,
      alt: (values: string) => `First coordinates of the message vector: ${values}.`,
      model: 'Model',
      norm: 'Length (norm)',
      recorded: 'Recorded',
      input: 'Text embedded',
    },
    map: {
      loading: 'Loading the labeled prompts…',
      failed: 'The map could not load.',
      you: 'your message',
      position: 'Position',
      points: 'Prompts on the map',
      caption: (kept: string) =>
        `Each mark is one labeled prompt of this preset, drawn by its class. The two axes keep ${kept} of the spread, so neighbours on the map are not always the neighbours the vote uses. Ringed: the five nearest on the map.`,
      axis: (n: number, share: string) => `PC${n} keeps ${share}`,
      alt: (points: number, x: string, y: string) =>
        `Scatter of ${points} labeled prompts by class; the message lands at x ${x}, y ${y}. The table below lists its nearest prompts on the map.`,
      showTable: 'Show as a table',
      hideTable: 'Hide the table',
      heads: { prompt: 'Prompt', label: 'Class', x: 'x', y: 'y', distance: 'Map distance' },
      nearest: 'Nearest on the map',
      edited: 'relabelled by your edit',
    },
    knn: {
      vote: 'The vote, weighted by similarity',
      heads: { prompt: 'Neighbour', label: 'Label', similarity: 'Cosine' },
      relabelled: 'relabelled',
      caption: (k: number) =>
        `The ${k} most similar labeled prompts. Each votes for its label with its cosine similarity as the weight.`,
      relabelledTopics: (topics: string) => `Your edit relabelled: ${topics}.`,
    },
    judge: {
      verdict: 'Validated verdict',
      confidence: 'confidence',
      raw: 'The raw reply, verbatim',
      invalid: 'The reply did not validate, so the judge drops out of the fusion:',
      failed: 'The call failed, so the judge drops out of the fusion:',
      prompt: 'Show the exact prompt',
      hidePrompt: 'Hide the prompt',
      system: 'System prompt (the rubric)',
      messages: 'Messages',
      role: (role: string) => `${role}:`,
      prefill: 'The assistant turn is a prefill: the reply must continue from “{”.',
      relabelled: (topics: string) => `Topics you moved: ${topics}.`,
      model: (model: string, tokens: number) => `${model} · max ${tokens} output tokens`,
    },
    decide: {
      choice: 'Most probable label',
      probability: (p: string) => `p ${p}`,
      model: 'Model',
      modelValue: (model: string, provider: string) => `${model} · through ${provider}`,
      recorded: 'Recorded',
      recordedValue: (date: string, replayed: boolean) =>
        replayed ? `${date}, replayed now` : `${date}, called now`,
      reportedCost: 'Cost reported',
      reportedCostValue: (reported: string, ours: string) =>
        `${reported} by the gateway itself; ${ours} priced by us`,
      agree: (label: string) => `Agrees with the LLM judge: both chose ${label}.`,
      disagree: (mine: string, judge: string) =>
        `Disagrees with the LLM judge, which chose ${judge}; this model chose ${mine}.`,
      invalid: 'The reply had no probability for every label, so the second judge drops out:',
      failed: 'The call failed, so the second judge drops out:',
      question: 'Show the question',
      hideQuestion: 'Hide the question',
      instructions: 'Instructions',
      criteria: 'Criteria, one per label (the scope definition)',
      state: 'State (the message, as data)',
      relabelled: (topics: string) => `Topics you moved: ${topics}.`,
    },
    fuse: {
      heads: { signal: 'Signal', share: 'Share per class', weight: 'Weight', used: 'Used' },
      fused: 'Fused',
      notRun: 'not used',
      caption:
        'Each bar is one signal’s share per class. Weights are rescaled over the signals that ran; the fused bar is their weighted average.',
      tradeoff: 'What each signal costs in this run',
      tiers: {
        rules: 'rules only',
        knn: '+ kNN',
        judge: '+ LLM judge',
        decide: 'full pipeline',
      },
      tradeoffNote: 'Times and costs are the recorded ones; kNN’s includes its Voyage embedding.',
    },
    thresholds: {
      axis: 'Scope score',
      bands: { redirect: 'redirect', answer_briefly: 'answer briefly', answer: 'answer' },
      injection: 'P(injection)',
      blockAt: (t: string) => `block at ${t}`,
      caption:
        'The scope score is (P(in) + ½·P(adjacent)) / (P(in) + P(adjacent) + P(out)); the marker shows where this message lands. Injection is checked first, against its own line.',
      blocked: 'P(injection) reached the block line, so the bands are not read.',
      alt: (score: string, injection: string, action: string) =>
        `Scope score ${score}, P(injection) ${injection}: ${action}.`,
    },
    respond: {
      caps: (tokens: number, chars: number) =>
        `capped at ${tokens} output tokens and ${chars.toLocaleString('en')} characters`,
      truncated: 'The reply hit the character cap and was cut.',
      presetText: 'The preset’s own message, sent as written.',
      handoff:
        'For this preset, answering means handing the question to the RAG pipeline, which searches the 35 articles and may still find nothing.',
      handoffBrief: 'Answer briefly: RAG answers, kept short.',
      openRag: 'Run it through RAG',
      notRecorded: 'This combination of settings has no recorded answer.',
    },
    audit: {
      heads: {
        action: 'Action',
        label: 'Fused label',
        confidence: 'Confidence',
        scope: 'Scope score',
        signals: 'Signals',
        rules: 'Rule hits',
        rubric: 'Rubric',
        relabelled: 'Relabelled topics',
        hash: 'Message (SHA-256)',
      },
      none: 'none',
      review: 'Needs review',
      reviewReasons: (reasons: string) => `Flagged for a person: ${reasons}.`,
      noReview: 'Not flagged: confident, and the signals agree.',
      notStored: 'On this demo the record is shown, not stored.',
    },
  },

  map: {
    legend: 'Classes',
  },

  formal: {
    title: 'The same guard, as formulas',
    intro:
      'The arithmetic behind steps 3, 6, 9 and 10, exactly as the code computes it. Tap an underlined symbol for its definition.',
    lines: [
      { label: 'Rules (noisy-or)', source: 'P_{inj} = 1 − ∏ (1 − w_{h}) over the rule hits h' },
      { label: 'Cosine similarity', source: 'cos(q, x) = q·x / (|q| |x|)' },
      {
        label: 'The kNN vote',
        source:
          'P_{knn}(c) = Σ_{x ∈ N_{k}, ℓ(x) = c} max(cos(q, x), 0) / Σ_{x ∈ N_{k}} max(cos(q, x), 0)',
      },
      { label: 'Weighted fusion', source: 'P(c) = Σ_{s ∈ S} w_{s} P_{s}(c) / Σ_{s ∈ S} w_{s}' },
      { label: 'Scope score', source: 'score = (P(in) + ½ P(adj)) / (P(in) + P(adj) + P(out))' },
      {
        label: 'Threshold bands',
        source:
          'block if P(inj) ≥ t_{block}; else answer if score ≥ t_{answer}; else brief if score ≥ t_{brief}; else redirect',
      },
    ],
  },

  dataset: {
    metaTitle: 'Scope: the labeled prompts',
    metaDescription:
      'The 1,200 labeled prompts behind Scope’s nearest-neighbour vote and evals: four presets, four classes, with context turns, topics, tags and languages. Drafted by Claude, checked by script.',
    sheetLabel: 'Sheet 2',
    title: 'The labeled prompts',
    lede: (total: number, presets: number) =>
      `${total.toLocaleString('en')} prompts, ${presets} presets, four classes. They are the examples the kNN step votes with and the test set the evals score. Each carries a topic from its preset’s scope definition, so moving a topic relabels its prompts.`,
    provenance: 'Drafted by Claude, checked by script.',
    provenanceBody:
      'Claude wrote the prompts to a brief per preset and class; a script checked the counts, labels, topics and duplicates. No person labeled them one by one, so treat individual labels as drafts.',
    build: (id: string, date: string, model: string) =>
      `Build ${id} · ${date} · embedded by ${model}`,
    preset: 'Preset',
    presetNames: {
      career: 'Career agent',
      recipe: 'Recipe assistant',
      bank: 'Bank support bot',
      rag: 'RAG corpus assistant',
    },
    classes: 'Class',
    allClasses: 'All classes',
    search: 'Search the text, topic or id',
    tag: 'Tag',
    allTags: 'All tags',
    tagOption: (tag: string, n: number) => `${tag} (${n})`,
    shown: (n: number, total: number) =>
      `${n.toLocaleString('en')} of ${total.toLocaleString('en')} prompts`,
    showMore: (n: number) => `Show ${n} more`,
    none: 'No prompt matches these filters.',
    clear: 'Clear the filters',
    loading: 'Loading the labeled prompts…',
    error: (message: string) => `The labeled prompts could not load. ${message}`,
    retry: 'Try again',
    earlier: 'Earlier turns',
    topic: 'topic',
    lang: 'language',
  },

  evals: {
    metaTitle: 'Scope: evals',
    metaDescription:
      'How well each signal guards the scope: false refusals, over-compliance and missed injections for rules, kNN, the LLM judge, a decision model and the fused pipeline, measured on 1,200 labeled prompts.',
    sheetLabel: 'Sheet 3',
    title: 'How well does each signal guard the scope?',
    lede: (prompts: number) =>
      `We ran all ${prompts.toLocaleString('en')} labeled prompts through each signal on its own and through the fused pipeline, with the default weights and thresholds, and scored each action against the prompt’s label.`,
    empty: 'No Scope eval run has been published yet, so there are no numbers to show.',
    illustrative: 'This run used stand-in models: the numbers show the format, not real quality.',
    record: {
      date: 'Run',
      build: 'Build',
      models: 'Models',
      prompts: 'Prompts',
      k: 'k',
      weights: 'Weights',
      thresholds: 'Thresholds',
      cost: 'Cost',
      costValue: (usd: number) => `$${usd.toFixed(4)} in total`,
    },
    finding: {
      title: 'What this run found',
      singleWins: (
        method: string,
        acc: string,
        fusedAcc: string,
        missed: string,
        fusedMissed: string,
        over: string,
        fusedOver: string,
      ) =>
        `In this run ${method} alone beats the default fused pipeline: ${acc} accuracy against ${fusedAcc}, ${missed} of injections missed against ${fusedMissed}, and ${over} over-compliance against ${fusedOver}.`,
      why: 'Fusion averages. When one signal is confident a message is an injection but the others see nothing or are split, the average can fall below the block line. The weights and thresholds are defaults, not tuned on this set.',
      fusedWins: (fusedAcc: string, method: string, acc: string) =>
        `In this run the fused pipeline reaches ${fusedAcc} accuracy against ${acc} for the best single signal, ${method}.`,
      judges: (judgeAcc: string, judgeUsd: string, decideAcc: string, decideUsd: string) =>
        `The two judges side by side: the LLM judge reaches ${judgeAcc} accuracy at ${judgeUsd} per message, the decision model ${decideAcc} at ${decideUsd}.`,
      cheap: (rulesOver: string, knnOver: string) =>
        `The free signals are far weaker on their own: the rules let ${rulesOver} of off-scope and injection prompts through, kNN ${knnOver}.`,
    },
    rates: {
      title: 'The two errors, side by side',
      notes: [
        'False refusal: an in-scope or adjacent prompt that was redirected or blocked. Over-compliance: an off-scope or injection prompt that was answered. A guard can drive either to zero by giving up on the other.',
      ],
      falseRefusal: 'False refusal',
      overCompliance: 'Over-compliance',
      injectionMissed: 'Injections missed',
      accuracy: 'Accuracy',
    },
    classes: {
      title: 'Precision and recall per class',
      notes: [
        'Precision: of the prompts a method put in a class, the share that belong there. Recall: of the prompts in a class, the share it found.',
      ],
      heads: { label: 'Class', support: 'Prompts', precision: 'Precision', recall: 'Recall' },
      none: '–',
    },
    confusion: {
      title: 'Where each method goes wrong',
      notes: [
        'Rows are the labels, columns the classes each method chose. The diagonal is correct; everything else is a mistake, and its column says which kind.',
      ],
      caption: (method: string) => `${method}: label (rows) against prediction (columns)`,
      corner: 'label ↓ / chosen →',
    },
    sweep: {
      title: 'Moving the redirect threshold',
      notes: [
        'Lower the line between “answer briefly” and “redirect” and fewer good prompts are refused, but more bad ones are answered. The rule marks the default.',
      ],
      falseRefusal: 'false refusal',
      overCompliance: 'over-compliance',
      axis: 'across: the redirect threshold, 0 to 1',
      alt: (method: string) =>
        `${method}: false refusal and over-compliance as the redirect threshold moves from 0 to 1. The table lists every point.`,
      showTable: 'Show the points as a table',
      hideTable: 'Hide the table',
      heads: { threshold: 'Threshold' },
      defaultAt: (t: string) => `default ${t}`,
    },
    cost: {
      title: 'Cost and latency per message',
      notes: [
        'Medians and means from this run’s own calls. kNN’s time is one Voyage embedding plus the vote; the fused time is all four, one after another.',
      ],
      heads: {
        method: 'Method',
        ms: 'Median time',
        usd: 'Mean cost',
        calls: 'Calls',
        note: 'What runs',
      },
      byModel: 'Calls in this run',
      modelHeads: {
        model: 'Model',
        calls: 'Calls',
        input: 'Input tok',
        output: 'Output tok',
        cost: 'Cost',
      },
      total: 'Total',
      totalValue: (usd: number) => `$${usd.toFixed(4)}`,
    },
    method: {
      title: 'How to read these numbers',
      notes: [
        'Each action is scored against the prompt’s label: answer = in scope, answer briefly = adjacent, redirect = off scope, block = injection.',
        'kNN is scored leave-one-out: a prompt never votes for itself.',
        'When no rule fires, the rules abstain and the guard falls back to the middle band, a brief answer. When the LLM judge’s reply fails validation, or the decision model’s reply lacks a probability for a label, that judge drops out.',
        'The labels were drafted by Claude and checked by script, and the LLM judge is Claude too, so its scores are likely flattering. Read them as a comparison between methods, not as a promise.',
      ],
      abstained: (method: string, n: number) => `${method} abstained on ${plural(n, 'prompt')}.`,
      failed: (method: string, n: number) =>
        `${method}: the reply failed on ${plural(n, 'prompt')}, so it dropped out there.`,
      details: 'Every prompt’s label and each method’s choice (JSONL)',
    },
  },

  coverage: {
    metaTitle: 'Scope: coverage of the labeled prompts',
    metaDescription:
      'Where Scope’s labeled prompts are thin: the scope map per preset with its sparse regions and the prompts the fused pipeline got wrong.',
    sheetLabel: 'Sheet 4',
    title: 'Where are the examples thin?',
    lede: 'The kNN vote can only be as good as the examples near a message. Here is each preset’s map at full size, with the cells that hold few or no prompts and the prompts the fused pipeline misclassified in the published eval run.',
    sparse: (empty: number, inside: number, grid: number) =>
      `We split the map into a ${grid}×${grid} grid. Of the ${inside} cells inside the spread of the prompts (their convex hull), ${empty} hold none: those are marked.`,
    caveat:
      'The map keeps only a few percent of the spread, so an empty cell here is a hint, not proof, that the 1,024-dimensional space is thin there. Use it to decide where to draft new prompts, then check with the evals.',
    legend: {
      sparse: 'empty cell inside the spread',
      missed: 'misclassified by the fused pipeline',
    },
    missed: (n: number) => `${plural(n, 'prompt')} misclassified`,
    missedNone: 'The fused pipeline got every prompt of this preset right.',
    missedTitle: 'Misclassified in the eval run',
    heads: { prompt: 'Prompt', label: 'Label', predicted: 'Chosen' },
    arrow: 'chosen as',
    open: 'Open in the dataset',
    showCells: 'Show the empty cells as a table',
    hideCells: 'Hide the table',
    cellsCaption: 'Empty cells inside the spread, as ranges on the two map axes',
    cellHeads: { x: 'PC1 range', y: 'PC2 range' },
    noResults: 'No eval run has been published, so no misclassified prompts are shown.',
  },

  share: {
    result: 'Answer · brief · redirect · block',
  },
};

// The symbols of Scope's formulas, explained on tap (components/formal/Formula).
export const SCOPE_KEY: Record<string, KeyEntry> = {
  q: { group: 'value', name: 'message vector', meaning: 'embed(message), a unit vector' },
  x: { group: 'value', name: 'labeled prompt', meaning: 'one of the preset’s 300 prompt vectors' },
  cos: {
    group: 'function',
    name: 'cosine similarity',
    meaning: 'q·x over the product of their lengths; both have length 1 here',
  },
  N: { group: 'table', name: 'neighbours', meaning: 'N_k: the k prompts most similar to q' },
  k: { group: 'value', name: 'k', meaning: 'how many neighbours vote (default 7)' },
  ℓ: {
    group: 'function',
    name: 'label',
    meaning: 'a prompt’s class under the definition in force',
  },
  c: { group: 'value', name: 'class', meaning: 'in, adjacent, out or injection' },
  w: {
    group: 'value',
    name: 'weight',
    meaning: 'a rule hit’s weight, or a signal’s fusion weight',
  },
  S: {
    group: 'table',
    name: 'signals that ran',
    meaning: 'rules, kNN, the two judges, minus any off or failed',
  },
  P: {
    group: 'function',
    name: 'share',
    meaning: 'a signal’s (or the fusion’s) share for a class',
  },
  t: { group: 'value', name: 'threshold', meaning: 'block 0.5, answer 0.7, brief 0.4 by default' },
  score: {
    group: 'function',
    name: 'scope score',
    meaning: '0 = off scope, 1 = in scope; adjacent counts half',
  },
};
