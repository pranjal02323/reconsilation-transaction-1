import type { ReconciliationMatch } from '../../types';

export type ResolutionType = 'FORCE_MATCH' | 'ACCEPT_UNMATCHED' | 'IGNORE';

export interface ManualResolutionPayload {
  internalRefId?: string;
  externalRefId?: string;
  resolutionType: ResolutionType;
  reason: string;
}

export interface ManualResolutionModalProps {
  match: ReconciliationMatch | null;
  allMatches: ReconciliationMatch[];
  onClose: () => void;
  onSubmit: (payload: ManualResolutionPayload) => void;
  isSubmitting: boolean;
}
