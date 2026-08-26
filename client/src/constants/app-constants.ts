export const API_BASE_URL = import.meta.env.VITE_BASE_URL ?? '/api/reconciliation';

export const API_ENDPOINTS = {
  LATEST: '/latest',
  RUN: '/run',
  UPLOAD: '/upload',
  RESOLVE: '/resolve',
  SEED: '/seed',
  RESET: '/reset',
} as const;

export const HTTP_METHOD = {
  POST: 'POST',
} as const;

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const;

export const API_ERROR_MESSAGE = {
  FETCH_LATEST: 'Failed to fetch latest reconciliation report',
  RUN: 'Failed to execute reconciliation run',
  UPLOAD: 'Failed to upload CSV file',
  RESOLVE: 'Failed to submit manual resolution',
  SEED: 'Failed to seed assignment sample data',
  RESET: 'Failed to reset system database',
} as const;
