export type MatchStatus =
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

export interface TransactionRecord {
  id: string;
  source: 'INTERNAL' | 'EXTERNAL';
  externalRefId: string;
  tradedAt: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  status: 'SETTLED' | 'CANCELLED' | 'PENDING';
}

export interface ReconciliationMatch {
  id: string;
  status: MatchStatus;
  diffs: FieldDiff[];
  summaryNote: string;
  internalRecord?: TransactionRecord;
  externalRecord?: TransactionRecord;
  manualResolutionDetails?: {
    resolutionType: string;
    reason: string;
  };
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

export interface LoadedFileMeta {
  filename: string;
  uploadedAt: string;
  count: number;
}

export interface RunReportResponse {
  summary: ReconciliationSummary;
  matches: ReconciliationMatch[];
  files?: {
    internal: LoadedFileMeta | null;
    external: LoadedFileMeta | null;
  };
}
