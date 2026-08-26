import type { FieldDiff } from '../../types';

export const getVarianceLabel = (diff: FieldDiff) => {
  if (diff.field === 'grossAmount') return `Diff: $${diff.delta}`;
  if (diff.field === 'tradedAt') return `Drift: ${Math.round((diff.delta ?? 0) / 60)} min`;
  return `Diff: ${diff.delta}`;
};
