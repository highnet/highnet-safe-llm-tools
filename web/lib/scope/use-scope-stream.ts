'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { SCOPE } from '@/content/scope';
import { apiUrl } from '@/lib/api';
import type { RunDone, ScopeTraceEvent } from '@/lib/generated/scope-trace';
import type { RunStatus } from '@/lib/use-trace-stream';

import { runQuery, type ScopeSettings } from './url-state';

export type ScopeRunInput = ScopeSettings & { example: string };

export type ScopeTraceState = {
  status: RunStatus;
  input: ScopeRunInput | null;
  events: ScopeTraceEvent[];
  done: RunDone | null;
  connectionError: string | null;
};

const initialState: ScopeTraceState = {
  status: 'idle',
  input: null,
  events: [],
  done: null,
  connectionError: null,
};

const STREAM_ERRORS = SCOPE.streamErrors;

const parse = <T>(event: Event) => JSON.parse((event as MessageEvent<string>).data) as T;

// One EventSource per replay: a trace event per step, then done (as on the RAG pipeline).
export const useScopeStream = () => {
  const sourceRef = useRef<EventSource | null>(null);
  const [state, setState] = useState<ScopeTraceState>(initialState);

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  const run = useCallback(
    (input: ScopeRunInput) => {
      close();
      setState({ ...initialState, status: 'running', input });
      const source = new EventSource(apiUrl(`/api/scope/run?${runQuery(input)}`));
      sourceRef.current = source;
      source.addEventListener('trace', (event) => {
        const trace = parse<ScopeTraceEvent>(event);
        setState((s) => ({ ...s, events: [...s.events, trace].sort((a, b) => a.seq - b.seq) }));
      });
      source.addEventListener('done', (event) => {
        const done = parse<RunDone>(event);
        close();
        // A step can fail (the judge's reply, say) while the run still decides: the steps say so.
        setState((s) => ({ ...s, done, status: 'finished' }));
      });
      source.onerror = () => {
        close();
        setState((s) =>
          s.status === 'running'
            ? { ...s, status: 'failed', connectionError: STREAM_ERRORS.closed }
            : s,
        );
      };
    },
    [close],
  );

  const cancel = useCallback(() => {
    close();
    setState((s) =>
      s.status === 'running'
        ? { ...s, status: 'failed', connectionError: STREAM_ERRORS.stopped }
        : s,
    );
  }, [close]);

  // A new preset clears the sheet: the old run belongs to another product.
  const reset = useCallback(() => {
    close();
    setState(initialState);
  }, [close]);

  useEffect(() => close, [close]);

  return { ...state, run, cancel, reset };
};
