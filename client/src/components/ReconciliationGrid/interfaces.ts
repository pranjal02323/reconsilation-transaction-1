import type { MatchStatus, ReconciliationMatch } from '../../types';

export interface ReconciliationGridProps {
  matches: ReconciliationMatch[];
  activeFilter: MatchStatus | 'ALL';
  onInspect: (match: ReconciliationMatch) => void;
  onResolve: (match: ReconciliationMatch) => void;
}
