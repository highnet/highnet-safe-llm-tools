'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchDataset } from './api';
import type { Dataset } from './types';

export type DatasetLoad =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Dataset };

// The labeled prompts, loaded once from the site itself; `retry` tries a failed load again.
export const useDataset = () => {
  const [state, setState] = useState<DatasetLoad>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    fetchDataset()
      .then((data) => live && setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (live) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
};
