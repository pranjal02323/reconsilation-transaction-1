import type { ReconciliationMatch } from '../../types';

export const getCandidateMatches = (match: ReconciliationMatch, allMatches: ReconciliationMatch[]) => {
  if (match.status === 'UNMATCHED_INTERNAL') {
    return allMatches.filter((candidate) => candidate.status === 'UNMATCHED_EXTERNAL' && candidate.externalRecord);
  }

  if (match.status === 'UNMATCHED_EXTERNAL') {
    return allMatches.filter((candidate) => candidate.status === 'UNMATCHED_INTERNAL' && candidate.internalRecord);
  }

  return [];
};
