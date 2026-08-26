export type TransactionSide = 'BUY' | 'SELL';
export type TransactionStatus = 'SETTLED' | 'CANCELLED' | 'PENDING';
export type SourceType = 'INTERNAL' | 'EXTERNAL';

export interface NormalizedTransaction {
  id: string;
  fileId?: string;
  source: SourceType;
  externalRefId: string;
  tradedAt: string;
  instrument: string;
  side: TransactionSide;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  status: TransactionStatus;
  version?: number;
  isLatest?: boolean;
}

export interface ToleranceConfig {
  amountTolerance: number;
  timestampToleranceSeconds: number;
}

export type MatchResultStatus =
  | 'EXACT_MATCH'
  | 'TOLERATED_MATCH'
  | 'DISCREPANCY'
  | 'UNMATCHED_INTERNAL'
  | 'UNMATCHED_EXTERNAL'
  | 'MANUALLY_RESOLVED'
  | 'IGNORED_CANCELLED';

export interface FieldDiff {
  field: string;
  internalValue: string | number;
  externalValue: string | number;
  delta?: number;
  isWithinTolerance: boolean;
  message?: string;
}

export interface ReconciliationMatch {
  id: string;
  internalRecord?: NormalizedTransaction;
  externalRecord?: NormalizedTransaction;
  status: MatchResultStatus;
  diffs: FieldDiff[];
  summaryNote: string;
  manualResolutionDetails?: {
    resolutionType: string;
    reason: string;
  };
}

export type ManualResolutionType = 'FORCE_MATCH' | 'ACCEPT_UNMATCHED' | 'IGNORE';

export interface ManualResolution {
  id: string;
  internalRefId?: string;
  externalRefId?: string;
  resolutionType: ManualResolutionType;
  reason: string;
  createdAt: string;
  createdBy?: string;
}

export interface ReconciliationSummary {
  runId: string;
  totalInternalRecords: number;
  totalExternalRecords: number;
  exactMatchesCount: number;
  toleratedMatchesCount: number;
  discrepanciesCount: number;
  unmatchedInternalCount: number;
  unmatchedExternalCount: number;
  manuallyResolvedCount: number;
  cancelledIgnoredCount: number;
  runAt: string;
}
