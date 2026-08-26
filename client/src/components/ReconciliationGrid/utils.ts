import type { ReconciliationMatch } from '../../types';

export const getFilteredMatches = (matches: ReconciliationMatch[], activeFilter: string, searchQuery: string) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return matches.filter((match) => {
    if (activeFilter !== 'ALL' && match.status !== activeFilter) return false;
    if (!normalizedQuery) return true;

    const internalReference = match.internalRecord?.externalRefId.toLowerCase() ?? '';
    const externalReference = match.externalRecord?.externalRefId.toLowerCase() ?? '';
    const instrument = (match.internalRecord?.instrument ?? match.externalRecord?.instrument ?? '').toLowerCase();

    return (
      internalReference.includes(normalizedQuery) ||
      externalReference.includes(normalizedQuery) ||
      instrument.includes(normalizedQuery)
    );
  });
};
