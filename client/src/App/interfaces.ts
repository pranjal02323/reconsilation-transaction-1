import type { ReconciliationMatch } from '../types';

export type UploadSource = 'INTERNAL' | 'EXTERNAL';

export interface ManualResolutionPayload {
  internalRefId?: string;
  externalRefId?: string;
  resolutionType: 'FORCE_MATCH' | 'ACCEPT_UNMATCHED' | 'IGNORE';
  reason: string;
}

export interface AppModalState {
  inspectMatch: ReconciliationMatch | null;
  resolveMatch: ReconciliationMatch | null;
}
