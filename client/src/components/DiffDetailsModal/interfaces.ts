import type { ReconciliationMatch } from '../../types';

export interface DiffDetailsModalProps {
  match: ReconciliationMatch | null;
  onClose: () => void;
}
