export interface NavbarProps {
  onRunReconciliation: () => void;
  onSeedData: () => void;
  onResetData: () => void;
  isLoading: boolean;
  lastRunAt?: string;
}
