import { apiUrl } from '@/lib/api';

import type { Dataset, ScopeConfig } from './types';

export const fetchScopeConfig = async (signal?: AbortSignal): Promise<ScopeConfig> => {
  const response = await fetch(apiUrl('/api/scope/config'), { signal });
  if (!response.ok) throw new Error(`The API answered ${response.status}.`);
  return (await response.json()) as ScopeConfig;
};

// The labeled prompts ship with the site (public/scope/dataset.json), so they load without the
// API. Fetched once per page; a failed request is forgotten so the next caller can retry.
let datasetRequest: Promise<Dataset> | null = null;

export const fetchDataset = (): Promise<Dataset> => {
  if (datasetRequest) return datasetRequest;
  const request = fetch('/scope/dataset.json').then(async (response) => {
    if (!response.ok) throw new Error(`The dataset answered ${response.status}.`);
    return (await response.json()) as Dataset;
  });
  request.catch(() => {
    datasetRequest = null;
  });
  datasetRequest = request;
  return request;
};

export const clearDatasetCache = () => {
  datasetRequest = null;
};
