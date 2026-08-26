import type { MatchStatus, ReconciliationSummary } from '../../types';

export interface SummaryCardsProps {
  summary?: ReconciliationSummary;
  activeFilter: MatchStatus | 'ALL';
  onFilterChange: (filter: MatchStatus | 'ALL') => void;
}
