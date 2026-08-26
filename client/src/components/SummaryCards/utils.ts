import type { ReconciliationSummary } from '../../types';

export const getTotalMatchesEvaluated = (summary: ReconciliationSummary) =>
  summary.exactMatchesCount +
  summary.toleratedMatchesCount +
  summary.discrepanciesCount +
  summary.unmatchedInternalCount +
  summary.unmatchedExternalCount +
  summary.manuallyResolvedCount +
  summary.cancelledIgnoredCount;
