import { RunReportResponse } from './types';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  API_ERROR_MESSAGE,
  HTTP_METHOD,
  JSON_HEADERS,
} from './constants/app-constants';

export async function fetchLatestReport(): Promise<RunReportResponse | null> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LATEST}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(API_ERROR_MESSAGE.FETCH_LATEST);
  return res.json();
}

export async function triggerReconciliationRun(): Promise<RunReportResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RUN}`, { method: HTTP_METHOD.POST });
  if (!res.ok) throw new Error(API_ERROR_MESSAGE.RUN);
  return res.json();
}

export async function uploadCSVFile(file: File, source: 'INTERNAL' | 'EXTERNAL'): Promise<RunReportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD}`, {
    method: HTTP_METHOD.POST,
    body: formData,
  });

  if (!res.ok) throw new Error(API_ERROR_MESSAGE.UPLOAD);
  const data = await res.json();
  return data.report;
}

export async function submitManualResolution(payload: {
  internalRefId?: string;
  externalRefId?: string;
  resolutionType: 'FORCE_MATCH' | 'ACCEPT_UNMATCHED' | 'IGNORE';
  reason: string;
}): Promise<RunReportResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESOLVE}`, {
    method: HTTP_METHOD.POST,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(API_ERROR_MESSAGE.RESOLVE);
  return res.json();
}

export async function seedSampleData(): Promise<RunReportResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEED}`, { method: HTTP_METHOD.POST });
  if (!res.ok) throw new Error(API_ERROR_MESSAGE.SEED);
  return res.json();
}

export async function resetSystem(): Promise<RunReportResponse | null> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESET}`, { method: HTTP_METHOD.POST });
  if (!res.ok) throw new Error(API_ERROR_MESSAGE.RESET);
  return fetchLatestReport();
}
